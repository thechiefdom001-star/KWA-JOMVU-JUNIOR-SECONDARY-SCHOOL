import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import htm from 'htm';
import { Storage } from '../lib/storage.js';

const html = htm.bind(h);

export const Settings = ({ data, setData }) => {
    if (!data || !data.settings) {
        return html`<div class="p-12 text-center text-slate-400 font-bold">Initializing Settings...</div>`;
    }

    const [updating, setUpdating] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState([]);
    const [editingFeeGrade, setEditingFeeGrade] = useState(null);
    const [showImportModal, setShowImportModal] = useState(false);
    const [hiddenFeeItems, setHiddenFeeItems] = useState({});
    const [pendingImportData, setPendingImportData] = useState(null);
    const [importSelections, setImportSelections] = useState({
        students: true,
        marks: true,
        staff: true,
        finance: true,
        settings: true,
        modules: true
    });
    
    const [localSettings, setLocalSettings] = useState(data.settings);
    useEffect(() => {
        setLocalSettings(data.settings || {});
    }, [data.settings]);
    const settings = localSettings;

    const updateFee = (grade, field, val) => {
        const newStructures = (settings.feeStructures || []).map(f => 
            f.grade === grade ? { ...f, [field]: Number(val) } : f
        );
        setData({
            ...data,
            settings: { ...settings, feeStructures: newStructures }
        });
    };

    const handleUpdateProfile = () => {
        // Apply local settings to global data when saving
        setUpdating(true);
        setData({ ...data, settings: { ...settings } });
        setTimeout(() => setUpdating(false), 1000);
    };

    const handleImageUpload = async (e, field) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            const url = await window.websim.upload(file);
            setData({
                ...data, 
                settings: { ...settings, [field]: url }
            });
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload image. Please try again.');
        }
    };

    const feeColumns = [
        { key: 'admission', label: 'Adm' },
        { key: 'diary', label: 'Diary' },
        { key: 'development', label: 'Dev' },
        { key: 't1', label: 'T1 Tuition' },
        { key: 't2', label: 'T2 Tuition' },
        { key: 't3', label: 'T3 Tuition' },
        { key: 'boarding', label: 'Board' },
        { key: 'breakfast', label: 'Brkfast' },
        { key: 'lunch', label: 'Lunch' },
        { key: 'trip', label: 'Trip' },
        { key: 'bookFund', label: 'Books' },
        { key: 'caution', label: 'Caution' },
        { key: 'uniform', label: 'Uniform' },
        { key: 'studentCard', label: 'School ID' },
        { key: 'remedial', label: 'Remed' },
        { key: 'assessmentFee', label: 'Assessment Fee' },
        { key: 'projectFee', label: 'Project' },
        { key: 'activityFees', label: 'Activity Fees' },
        { key: 'tieAndBadge', label: 'Tie & Badge' },
        { key: 'academicSupport', label: 'Academic Support' },
        { key: 'pta', label: 'PTA' }
    ];

    const handleExport = () => {
        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `edutrack_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImportFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target.result);
                setPendingImportData(importedData);
                setShowImportModal(true);
            } catch (err) {
                alert('Invalid backup file.');
            }
        };
        reader.readAsText(file);
        e.target.value = ''; // Reset input
    };

    const processImport = () => {
        if (!pendingImportData) return;

        let newData = { ...data };

        if (importSelections.students) {
            newData.students = pendingImportData.students || [];
        }
        if (importSelections.marks) {
            newData.assessments = pendingImportData.assessments || [];
            newData.remarks = pendingImportData.remarks || [];
        }
        if (importSelections.staff) {
            newData.teachers = pendingImportData.teachers || [];
            newData.staff = pendingImportData.staff || [];
        }
        if (importSelections.finance) {
            newData.payments = pendingImportData.payments || [];
            newData.payroll = pendingImportData.payroll || [];
        }
        if (importSelections.settings) {
            newData.settings = { 
                ...pendingImportData.settings,
                // Keep logo if not provided in import
                schoolLogo: pendingImportData.settings?.schoolLogo || settings.schoolLogo
            };
        }
        if (importSelections.modules) {
            newData.transport = pendingImportData.transport || { routes: [], assignments: [] };
            newData.library = pendingImportData.library || { books: [], transactions: [] };
        }

        setData(newData);
        setShowImportModal(false);
        setPendingImportData(null);
        alert('Selected data has been imported successfully!');
    };

    return html`
        <div class="space-y-8 pb-20">
            <div class="no-print">
                <h2 class="text-2xl font-bold">School Settings</h2>
                <p class="text-slate-500">Configure school profile, themes, and complex fee structures</p>
            </div>

            <div class="grid grid-cols-1 gap-8">
                <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 class="font-bold mb-6 flex items-center gap-2">
                        <span class="w-4 h-4 bg-blue-500 rounded text-white flex items-center justify-center text-[10px]">🎨</span>
                        Appearance & Branding
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div class="space-y-1">
                            <label class="text-xs font-bold text-slate-500 uppercase">System Theme</label>
                            <select 
                                class="w-full p-3 bg-slate-50 rounded-xl outline-none border border-slate-100 focus:border-blue-400"
                                value=${settings.theme || 'light'}
                                onChange=${(e) => setData({...data, settings: {...settings, theme: e.target.value}})}
                            >
                                <option value="light">☀️ Light Mode</option>
                                <option value="dark">🌙 Dark Mode</option>
                            </select>
                        </div>
                        <div class="space-y-1">
                            <label class="text-xs font-bold text-slate-500 uppercase">Primary Color</label>
                            <div class="flex gap-2">
                                <input 
                                    type="color"
                                    class="w-12 h-12 p-1 rounded-xl cursor-pointer bg-slate-50 border border-slate-100"
                                    value=${settings.primaryColor || '#2563eb'}
                                    onInput=${(e) => setData({...data, settings: {...settings, primaryColor: e.target.value}})}
                                />
                                <input 
                                    class="flex-1 p-3 bg-slate-50 rounded-xl outline-none border border-slate-100 text-xs font-mono"
                                    value=${settings.primaryColor}
                                    onInput=${(e) => setData({...data, settings: {...settings, primaryColor: e.target.value}})}
                                />
                            </div>
                        </div>
                        <div class="space-y-1">
                            <label class="text-xs font-bold text-slate-500 uppercase">Secondary Color</label>
                            <div class="flex gap-2">
                                <input 
                                    type="color"
                                    class="w-12 h-12 p-1 rounded-xl cursor-pointer bg-slate-50 border border-slate-100"
                                    value=${settings.secondaryColor || '#64748b'}
                                    onInput=${(e) => setData({...data, settings: {...settings, secondaryColor: e.target.value}})}
                                />
                                <input 
                                    class="flex-1 p-3 bg-slate-50 rounded-xl outline-none border border-slate-100 text-xs font-mono"
                                    value=${settings.secondaryColor}
                                    onInput=${(e) => setData({...data, settings: {...settings, secondaryColor: e.target.value}})}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 class="font-bold mb-4 flex items-center gap-2">
                        <span class="w-4 h-4 bg-blue-500 rounded text-white flex items-center justify-center text-[10px]">💾</span>
                        Data Management
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="p-4 border border-slate-100 rounded-xl bg-slate-50">
                            <h4 class="text-xs font-black uppercase text-slate-400 mb-2">Backup System</h4>
                            <p class="text-[10px] text-slate-500 mb-4">Export all your school data including students, marks, and financial records to a JSON file.</p>
                            <button 
                                onClick=${handleExport}
                                class="w-full py-2 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-900 transition-colors"
                            >
                                Export Data (JSON)
                            </button>
                        </div>
                        <div class="p-4 border border-slate-100 rounded-xl bg-slate-50">
                            <h4 class="text-xs font-black uppercase text-slate-400 mb-2">Restore System</h4>
                            <p class="text-[10px] text-slate-500 mb-4">Upload a previously exported backup file to restore your school database.</p>
                            <label class="block">
                                <span class="sr-only">Choose backup file</span>
                                <input 
                                    type="file" 
                                    accept=".json" 
                                    onChange=${handleImportFile}
                                    class="block w-full text-[10px] text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                                />
                            </label>
                        </div>
                    </div>
                </div>

                <div class="bg-white p-6 rounded-2xl shadow-sm border border-orange-100 bg-gradient-to-br from-white to-orange-50/30">
                    <h3 class="font-bold mb-4 flex items-center gap-2 text-orange-800">
                        <span class="w-4 h-4 bg-orange-500 rounded text-white flex items-center justify-center text-[10px]">📅</span>
                        Academic Year Transition
                    </h3>
                    <div class="space-y-4">
                        <p class="text-xs text-slate-500 leading-relaxed">
                            Closing the current academic year will create a read-only <b>Archive Snapshot</b> of all marks, payments, and payroll records. This will clear active academic data to provide a clean slate for the next year.
                        </p>
                        <div class="flex flex-col sm:flex-row items-center gap-3">
                            <div class="flex-1 w-full">
                                <label class="text-[10px] font-black text-slate-400 uppercase mb-1 block">Target Next Year</label>
                                <select 
                                    id="nextYearSelect"
                                    class="w-full p-3 bg-white border border-orange-200 rounded-xl outline-none font-black text-orange-900"
                                >
                                    ${Array.from({ length: 10 }, (_, i) => {
                                        const year = 2025 + i;
                                        return html`<option value="${year}/${year + 1}">${year}/${year + 1}</option>`;
                                    })}
                                </select>
                            </div>
                            <button 
                                onClick=${() => {
                                    const nextYear = document.getElementById('nextYearSelect').value;
                                    if(confirm(`WARNING: This will ARCHIVE all current marks and payments for ${settings.academicYear} and RESET for ${nextYear}. Proceed?`)) {
                                        const newData = Storage.archiveYear(data, nextYear);
                                        setData(newData);
                                        alert('Academic year closed successfully! You can access the records in the Archives menu.');
                                    }
                                }}
                                class="w-full sm:w-auto px-6 py-4 bg-orange-600 text-white rounded-xl font-black text-sm shadow-lg shadow-orange-100 hover:bg-orange-700 transition-all shrink-0"
                            >
                                Close Year & Archive
                            </button>
                        </div>
                    </div>
                </div>

                <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 class="font-bold mb-4 flex items-center gap-2">
                        <span class="w-4 h-4 bg-purple-500 rounded text-white flex items-center justify-center text-[10px]">K</span>
                        KNEC KJSEA Grading System
                    </h3>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                        ${[
                            { l: 'EE1', p: '8 pts', r: '90-100%', c: 'bg-green-500', t: 'Exceptional' },
                            { l: 'EE2', p: '7 pts', r: '75-89%', c: 'bg-green-400', t: 'Very Good' },
                            { l: 'ME1', p: '6 pts', r: '58-74%', c: 'bg-blue-500', t: 'Good' },
                            { l: 'ME2', p: '5 pts', r: '41-57%', c: 'bg-blue-400', t: 'Fair' },
                            { l: 'AE1', p: '4 pts', r: '31-40%', c: 'bg-yellow-500', t: 'Needs Impr.' },
                            { l: 'AE2', p: '3 pts', r: '21-30%', c: 'bg-yellow-400', t: 'Below Avg.' },
                            { l: 'BE1', p: '2 pts', r: '11-20%', c: 'bg-red-400', t: 'Well Below' },
                            { l: 'BE2', p: '1 pt', r: '1-10%', c: 'bg-red-500', t: 'Minimal' }
                        ].map(g => html`
                            <div class="p-3 border border-slate-100 rounded-xl bg-slate-50 flex items-center gap-3">
                                <div class=${`w-8 h-8 rounded-lg ${g.c} text-white flex items-center justify-center font-black text-[10px]`}>${g.l}</div>
                                <div>
                                    <p class="text-[10px] font-bold text-slate-700">${g.r}</p>
                                    <p class="text-[8px] text-slate-400 uppercase font-bold">${g.t}</p>
                                </div>
                            </div>
                        `)}
                    </div>
                </div>

                <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <h3 class="font-bold mb-6">Fee Structure per Grade (${settings.currency})</h3>
                    
                    <!-- Grade Group Cards -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        ${[
                            { id: 'pp1-pp2', label: 'PP1 - PP2', grades: ['PP1', 'PP2'], color: 'bg-pink-50 border-pink-200' },
                            { id: 'grade1-3', label: 'Grade 1 - 3', grades: ['GRADE 1', 'GRADE 2', 'GRADE 3'], color: 'bg-blue-50 border-blue-200' },
                            { id: 'grade4-6', label: 'Grade 4 - 6', grades: ['GRADE 4', 'GRADE 5', 'GRADE 6'], color: 'bg-green-50 border-green-200' },
                            { id: 'grade7-9', label: 'Grade 7 - 9', grades: ['GRADE 7', 'GRADE 8', 'GRADE 9'], color: 'bg-orange-50 border-orange-200' },
                            { id: 'grade10-12', label: 'Grade 10 - 12', grades: ['GRADE 10', 'GRADE 11', 'GRADE 12'], color: 'bg-purple-50 border-purple-200' }
                        ].map(group => {
                            const groupStructures = (settings.feeStructures || []).filter(f => group.grades.includes(f.grade));
                            const isExpanded = expandedGroups.includes(group.id);
                            const compulsoryFees = settings.compulsoryFees?.[group.id] || {};
                            
                            return html`
                                <div class="border border-slate-200 rounded-xl overflow-hidden shadow-lg shadow-slate-200/50">
                                    <div class=${`p-4 flex items-center justify-between ${group.color}`}>
                                        <div class="flex items-center gap-2">
                                            <span class="font-bold text-sm">${group.label}</span>
                                            <span class="text-xs bg-white px-2 py-0.5 rounded-full">${groupStructures.length} grades</span>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <button 
                                                onClick=${() => setExpandedGroups(isExpanded ? expandedGroups.filter(g => g !== group.id) : [...expandedGroups, group.id])}
                                                class="p-1.5 bg-white rounded-lg text-xs font-bold shadow-sm hover:bg-slate-50"
                                            >
                                                ${isExpanded ? '▲' : '▼'}
                                            </button>
                                        </div>
                                    </div>
                                    
                                    ${isExpanded && html`
                                        <div class="p-4 bg-white space-y-3 max-h-96 overflow-y-auto">
                                            ${groupStructures.length === 0 ? html`
                                                <p class="text-xs text-slate-400 text-center py-4">No fee structures defined</p>
                                            ` : groupStructures.map(fee => html`
                                                <div class="border border-slate-100 rounded-lg p-3 space-y-2">
                                                    <div class="flex items-center justify-between">
                                                        <span class="font-bold text-sm">${fee.grade}</span>
                                                        <div class="flex gap-1">
                                                            <button 
                                                                onClick=${() => setEditingFeeGrade(fee.grade)}
                                                                class="text-blue-600 text-[10px] font-bold px-2 py-1 hover:bg-blue-50 rounded"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button 
                                                                onClick=${() => {
                                                                    if (confirm('Delete this fee structure?')) {
                                                                        const newData = { ...data, settings: { ...settings, feeStructures: settings.feeStructures.filter(f => f.grade !== fee.grade) }};
                                                                        setData(newData);
                                                                    }
                                                                }}
                                                                class="text-red-500 text-[10px] font-bold px-2 py-1 hover:bg-red-50 rounded"
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div class="grid grid-cols-2 gap-2 text-[9px]">
                                                        <div class="flex justify-between bg-slate-50 p-1.5 rounded">
                                                            <span class="text-slate-500">T1 Tuition:</span>
                                                            <span class="font-bold">${(fee.t1 || 0).toLocaleString()}</span>
                                                        </div>
                                                        <div class="flex justify-between bg-slate-50 p-1.5 rounded">
                                                            <span class="text-slate-500">T2 Tuition:</span>
                                                            <span class="font-bold">${(fee.t2 || 0).toLocaleString()}</span>
                                                        </div>
                                                        <div class="flex justify-between bg-slate-50 p-1.5 rounded">
                                                            <span class="text-slate-500">T3 Tuition:</span>
                                                            <span class="font-bold">${(fee.t3 || 0).toLocaleString()}</span>
                                                        </div>
                                                        <div class="flex justify-between bg-slate-50 p-1.5 rounded">
                                                            <span class="text-slate-500">Admission:</span>
                                                            <span class="font-bold">${(fee.admission || 0).toLocaleString()}</span>
                                                        </div>
                                                        <div class="flex justify-between bg-slate-50 p-1.5 rounded">
                                                            <span class="text-slate-500">Boarding:</span>
                                                            <span class="font-bold">${(fee.boarding || 0).toLocaleString()}</span>
                                                        </div>
                                                        <div class="flex justify-between bg-slate-50 p-1.5 rounded">
                                                            <span class="text-slate-500">Development:</span>
                                                            <span class="font-bold">${(fee.development || 0).toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            `)}
                                            
                                            <!-- Fee Items Toggle Section -->
                                            <div class="border-t border-slate-100 pt-3 mt-3">
                                                <p class="text-xs font-bold text-slate-500 mb-2">Fee Items - Compulsory/Optional</p>
                                                <div class="space-y-1.5">
                                                    ${feeColumns.map(col => {
                                                        const isCompulsory = compulsoryFees[col.key] !== false;
                                                        const isHidden = (hiddenFeeItems[group.id] || []).includes(col.key);
                                                        return html`
                                                            <div key=${col.key} class=${`flex items-center justify-between bg-slate-50 rounded-lg p-2 ${isHidden ? 'opacity-40' : ''}`}>
                                                                <div class="flex items-center gap-2">
                                                                    <span class="text-[10px] font-medium">${col.label}</span>
                                                                    ${isHidden && html`<span class="text-[8px] text-red-500 font-bold">(Hidden)</span>`}
                                                                </div>
                                                                <div class="flex gap-1">
                                                                    <button 
                                                                        onClick=${() => {
                                                                            const currentCompulsory = settings.compulsoryFees || {};
                                                                            const groupCompulsory = { ...(currentCompulsory[group.id] || {}) };
                                                                            groupCompulsory[col.key] = !isCompulsory;
                                                                            setData({
                                                                                ...data,
                                                                                settings: {
                                                                                    ...settings,
                                                                                    compulsoryFees: {
                                                                                        ...currentCompulsory,
                                                                                        [group.id]: groupCompulsory
                                                                                    }
                                                                                }
                                                                            });
                                                                        }}
                                                                        class=${`text-[9px] font-bold px-2 py-1 rounded-full ${isCompulsory ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}
                                                                    >
                                                                        ${isCompulsory ? 'Compulsory' : 'Optional'}
                                                                    </button>
                                                                    <button 
                                                                        onClick=${() => {
                                                                            const currentHidden = hiddenFeeItems[group.id] || [];
                                                                            const newHidden = isHidden 
                                                                                ? currentHidden.filter(k => k !== col.key)
                                                                                : [...currentHidden, col.key];
                                                                            setHiddenFeeItems({
                                                                                ...hiddenFeeItems,
                                                                                [group.id]: newHidden
                                                                            });
                                                                        }}
                                                                        class=${`text-[9px] font-bold px-2 py-1 rounded-full ${isHidden ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                                                                    >
                                                                        ${isHidden ? 'Show' : 'Hide'}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        `;
                                                    })}
                                                </div>
                                            </div>
                                            
                                            <!-- Add/Edit Grade Button -->
                                            <button 
                                                onClick=${() => {
                                                    const gradeName = prompt('Enter grade name (e.g., GRADE 1):');
                                                    if (!gradeName) return;
                                                    const newStructure = {
                                                        grade: gradeName.toUpperCase(),
                                                        t1: 0, t2: 0, t3: 0,
                                                        admission: 0, diary: 0, development: 0,
                                                        boarding: 0, breakfast: 0, lunch: 0,
                                                        trip: 0, bookFund: 0, caution: 0,
                                                        uniform: 0, studentCard: 0, remedial: 0,
                                                        assessmentFee: 0, projectFee: 0,
                                                        activityFees: 0, tieAndBadge: 0,
                                                        academicSupport: 0, pta: 0
                                                    };
                                                    setData({
                                                        ...data,
                                                        settings: {
                                                            ...settings,
                                                            feeStructures: [...settings.feeStructures, newStructure],
                                                            grades: settings.grades.includes(gradeName.toUpperCase()) ? settings.grades : [...settings.grades, gradeName.toUpperCase()]
                                                        }
                                                    });
                                                }}
                                                class="w-full py-2 mt-3 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700"
                                            >
                                                + Add Grade to Group
                                            </button>
                                        </div>
                                    `}
                                </div>
                            `;
                        })}
                    </div>
                    
                    ${!expandedGroups.includes('pp1-pp2') && html`
                        <div class="mt-4 p-4 bg-blue-50 rounded-xl">
                            <p class="text-xs text-blue-600 font-bold">💡 Click the expand button (▼) on a grade group card to view fee details, toggle compulsory/optional fees, or add new grades.</p>
                        </div>
                    `}
                </div>

                <!-- Edit Fee Modal -->
                ${editingFeeGrade && (() => {
                    const feeStructure = settings.feeStructures.find(f => f.grade === editingFeeGrade);
                    if (!feeStructure) return null;
                    
                    const gradeGroup = [
                        { id: 'pp1-pp2', grades: ['PP1', 'PP2'] },
                        { id: 'grade1-3', grades: ['GRADE 1', 'GRADE 2', 'GRADE 3'] },
                        { id: 'grade4-6', grades: ['GRADE 4', 'GRADE 5', 'GRADE 6'] },
                        { id: 'grade7-9', grades: ['GRADE 7', 'GRADE 8', 'GRADE 9'] },
                        { id: 'grade10-12', grades: ['GRADE 10', 'GRADE 11', 'GRADE 12'] }
                    ].find(g => g.grades.includes(editingFeeGrade));
                    const groupId = gradeGroup?.id || 'pp1-pp2';
                    const groupHiddenItems = hiddenFeeItems[groupId] || [];
                    
                    return html`
                        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                            <div class="bg-white w-full max-w-2xl rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                                <div class="flex items-center justify-between mb-4">
                                    <h3 class="text-xl font-black">Edit Fees: ${editingFeeGrade}</h3>
                                    <button onClick=${() => setEditingFeeGrade(null)} class="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
                                </div>
                                <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    ${feeColumns.map(col => {
                                        const isHidden = groupHiddenItems.includes(col.key);
                                        return html`
                                            <div class=${`space-y-1 ${isHidden ? 'opacity-50' : ''}`}>
                                                <div class="flex items-center justify-between">
                                                    <label class="text-[10px] font-bold text-slate-500 uppercase">${col.label}</label>
                                                    <button 
                                                        onClick=${() => {
                                                            const currentHidden = hiddenFeeItems[groupId] || [];
                                                            const newHidden = isHidden 
                                                                ? currentHidden.filter(k => k !== col.key)
                                                                : [...currentHidden, col.key];
                                                            setHiddenFeeItems({
                                                                ...hiddenFeeItems,
                                                                [groupId]: newHidden
                                                            });
                                                        }}
                                                        class=${`text-[8px] font-bold px-1.5 py-0.5 rounded ${isHidden ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                                                    >
                                                        ${isHidden ? 'Show' : 'Hide'}
                                                    </button>
                                                </div>
                                                <input 
                                                    type="number" 
                                                    class="w-full p-2 bg-slate-50 rounded-lg text-sm font-bold border border-slate-200 focus:border-blue-500 outline-none"
                                                    value=${feeStructure[col.key] || 0}
                                                    onInput=${(e) => {
                                                        const newStructures = settings.feeStructures.map(f => 
                                                            f.grade === editingFeeGrade ? { ...f, [col.key]: Number(e.target.value) } : f
                                                        );
                                                        setData({ ...data, settings: { ...settings, feeStructures: newStructures } });
                                                    }}
                                                />
                                            </div>
                                        `;
                                    })}
                                </div>
                                <div class="flex gap-3 mt-6">
                                    <button onClick=${() => setEditingFeeGrade(null)} class="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold">Done</button>
                                </div>
                            </div>
                        </div>
                    `;
                })()}

                <!-- Selective Import Modal -->
                ${showImportModal && html`
                    <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                        <div class="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                            <h3 class="text-2xl font-black mb-2">Selective Import</h3>
                            <p class="text-slate-400 text-sm mb-6">Choose which data categories to override. Deselected categories will keep your current data.</p>
                            
                            <div class="grid grid-cols-1 gap-3 mb-8">
                                ${[
                                    { id: 'students', label: 'Students Directory', icon: '👥' },
                                    { id: 'marks', label: 'Marks & Assessments', icon: '📝' },
                                    { id: 'staff', label: 'Teachers & Staff', icon: '👨‍🏫' },
                                    { id: 'finance', label: 'Financial Records', icon: '💰' },
                                    { id: 'settings', label: 'System Settings & Fees', icon: '⚙️' },
                                    { id: 'modules', label: 'Transport & Library', icon: '🚌' }
                                ].map(cat => html`
                                    <label class=${`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                                        importSelections[cat.id] ? 'border-primary bg-blue-50/50' : 'border-slate-100 hover:border-slate-200'
                                    }`}>
                                        <div class="flex items-center gap-3">
                                            <span class="text-xl">${cat.icon}</span>
                                            <span class="font-bold text-sm text-slate-700">${cat.label}</span>
                                        </div>
                                        <input 
                                            type="checkbox" 
                                            class="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                                            checked=${importSelections[cat.id]}
                                            onChange=${() => setImportSelections({...importSelections, [cat.id]: !importSelections[cat.id]})}
                                        />
                                    </label>
                                `)}
                            </div>

                            <div class="flex gap-3">
                                <button onClick=${() => { setShowImportModal(false); setPendingImportData(null); }} class="flex-1 py-4 text-slate-500 font-bold">Cancel</button>
                                <button onClick=${processImport} class="flex-1 py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-blue-200">Import Selected</button>
                            </div>
                        </div>
                    </div>
                `}

                <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 class="font-bold mb-6">School Profile</h3>
                    <div class="space-y-6">
                        <div class="flex flex-col md:flex-row gap-6 items-center border-b pb-6">
                            <label class="relative w-24 h-24 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden cursor-pointer group">
                                <img src="${settings.schoolLogo}" class="w-full h-full object-contain" />
                                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span class="text-[10px] text-white font-bold text-center">Upload Logo</span>
                                </div>
                                <input type="file" accept="image/*" class="hidden" onChange=${(e) => handleImageUpload(e, 'schoolLogo')} />
                            </label>
                            <div class="flex-1 space-y-4 w-full">
                                <div class="space-y-1">
                                    <label class="text-xs font-bold text-slate-500 uppercase">Logo Source URL</label>
                                    <div class="flex gap-2">
                                        <input 
                                            class="flex-1 p-3 bg-slate-50 rounded-xl outline-none border border-slate-100 focus:border-blue-400 text-xs"
                                            value=${settings.schoolLogo}
                                            onInput=${(e) => setData({...data, settings: {...settings, schoolLogo: e.target.value}})}
                                            placeholder="Paste logo URL or upload"
                                        />
                                    </div>
                                    <p class="text-[10px] text-slate-400">Recommended: Transparent PNG, square aspect ratio.</p>
                                </div>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 border-b pb-6">
                            <div class="space-y-3">
                                <label class="text-xs font-bold text-slate-500 uppercase block">Principal's Signature</label>
                                <div class="flex items-center gap-4">
                                    <label class="w-24 h-12 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex items-center justify-center overflow-hidden cursor-pointer group shrink-0">
                                        <img src="${settings.principalSignature}" class="w-full h-full object-contain" />
                                        <div class="absolute w-24 h-12 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <span class="text-[8px] text-white font-bold">Upload</span>
                                        </div>
                                        <input type="file" accept="image/*" class="hidden" onChange=${(e) => handleImageUpload(e, 'principalSignature')} />
                                    </label>
                                    <input 
                                        class="flex-1 p-3 bg-slate-50 rounded-xl outline-none border border-slate-100 text-[10px]"
                                        value=${settings.principalSignature}
                                        onInput=${(e) => setData({...data, settings: {...settings, principalSignature: e.target.value}})}
                                        placeholder="Signature Image URL"
                                    />
                                </div>
                            </div>
                            <div class="space-y-3">
                                <label class="text-xs font-bold text-slate-500 uppercase block">Accounts Clerk's Signature</label>
                                <div class="flex items-center gap-4">
                                    <label class="w-24 h-12 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex items-center justify-center overflow-hidden cursor-pointer group shrink-0">
                                        <img src="${settings.clerkSignature}" class="w-full h-full object-contain" />
                                        <div class="absolute w-24 h-12 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <span class="text-[8px] text-white font-bold">Upload</span>
                                        </div>
                                        <input type="file" accept="image/*" class="hidden" onChange=${(e) => handleImageUpload(e, 'clerkSignature')} />
                                    </label>
                                    <input 
                                        class="flex-1 p-3 bg-slate-50 rounded-xl outline-none border border-slate-100 text-[10px]"
                                        value=${settings.clerkSignature}
                                        onInput=${(e) => setData({...data, settings: {...settings, clerkSignature: e.target.value}})}
                                        placeholder="Signature Image URL"
                                    />
                                </div>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="space-y-1">
                                <label class="text-xs font-bold text-slate-500 uppercase">School Name</label>
                                <input 
                                    class="w-full p-3 bg-slate-50 rounded-xl outline-none border border-slate-100 focus:border-blue-400"
                                    value=${settings.schoolName}
                                    onInput=${(e) => setData({...data, settings: {...settings, schoolName: e.target.value}})}
                                />
                            </div>
                            <div class="space-y-1">
                                <label class="text-xs font-bold text-slate-500 uppercase">School Address</label>
                                <input 
                                    class="w-full p-3 bg-slate-50 rounded-xl outline-none border border-slate-100 focus:border-blue-400"
                                    value=${settings.schoolAddress}
                                    onInput=${(e) => setData({...data, settings: {...settings, schoolAddress: e.target.value}})}
                                />
                            </div>
                        </div>
                        <div class="space-y-1">
                            <label class="text-xs font-bold text-slate-500 uppercase">Academic Year</label>
                            <select 
                                class="w-full p-3 bg-slate-50 rounded-xl outline-none border border-slate-100 focus:border-blue-400 font-bold"
                                value=${settings.academicYear || '2025/2026'}
                                onChange=${(e) => setData({...data, settings: {...settings, academicYear: e.target.value}})}
                            >
                                ${Array.from({ length: 27 }, (_, i) => 2025 + i).map(year => html`
                                    <option value="${year}/${year + 1}">${year}/${year + 1}</option>
                                `)}
                            </select>
                        </div>
                        <button 
                            onClick=${handleUpdateProfile}
                            class=${`w-full py-3 rounded-xl font-bold transition-all shadow-lg ${updating ? 'bg-green-500 text-white shadow-green-100' : 'bg-blue-600 text-white shadow-blue-100'}`}
                        >
                            ${updating ? '✓ Changes Saved Successfully' : 'Update School Profile'}
                        </button>
                    </div>
                </div>
            </div>

            <div class="p-6 bg-red-50 rounded-2xl border border-red-100">
                <h4 class="text-red-700 font-bold mb-2">Danger Zone</h4>
                <p class="text-red-600 text-sm mb-4">Resetting all data will clear students, payments, and assessment records permanently.</p>
                <button 
                    onClick=${() => { if(confirm('Are you sure?')) { localStorage.clear(); location.reload(); } }}
                    class="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold shadow-sm"
                >
                    Reset System Data
                </button>
            </div>
        </div>
    `;
};