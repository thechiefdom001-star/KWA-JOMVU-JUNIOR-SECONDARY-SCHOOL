import { h } from 'preact';
import { useState } from 'preact/hooks';
import htm from 'htm';
import { Storage } from '../lib/storage.js';
const html = htm.bind(h);

export const Students = ({ data, setData, onSelectStudent }) => {
    const [showAdd, setShowAdd] = useState(false);
    const [filterGrade, setFilterGrade] = useState('ALL');
    const [filterFinance, setFilterFinance] = useState('ALL');
    const [editingId, setEditingId] = useState(null);
    const [newStudent, setNewStudent] = useState({ 
        name: '', 
        grade: data.settings.grades[0] || 'GRADE 1', 
        category: 'Normal',
        admissionNo: '',
        assessmentNo: '',
        upiNo: '',
        parentContact: '',
        stream: '',
        previousArrears: 0,
        selectedFees: []
    });

    // DYNAMIC FEE OPTIONS - Pull from actual fee structure
    const getDynamicFeeOptions = (grade) => {
        const structure = data.settings.feeStructures?.find(f => f.grade === grade);
        if (!structure) return [];
        
        // Get all keys except grade/id, filter to only show items with amounts > 0
        return Object.keys(structure)
            .filter(key => !['grade', 'id'].includes(key) && structure[key] > 0)
            .map(key => ({
                key: key,
                label: formatFeeLabel(key),
                category: getFeeCategory(key)
            }));
    };

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

    const getFeeCategory = (key) => {
        if (['admission', 't1', 't2', 't3'].includes(key)) return 'tuition';
        if (['diary', 'development', 'bookFund', 'caution', 'studentCard', 'assessmentFee'].includes(key)) return 'mandatory';
        if (['boarding', 'breakfast', 'lunch', 'trip', 'uniform', 'remedial', 'projectFee'].includes(key)) return 'optional';
        return 'misc';
    };

    const handleAdd = (e) => {
        e.preventDefault();
        if (editingId) {
            const updated = data.students.map(s => s.id === editingId ? { ...newStudent, id: editingId } : s);
            setData({ ...data, students: updated });
            setEditingId(null);
        } else {
            const id = Date.now().toString();
            setData({ ...data, students: [...(data.students || []), { ...newStudent, id }] });
        }
        setShowAdd(false);
        resetForm();
    };

    const resetForm = () => {
        setNewStudent({ 
            name: '', 
            grade: data.settings.grades[0] || 'GRADE 1', 
            category: 'Normal',
            admissionNo: '',
            assessmentNo: '',
            upiNo: '',
            parentContact: '',
            stream: '',
            previousArrears: 0,
            selectedFees: []
        });
        setEditingId(null);
    };

    const handleEdit = (student) => {
        setNewStudent({ ...student, category: student.category || 'Normal' });
        setEditingId(student.id);
        setShowAdd(true);
    };

    const handlePromote = (student) => {
        const grades = data.settings.grades;
        const currentIndex = grades.indexOf(student.grade);
        
        if (currentIndex === -1 || currentIndex === grades.length - 1) {
            alert("No further grade to promote to.");
            return;
        }

        const nextGrade = grades[currentIndex + 1];
        if (!confirm(`Promote ${student.name} to ${nextGrade}? Current balance will be carried as arrears.`)) return;

        // Calculate current balance
        const financials = Storage.getStudentFinancials(student, data.payments, data.settings);
        
        const updatedStudents = data.students.map(s => {
            if (s.id === student.id) {
                return {
                    ...s,
                    grade: nextGrade,
                    previousArrears: financials.balance,
                };
            }
            return s;
        });

        setData({ ...data, students: updatedStudents });
        alert(`${student.name} promoted to ${nextGrade}. Arrears: ${data.settings.currency} ${financials.balance.toLocaleString()}`);
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this student? This will not remove their payment history but they will no longer appear in active lists.')) {
            setData({ ...data, students: data.students.filter(s => s.id !== id) });
        }
    };

    const toggleFee = (key) => {
        const current = newStudent.selectedFees || [];
        const updated = current.includes(key) 
            ? current.filter(k => k !== key)
            : [...current, key];
        setNewStudent({ ...newStudent, selectedFees: updated });
    };

    const toggleAllFees = (category) => {
        const categoryFees = getDynamicFeeOptions(newStudent.grade).filter(opt => opt.category === category).map(opt => opt.key);
        const current = newStudent.selectedFees || [];
        const allSelected = categoryFees.every(key => current.includes(key));
        
        if (allSelected) {
            // Deselect all in category
            const updated = current.filter(k => !categoryFees.includes(k));
            setNewStudent({ ...newStudent, selectedFees: updated });
        } else {
            // Select all in category
            const updated = [...new Set([...current, ...categoryFees])];
            setNewStudent({ ...newStudent, selectedFees: updated });
        }
    };

    const toggleAll = () => {
        const allKeys = getDynamicFeeOptions(newStudent.grade).map(opt => opt.key);
        if (newStudent.selectedFees.length === allKeys.length) {
            setNewStudent({ ...newStudent, selectedFees: [] });
        } else {
            setNewStudent({ ...newStudent, selectedFees: allKeys });
        }
    };

    const calculateStudentFees = (student) => {
        const feeStructure = data.settings.feeStructures?.find(f => f.grade === student.grade);
        if (!feeStructure) return { totalDue: 0, totalPaid: 0, balance: 0 };

        const selectedKeys = student.selectedFees || ['t1', 't2', 't3'];
        
        const totalDue = (Number(student.previousArrears) || 0) + selectedKeys.reduce((sum, key) => sum + (feeStructure[key] || 0), 0);
        const totalPaid = (data.payments || []).filter(p => p.studentId === student.id).reduce((sum, p) => sum + Number(p.amount), 0);

        return {
            totalDue,
            totalPaid,
            balance: totalDue - totalPaid
        };
    };

    const filteredStudents = (data.students || []).filter(s => {
        const matchesGrade = filterGrade === 'ALL' || s.grade === filterGrade;
        
        if (filterFinance === 'ALL') return matchesGrade;

        const finance = calculateStudentFees(s);

        if (filterFinance === 'FULL') return matchesGrade && finance.balance <= 0 && finance.totalDue > 0;
        if (filterFinance === 'HALF') return matchesGrade && finance.totalPaid >= (finance.totalDue / 2) && finance.balance > 0;
        if (filterFinance === 'ARREARS') return matchesGrade && finance.balance > 0;
        
        return matchesGrade;
    });

    return html`
        <div class="space-y-6">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 class="text-2xl font-bold">Students Directory</h2>
                    <p class="text-slate-500 text-sm">Manage student enrollment and registration data</p>
                </div>
                <div class="flex flex-wrap gap-2 no-print w-full md:w-auto">
                    <select 
                        class="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
                        value=${filterGrade}
                        onChange=${(e) => setFilterGrade(e.target.value)}
                    >
                        <option value="ALL">All Grades</option>
                        ${data.settings.grades.map(g => html`<option value=${g}>${g}</option>`)}
                    </select>
                    <select 
                        class="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
                        value=${filterFinance}
                        onChange=${(e) => setFilterFinance(e.target.value)}
                    >
                        <option value="ALL">All Payments</option>
                        <option value="FULL">Full Fees Paid</option>
                        <option value="HALF">Half Fees Paid+</option>
                        <option value="ARREARS">With Arrears</option>
                    </select>
                    <button onClick=${() => window.print()} class="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-200">Print List</button>
                    <button 
                        onClick=${() => { if(showAdd) resetForm(); setShowAdd(!showAdd); }}
                        class="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-sm hover:bg-blue-700"
                    >
                        ${showAdd ? 'Cancel' : 'Add Student'}
                    </button>
                </div>
            </div>

            <div class="print-only mb-6 flex flex-col items-center text-center">
                <img src="${data.settings.schoolLogo}" class="w-16 h-16 mb-2 object-contain" alt="Logo" />
                <h1 class="text-2xl font-black uppercase">${data.settings.schoolName}</h1>
                <h2 class="text-sm font-bold uppercase text-slate-500 mt-1">Class Register: ${filterGrade === 'ALL' ? 'All Students' : filterGrade}</h2>
                <p class="text-[10px] text-slate-400 mt-1">Printed on ${new Date().toLocaleDateString()}</p>
            </div>

            ${showAdd && html`
                <form onSubmit=${handleAdd} class="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm space-y-4 animate-in slide-in-from-top-4 duration-300 no-print">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="space-y-1">
                            <label class="text-[10px] font-bold text-slate-400 uppercase ml-1">Full Name</label>
                            <input 
                                placeholder="e.g. John Doe" 
                                required 
                                class="w-full p-3 bg-slate-50 rounded-lg border-0 focus:ring-2 focus:ring-blue-500 outline-none"
                                value=${newStudent.name}
                                onInput=${(e) => setNewStudent({...newStudent, name: e.target.value})}
                            />
                        </div>
                        <div class="space-y-1">
                            <label class="text-[10px] font-bold text-slate-400 uppercase ml-1">Admission Number</label>
                            <input 
                                placeholder="ADM/2024/001" 
                                required 
                                class="w-full p-3 bg-slate-50 rounded-lg border-0 focus:ring-2 focus:ring-blue-500 outline-none"
                                value=${newStudent.admissionNo}
                                onInput=${(e) => setNewStudent({...newStudent, admissionNo: e.target.value})}
                            />
                        </div>
                        <div class="space-y-1">
                            <label class="text-[10px] font-bold text-slate-400 uppercase ml-1">Grade / Class</label>
                            <select 
                                class="w-full p-3 bg-slate-50 rounded-xl border-0 focus:ring-2 focus:ring-blue-500 outline-none"
                                value=${newStudent.grade}
                                onChange=${(e) => setNewStudent({...newStudent, grade: e.target.value})}
                            >
                                ${data.settings.grades.map(g => html`<option value=${g}>${g}</option>`)}
                            </select>
                        </div>
                        <div class="space-y-1">
                            <label class="text-[10px] font-bold text-slate-400 uppercase ml-1">Student Category</label>
                            <select 
                                class="w-full p-3 bg-slate-50 rounded-xl border-0 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                                value=${newStudent.category || 'Normal'}
                                onChange=${(e) => setNewStudent({...newStudent, category: e.target.value})}
                            >
                                <option value="Normal">Normal (Full Fees)</option>
                                <option value="Staff">Staff Child (50% Off)</option>
                                <option value="Sponsored">Sponsored (100% Off)</option>
                            </select>
                        </div>
                        <div class="space-y-1">
                            <label class="text-[10px] font-bold text-slate-400 uppercase ml-1">Assessment Number</label>
                            <input 
                                placeholder="ASN-123456" 
                                class="w-full p-3 bg-slate-50 rounded-lg border-0 focus:ring-2 focus:ring-blue-500 outline-none"
                                value=${newStudent.assessmentNo}
                                onInput=${(e) => setNewStudent({...newStudent, assessmentNo: e.target.value})}
                            />
                        </div>
                        <div class="space-y-1">
                            <label class="text-[10px] font-bold text-slate-400 uppercase ml-1">UPI Number</label>
                            <input 
                                placeholder="UPI-XXXX" 
                                class="w-full p-3 bg-slate-50 rounded-lg border-0 focus:ring-2 focus:ring-blue-500 outline-none"
                                value=${newStudent.upiNo}
                                onInput=${(e) => setNewStudent({...newStudent, upiNo: e.target.value})}
                            />
                        </div>
                        <div class="space-y-1">
                            <label class="text-[10px] font-bold text-slate-400 uppercase ml-1">Stream / House</label>
                            <input 
                                placeholder="e.g. Blue, North" 
                                class="w-full p-3 bg-slate-50 rounded-lg border-0 focus:ring-2 focus:ring-blue-500 outline-none"
                                value=${newStudent.stream}
                                onInput=${(e) => setNewStudent({...newStudent, stream: e.target.value})}
                            />
                        </div>
                        <div class="space-y-1">
                            <label class="text-[10px] font-bold text-slate-400 uppercase ml-1">Parent Contact</label>
                            <input 
                                placeholder="e.g. 0712345678" 
                                class="w-full p-3 bg-slate-50 rounded-lg border-0 focus:ring-2 focus:ring-blue-500 outline-none"
                                value=${newStudent.parentContact}
                                onInput=${(e) => setNewStudent({...newStudent, parentContact: e.target.value})}
                            />
                        </div>
                        <div class="space-y-1">
                            <label class="text-[10px] font-bold text-orange-600 uppercase ml-1">Prev. Arrears (Bal B/F)</label>
                            <input 
                                type="number"
                                placeholder="0.00" 
                                class="w-full p-3 bg-orange-50 rounded-lg border-0 focus:ring-2 focus:ring-orange-500 outline-none font-bold text-orange-700"
                                value=${newStudent.previousArrears}
                                onInput=${(e) => setNewStudent({...newStudent, previousArrears: Number(e.target.value)})}
                            />
                        </div>
                    </div>
                    
                    <div class="space-y-2 pt-2 border-t border-slate-100">
                        <label class="text-[10px] font-bold text-slate-400 uppercase ml-1">Applicable Fee Items (Fee Profile)</label>
                        <p class="text-[10px] text-slate-500">Selected grade: <span class="font-bold">${newStudent.grade}</span> | ${getDynamicFeeOptions(newStudent.grade).length} fee items available</p>
                        
                        <!-- Select All / Deselect All -->
                        <div class="flex items-center justify-between bg-slate-100 p-3 rounded-lg mb-3">
                            <span class="text-[10px] font-bold text-slate-700 uppercase">Quick Actions</span>
                            <div class="flex gap-2">
                                <button 
                                    type="button"
                                    onClick=${toggleAll}
                                    class="text-[9px] px-3 py-1 bg-blue-500 text-white rounded font-bold hover:bg-blue-600"
                                >
                                    ${newStudent.selectedFees.length === getDynamicFeeOptions(newStudent.grade).length ? 'Deselect All' : 'Select All'}
                                </button>
                                <button 
                                    type="button"
                                    onClick=${() => toggleAllFees('tuition')}
                                    class="text-[9px] px-3 py-1 bg-green-500 text-white rounded font-bold hover:bg-green-600"
                                >
                                    Tuition
                                </button>
                                <button 
                                    type="button"
                                    onClick=${() => toggleAllFees('mandatory')}
                                    class="text-[9px] px-3 py-1 bg-purple-500 text-white rounded font-bold hover:bg-purple-600"
                                >
                                    Mandatory
                                </button>
                                <button 
                                    type="button"
                                    onClick=${() => toggleAllFees('optional')}
                                    class="text-[9px] px-3 py-1 bg-orange-500 text-white rounded font-bold hover:bg-orange-600"
                                >
                                    Optional
                                </button>
                            </div>
                        </div>
                        
                        <!-- Organized by Category -->
                        <div class="space-y-3">
                            ${['tuition', 'mandatory', 'optional', 'misc'].map(category => {
                                const categoryItems = getDynamicFeeOptions(newStudent.grade).filter(opt => opt.category === category);
                                if (categoryItems.length === 0) return null;
                                
                                const categoryNames = {
                                    'tuition': '🎓 Tuition & Admission',
                                    'mandatory': '✅ Mandatory Charges',
                                    'optional': '⭐ Optional Services',
                                    'misc': '📦 Miscellaneous'
                                };
                                
                                return html`
                                    <div class="space-y-2">
                                        <div class="flex items-center gap-2">
                                            <span class="text-[10px] font-bold text-slate-500 uppercase">${categoryNames[category]}</span>
                                            <span class="text-[9px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded">${categoryItems.length} items</span>
                                        </div>
                                        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                            ${categoryItems.map(opt => html`
                                                <label 
                                                    key=${opt.key} 
                                                    class=${`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                                                        newStudent.selectedFees.includes(opt.key) 
                                                            ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm' 
                                                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                                                    }`}
                                                >
                                                    <input 
                                                        type="checkbox" 
                                                        class="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                        checked=${newStudent.selectedFees.includes(opt.key)}
                                                        onChange=${() => toggleFee(opt.key)}
                                                    />
                                                    <div class="flex-1">
                                                        <span class="text-[9px] font-bold uppercase block">${opt.label}</span>
                                                    </div>
                                                </label>
                                            `)}
                                        </div>
                                    </div>
                                `;
                            })}
                        </div>
                        
                        ${getDynamicFeeOptions(newStudent.grade).length === 0 && html`
                            <p class="text-[10px] text-orange-500 italic p-2 bg-orange-50 rounded-lg">
                                ⚠️ No fees configured for this grade. Go to Settings → Fee Structure to add fees.
                            </p>
                        `}
                    </div>
                    
                    <button class="w-full bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-900">
                        ${editingId ? 'Update Student Information' : 'Register Student'}
                    </button>
                </form>
            `}

            <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto no-scrollbar">
                <table class="w-full text-left min-w-[800px]">
                    <thead class="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th class="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">Name</th>
                            <th class="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">Adm No</th>
                            <th class="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">UPI No</th>
                            <th class="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">Assess No</th>
                            <th class="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">Parent Contact</th>
                            <th class="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">Grade</th>
                            <th class="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase no-print">Action</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50">
                        ${filteredStudents.map(student => html`
                            <tr key=${student.id} class="hover:bg-slate-100 transition-colors even:bg-slate-50">
                                <td class="px-6 py-4">
                                    <div class="font-bold text-sm">${student.name}</div>
                                    <div class="text-[9px] text-slate-400 uppercase">${student.stream || 'No Stream'}</div>
                                </td>
                                <td class="px-6 py-4 text-slate-500 text-sm font-mono">${student.admissionNo}</td>
                                <td class="px-6 py-4 text-slate-500 text-xs font-mono">${student.upiNo || '-'}</td>
                                <td class="px-6 py-4 text-slate-500 text-xs font-mono">${student.assessmentNo || '-'}</td>
                                <td class="px-6 py-4 text-slate-700 text-xs font-bold">${student.parentContact || '-'}</td>
                                <td class="px-6 py-4">
                                    <div class="flex flex-col gap-1">
                                        <span class="bg-slate-200 px-2 py-1 rounded text-[10px] font-bold uppercase whitespace-nowrap">${student.grade}</span>
                                        ${['GRADE 10', 'GRADE 11', 'GRADE 12'].includes(student.grade) && html`
                                            <span class="text-[8px] font-black text-blue-600 uppercase tracking-tighter">
                                                ${student.seniorPathway ? student.seniorPathway.replace(/([A-Z])/g, ' $1') : 'No Pathway'}
                                            </span>
                                        `}
                                    </div>
                                </td>
                                <td class="px-6 py-4 no-print">
                                    <div class="flex items-center gap-3">
                                        <button 
                                            onClick=${() => handlePromote(student)}
                                            class="bg-blue-50 text-blue-600 px-2 py-1 rounded font-black text-[9px] hover:bg-blue-600 hover:text-white transition-all uppercase"
                                            title="Promote to Next Grade"
                                        >
                                            Promote
                                        </button>
                                        <button 
                                            onClick=${() => onSelectStudent(student.id)}
                                            class="text-blue-600 font-bold text-[10px] hover:underline uppercase tracking-tight"
                                        >
                                            Report
                                        </button>
                                        <button 
                                            onClick=${() => handleEdit(student)}
                                            class="text-slate-600 font-bold text-[10px] hover:underline uppercase tracking-tight"
                                        >
                                            Edit
                                        </button>
                                        <button 
                                            onClick=${() => handleDelete(student.id)}
                                            class="text-red-500 font-bold text-[10px] hover:underline uppercase tracking-tight"
                                        >
                                            Del
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `)}
                    </tbody>
                </table>
                ${filteredStudents.length === 0 && html`
                    <div class="p-12 text-center text-slate-300">No students found matching current filters.</div>
                `}
            </div>
        </div>
    `;
};