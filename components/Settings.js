import { h } from 'preact';
import { useState } from 'preact/hooks';
import htm from 'htm';
const html = htm.bind(h);

export const Settings = ({ data, setData }) => {
    if (!data || !data.settings) {
        return html`<div class="p-12 text-center text-slate-400 font-bold">Initializing Settings...</div>`;
    }
    
    const [updating, setUpdating] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [pendingImportData, setPendingImportData] = useState(null);
    const [importSelections, setImportSelections] = useState({
        students: true,
        marks: true,
        staff: true,
        finance: true,
        settings: true,
        modules: true
    });
    const [selectedGradeForFees, setSelectedGradeForFees] = useState(data.settings.grades?.[0] || 'GRADE 1');
    const [showAddFeeModal, setShowAddFeeModal] = useState(false);
    const [newFeeItem, setNewFeeItem] = useState({ 
        key: '', 
        label: '', 
        category: 'optional',
        defaultAmount: 0 
    });
    
    const settings = data.settings;

    // Format fee labels for display
    const formatFeeLabel = (key) => {
        const labels = {
            'admission': 'Admission Fee',
            'diary': 'School Diary',
            'development': 'Development Fee',
            't1': 'Term 1 Tuition',
            't2': 'Term 2 Tuition',
            't3': 'Term 3 Tuition',
            'boarding': 'Boarding Fee',
            'breakfast': 'Breakfast',
            'lunch': 'Lunch',
            'trip': 'Educational Trip',
            'bookFund': 'Book Fund',
            'caution': 'Caution Money',
            'uniform': 'Uniform',
            'studentCard': 'Student ID Card',
            'remedial': 'Remedial Classes',
            'assessmentFee': 'Examination Fee',
            'projectFee': 'Project Fee'
        };
        return labels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    };

    // Categorize fees
    const getFeeCategory = (key) => {
        if (['admission', 't1', 't2', 't3'].includes(key)) return 'tuition';
        if (['diary', 'development', 'bookFund', 'caution', 'studentCard', 'assessmentFee'].includes(key)) return 'mandatory';
        if (['boarding', 'breakfast', 'lunch', 'trip', 'uniform', 'remedial', 'projectFee'].includes(key)) return 'optional';
        return 'misc';
    };

    // Get all fee keys from selected grade structure
    const getFeeItemsForGrade = () => {
        const structure = settings.feeStructures?.find(f => f.grade === selectedGradeForFees);
        if (!structure) return [];
        
        return Object.keys(structure)
            .filter(key => !['grade', 'id'].includes(key))
            .map(key => ({
                key,
                label: formatFeeLabel(key),
                category: getFeeCategory(key),
                amount: structure[key] || 0
            }))
            .sort((a, b) => {
                const categoryOrder = { tuition: 1, mandatory: 2, optional: 3, misc: 4 };
                return categoryOrder[a.category] - categoryOrder[b.category] || a.label.localeCompare(b.label);
            });
    };

    const updateFee = (grade, field, val) => {
        const newStructures = (settings.feeStructures || []).map(f => 
            f.grade === grade ? { ...f, [field]: Number(val) || 0 } : f
        );
        setData({
            ...data,
            settings: { ...settings, feeStructures: newStructures }
        });
    };

    const handleAddFeeItem = () => {
        if (!newFeeItem.key || !newFeeItem.label) {
            alert('Please enter both key and label');
            return;
        }
        
        // Validate key format (alphanumeric + underscores only)
        if (!/^[a-z0-9_]+$/.test(newFeeItem.key)) {
            alert('Fee key must be lowercase letters, numbers, or underscores only (no spaces)');
            return;
        }

        // Check for duplicate key
        const allKeys = new Set();
        settings.feeStructures?.forEach(structure => {
            Object.keys(structure).forEach(key => {
                if (!['grade', 'id'].includes(key)) allKeys.add(key);
            });
        });
        
        if (allKeys.has(newFeeItem.key)) {
            alert(`Fee key "${newFeeItem.key}" already exists!`);
            return;
        }

        // Add to all grade structures
        const updatedStructures = data.settings.feeStructures.map(structure => ({
            ...structure,
            [newFeeItem.key]: Number(newFeeItem.defaultAmount) || 0
        }));

        setData({
            ...data,
            settings: {
                ...data.settings,
                feeStructures: updatedStructures
            }
        });

        // Reset modal
        setNewFeeItem({ key: '', label: '', category: 'optional', defaultAmount: 0 });
        setShowAddFeeModal(false);
        alert(`✅ Fee item "${newFeeItem.label}" added successfully to all grades!`);
    };

    const handleDeleteFeeItem = (key) => {
        if (!confirm(`⚠️ Delete fee item "${formatFeeLabel(key)}"?\n\nThis will remove it from ALL grade structures permanently.`)) return;
        
        const updatedStructures = data.settings.feeStructures.map(structure => {
            const newStructure = { ...structure };
            delete newStructure[key];
            return newStructure;
        });

        setData({
            ...data,
            settings: {
                ...data.settings,
                feeStructures: updatedStructures
            }
        });
        
        alert(`✅ Fee item "${formatFeeLabel(key)}" deleted successfully!`);
    };

    const handleUpdateProfile = () => {
        setUpdating(true);
        setTimeout(() => setUpdating(false), 1500);
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
        e.target.value = '';
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

    // Category configuration
    const feeCategories = [
        { id: 'tuition', name: '🎓 Tuition & Admission', color: 'bg-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' },
        { id: 'mandatory', name: '✅ Mandatory Charges', color: 'bg-green-500', bg: 'bg-green-50', border: 'border-green-200' },
        { id: 'optional', name: '⭐ Optional Services', color: 'bg-purple-500', bg: 'bg-purple-50', border: 'border-purple-200' },
        { id: 'misc', name: '📦 Miscellaneous', color: 'bg-orange-500', bg: 'bg-orange-50', border: 'border-orange-200' }
    ];

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

                {/* ===== FEE STRUCTURE AS CARDS - COMPLETELY REBUILT ===== */}
                <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <div>
                            <h3 class="font-bold text-xl text-slate-800">Fee Structure Management</h3>
                            <p class="text-slate-500 text-sm mt-1">Configure fee amounts per grade with professional card interface</p>
                        </div>
                        <div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                            <select 
                                class="p-3 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-blue-800 shadow-sm"
                                value=${selectedGradeForFees}
                                onChange=${e => setSelectedGradeForFees(e.target.value)}
                            >
                                ${settings.grades?.map(g => html`<option value=${g}>${g}</option>`)}
                            </select>
                            <button 
                                onClick=${() => setShowAddFeeModal(true)}
                                class="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-green-300 hover:shadow-green-400 transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
                            >
                                <span class="text-lg">➕</span>
                                <span>Add New Fee Item</span>
                            </button>
                        </div>
                    </div>

                    <div class="space-y-6">
                        ${feeCategories.map(category => {
                            const categoryItems = getFeeItemsForGrade().filter(item => item.category === category.id);
                            if (categoryItems.length === 0) return null;

                            return html`
                                <div class="space-y-3">
                                    <div class="flex items-center gap-3 mb-3 p-3 ${category.bg} rounded-xl border ${category.border}">
                                        <div class=${`w-8 h-8 ${category.color} rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md`}>
                                            ${category.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 class="font-bold text-lg text-slate-800">${category.name}</h4>
                                            <p class="text-xs text-slate-600 mt-0.5">${categoryItems.length} fee items configured</p>
                                        </div>
                                    </div>

                                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        ${categoryItems.map(item => html`
                                            <div class="bg-white rounded-xl border ${category.border} p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ${category.bg} group">
                                                <div class="flex justify-between items-start mb-3">
                                                    <div>
                                                        <h5 class="font-bold text-sm text-slate-800">${item.label}</h5>
                                                        <p class="text-[10px] text-slate-500 font-mono mt-0.5 bg-slate-100 inline-block px-2 py-0.5 rounded">${item.key}</p>
                                                    </div>
                                                    <button 
                                                        onClick=${() => handleDeleteFeeItem(item.key)}
                                                        class="text-red-500 hover:text-red-700 text-xl hover:scale-110 transition-transform opacity-0 group-hover:opacity-100"
                                                        title="Delete fee item"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>

                                                <div class="space-y-4 pt-2 border-t border-slate-200">
                                                    <div class="flex items-center gap-2">
                                                        <span class="text-slate-700 font-bold text-lg">${settings.currency}</span>
                                                        <input 
                                                            type="number" 
                                                            class="flex-1 p-3 bg-white border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none font-bold text-slate-800 text-lg shadow-sm hover:border-slate-300 transition-colors"
                                                            value=${item.amount}
                                                            onInput=${e => updateFee(selectedGradeForFees, item.key, e.target.value)}
                                                            placeholder="0.00"
                                                        />
                                                    </div>

                                                    <div class="flex items-center justify-between pt-1">
                                                        <span class="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Status</span>
                                                        <label class="relative inline-flex items-center cursor-pointer">
                                                            <input 
                                                                type="checkbox" 
                                                                class="sr-only peer"
                                                                checked=${item.amount > 0}
                                                                onChange=${e => updateFee(selectedGradeForFees, item.key, e.target.checked ? 1000 : 0)}
                                                            />
                                                            <div class="w-14 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-green-500 peer-checked:to-emerald-600 shadow-md"></div>
                                                            <span class="absolute text-[9px] font-bold text-white -bottom-5 ${item.amount > 0 ? 'left-1' : 'right-1'} transition-all">${item.amount > 0 ? 'ACTIVE' : 'INACTIVE'}</span>
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        `)}
                                    </div>
                                </div>
                            `;
                        })}
                    </div>

                    ${getFeeItemsForGrade().length === 0 && html`
                        <div class="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                            <div class="text-5xl mb-4">📋</div>
                            <h3 class="font-bold text-lg text-slate-700 mb-2">No Fee Items Configured</h3>
                            <p class="text-slate-500 max-w-md mx-auto mb-4">Add your first fee item to start building the fee structure for this grade</p>
                            <button 
                                onClick=${() => setShowAddFeeModal(true)}
                                class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-blue-500 transition-all"
                            >
                                + Add First Fee Item
                            </button>
                        </div>
                    `}

                    <div class="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <div class="flex items-start gap-3">
                            <div class="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center mt-0.5">
                                <span class="text-white text-[10px] font-bold">i</span>
                            </div>
                            <p class="text-[11px] text-blue-800">
                                <span class="font-bold">Pro Tip:</span> Toggle fees ON/OFF to quickly enable/disable them. 
                                Fees with zero amounts won't appear in student registration forms. 
                                Use the "Add New Fee Item" button to create custom fees like "Medical Fee" or "Sports Uniform".
                            </p>
                        </div>
                    </div>
                </div>
                

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
                                value=${settings.academicYear || '2024/2025'}
                                onChange=${(e) => setData({...data, settings: {...settings, academicYear: e.target.value}})}
                            >
                                ${Array.from({ length: 27 }, (_, i) => 2024 + i).map(year => html`
                                    <option value="${year}/${year + 1}">${year}/${year + 1}</option>
                                `)}
                            </select>
                        </div>
                        <button 
                            onClick=${handleUpdateProfile}
                            class=${`w-full py-3 rounded-xl font-bold transition-all shadow-lg ${updating ? 'bg-green-500 text-white shadow-green-300' : 'bg-blue-600 text-white shadow-blue-300 hover:bg-blue-700'}`}
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
                    onClick=${() => { if(confirm('Are you sure? This will delete ALL school data permanently!')) { localStorage.clear(); location.reload(); } }}
                    class="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-red-700 transition-colors"
                >
                    Reset System Data
                </button>
            </div>

            ${showAddFeeModal && html`
                <div class="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div class="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-300 relative">
                        <button
                            onClick=${() => setShowAddFeeModal(false)}
                            class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-2xl font-bold hover:scale-110 transition-transform"
                            aria-label="Close modal"
                        >
                            &times;
                        </button>
                        
                        <div class="text-center mb-8">
                            <div class="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <span class="text-3xl text-white">➕</span>
                            </div>
                            <h3 class="text-2xl font-black text-slate-800">Add New Fee Item</h3>
                            <p class="text-slate-500 mt-2">Create a custom fee that will be added to ALL grade structures</p>
                        </div>

                        <div class="space-y-5">
                            <div class="space-y-2">
                                <label class="text-[11px] font-bold text-slate-600 uppercase flex items-center gap-1">
                                    <span>🔑</span>
                                    Fee Key (Technical Name)
                                </label>
                                <input 
                                    type="text"
                                    placeholder="e.g., medical_fee, sports_uniform"
                                    class="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none font-mono text-sm"
                                    value=${newFeeItem.key}
                                    onInput=${e => setNewFeeItem({...newFeeItem, key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_')})}
                                />
                                <p class="text-[10px] text-slate-400 mt-1 pl-1">
                                    • Lowercase letters, numbers, underscores only<br/>
                                    • Cannot be changed after creation<br/>
                                    • Example: <span class="font-mono bg-slate-100 px-1 rounded">medical_fee</span>
                                </p>
                            </div>

                            <div class="space-y-2">
                                <label class="text-[11px] font-bold text-slate-600 uppercase flex items-center gap-1">
                                    <span>✏️</span>
                                    Display Label
                                </label>
                                <input 
                                    type="text"
                                    placeholder="e.g., Medical Examination Fee"
                                    class="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none"
                                    value=${newFeeItem.label}
                                    onInput=${e => setNewFeeItem({...newFeeItem, label: e.target.value})}
                                />
                                <p class="text-[10px] text-slate-400 mt-1 pl-1">
                                    What parents/staff will see (e.g., "Medical Fee")
                                </p>
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <div class="space-y-2">
                                    <label class="text-[11px] font-bold text-slate-600 uppercase flex items-center gap-1">
                                        <span>📁</span>
                                        Category
                                    </label>
                                    <select
                                        class="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none"
                                        value=${newFeeItem.category}
                                        onChange=${e => setNewFeeItem({...newFeeItem, category: e.target.value})}
                                    >
                                        ${feeCategories.map(cat => html`
                                            <option value=${cat.id}>${cat.name}</option>
                                        `)}
                                    </select>
                                </div>

                                <div class="space-y-2">
                                    <label class="text-[11px] font-bold text-slate-600 uppercase flex items-center gap-1">
                                        <span>💰</span>
                                        Default Amount
                                    </label>
                                    <div class="relative">
                                        <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 font-bold">${settings.currency}</span>
                                        <input 
                                            type="number"
                                            placeholder="0.00"
                                            class="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none font-bold text-lg"
                                            value=${newFeeItem.defaultAmount}
                                            onInput=${e => setNewFeeItem({...newFeeItem, defaultAmount: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div class="flex gap-3 pt-2 border-t border-slate-100">
                                <button 
                                    type="button"
                                    onClick=${() => {
                                        setShowAddFeeModal(false);
                                        setNewFeeItem({ key: '', label: '', category: 'optional', defaultAmount: 0 });
                                    }}
                                    class="flex-1 py-4 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition-colors shadow-sm"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="button"
                                    onClick=${handleAddFeeItem}
                                    class="flex-1 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-black shadow-lg shadow-green-300 hover:shadow-green-400 hover:from-green-600 hover:to-emerald-700 transition-all"
                                >
                                    ✅ Add Fee Item
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `}

            {/* Selective Import Modal (unchanged from original) */}
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
        </div>
    `;
};