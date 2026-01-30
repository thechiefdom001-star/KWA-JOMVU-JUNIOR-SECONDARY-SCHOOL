import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import htm from 'htm';
import { Storage } from '../lib/storage.js';

const html = htm.bind(h);

export const Fees = ({ data, setData }) => {
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [selectedTerm, setSelectedTerm] = useState('T1');
    const [filterGrade, setFilterGrade] = useState('ALL');
    const [paymentItems, setPaymentItems] = useState({});
    const [receipt, setReceipt] = useState(null);
    const [showFeeManager, setShowFeeManager] = useState(false);
    const [editingFeeItem, setEditingFeeItem] = useState(null);
    const [newFeeItem, setNewFeeItem] = useState({ key: '', label: '', defaultAmount: 0 });
    const [selectedGradeForFees, setSelectedGradeForFees] = useState(data.settings.grades[0] || 'GRADE 1');

    // Enhanced fee columns with categories and visibility control
    const feeCategories = [
        { 
            id: 'tuition', 
            name: 'Tuition & Admission', 
            items: [
                { key: 'admission', label: 'Admission Fee', category: 'tuition' },
                { key: 't1', label: 'Term 1 Tuition', category: 'tuition' },
                { key: 't2', label: 'Term 2 Tuition', category: 'tuition' },
                { key: 't3', label: 'Term 3 Tuition', category: 'tuition' },
            ]
        },
        { 
            id: 'mandatory', 
            name: 'Mandatory Charges', 
            items: [
                { key: 'diary', label: 'School Diary', category: 'mandatory' },
                { key: 'development', label: 'Development Fee', category: 'mandatory' },
                { key: 'bookFund', label: 'Book Fund', category: 'mandatory' },
                { key: 'caution', label: 'Caution Money', category: 'mandatory' },
                { key: 'studentCard', label: 'Student ID Card', category: 'mandatory' },
                { key: 'assessmentFee', label: 'Examination Fee', category: 'mandatory' },
            ]
        },
        { 
            id: 'optional', 
            name: 'Optional Services', 
            items: [
                { key: 'boarding', label: 'Boarding Fee', category: 'optional' },
                { key: 'breakfast', label: 'Breakfast', category: 'optional' },
                { key: 'lunch', label: 'Lunch', category: 'optional' },
                { key: 'trip', label: 'Educational Trip', category: 'optional' },
                { key: 'uniform', label: 'Uniform', category: 'optional' },
                { key: 'remedial', label: 'Remedial Classes', category: 'optional' },
                { key: 'projectFee', label: 'Project Fee', category: 'optional' },
            ]
        }
    ];

    // Flatten all fee items for easy access
    const allFeeItems = feeCategories.flatMap(cat => cat.items);
    const terms = ['T1', 'T2', 'T3'];

    const student = data.students.find(s => s.id === selectedStudentId);
    const feeStructure = student ? data.settings.feeStructures.find(f => f.grade === student.grade) : null;

    useEffect(() => {
        setPaymentItems({});
    }, [selectedStudentId]);

    // FEE ITEM MANAGEMENT FUNCTIONS
    const handleAddFeeItem = () => {
        if (!newFeeItem.key || !newFeeItem.label) {
            alert('Please enter both key and label');
            return;
        }

        // Add to all categories (for new items)
        const updatedStructures = data.settings.feeStructures.map(structure => ({
            ...structure,
            [newFeeItem.key]: newFeeItem.defaultAmount || 0
        }));

        // Add to fee items list if not already exists
        const itemExists = allFeeItems.some(item => item.key === newFeeItem.key);
        if (!itemExists) {
            // In a real app, you'd update the feeCategories structure
            // For now, we'll just add to the first category
            feeCategories[0].items.push({
                key: newFeeItem.key,
                label: newFeeItem.label,
                category: feeCategories[0].id
            });
        }

        setData({
            ...data,
            settings: {
                ...data.settings,
                feeStructures: updatedStructures
            }
        });

        setNewFeeItem({ key: '', label: '', defaultAmount: 0 });
        alert(`Fee item "${newFeeItem.label}" added successfully!`);
    };

    const handleUpdateFeeAmount = (grade, key, amount) => {
        const updatedStructures = data.settings.feeStructures.map(structure => 
            structure.grade === grade 
                ? { ...structure, [key]: Number(amount) }
                : structure
        );
        setData({
            ...data,
            settings: { ...data.settings, feeStructures: updatedStructures }
        });
    };

    const handleDeleteFeeItem = (key) => {
        if (!confirm(`Delete fee item "${key}"? This will remove it from all grade structures.`)) return;
        
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
    };

    const toggleFeeItemForStudent = (key) => {
        if (!student) return;
        
        const currentSelected = student.selectedFees || ['t1', 't2', 't3'];
        const updatedSelected = currentSelected.includes(key)
            ? currentSelected.filter(k => k !== key)
            : [...currentSelected, key];
        
        const updatedStudents = data.students.map(s =>
            s.id === student.id
                ? { ...s, selectedFees: updatedSelected }
                : s
        );
        
        setData({ ...data, students: updatedStudents });
    };

    // PAYMENT HANDLING FUNCTIONS (unchanged from original)
    const handleItemInput = (key, val) => {
        setPaymentItems({ ...paymentItems, [key]: Number(val) });
    };

    const handlePayment = (e) => {
        e.preventDefault();
        if (!student || !feeStructure) return;

        const totalAmount = Object.values(paymentItems).reduce((sum, v) => sum + (v || 0), 0);
        if (totalAmount <= 0) {
            alert("Please enter payment amount for at least one item.");
            return;
        }

        const newPayment = {
            id: 'PAY-' + Date.now(),
            studentId: selectedStudentId,
            gradeAtPayment: student.grade,
            amount: totalAmount,
            items: { ...paymentItems },
            term: selectedTerm,
            date: new Date().toLocaleDateString(),
            receiptNo: 'RCP-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0')
        };

        const financials = Storage.getStudentFinancials(student, data.payments, data.settings);
        const balanceAfter = financials.balance - totalAmount;

        const studentPayments = (data.payments || []).filter(p => p.studentId === selectedStudentId);
        const allPaymentsForStudent = [...studentPayments, newPayment];
        
        setData({ ...data, payments: [...(data.payments || []), newPayment] });
        setReceipt({ 
            ...newPayment, 
            studentName: student.name, 
            grade: student.grade, 
            balance: balanceAfter,
            structure: feeStructure,
            history: allPaymentsForStudent,
            term: selectedTerm
        });
        setPaymentItems({});
    };

    const handleDeletePayment = (paymentId) => {
        if (confirm('Void this transaction? This cannot be undone.')) {
            setData({ ...data, payments: data.payments.filter(p => p.id !== paymentId) });
            if (receipt && receipt.id === paymentId) setReceipt(null);
        }
    };

    const viewReceipt = (p) => {
        const s = data.students.find(st => st.id === p.studentId);
        if (!s) return;
        
        const financials = Storage.getStudentFinancials(s, data.payments, data.settings);
        const fs = data.settings.feeStructures.find(f => f.grade === s.grade);
        
        const studentPayments = (data.payments || []).filter(pay => pay.studentId === s.id);
        const paymentIndex = studentPayments.findIndex(pay => pay.id === p.id);
        const historyUpToNow = studentPayments.slice(0, paymentIndex + 1);
        
        const paidUntilNow = historyUpToNow.reduce((sum, pay) => sum + pay.amount, 0);
        const currentBalance = financials.totalDue - paidUntilNow;

        setReceipt({
            ...p,
            studentName: s.name,
            grade: s.grade,
            balance: currentBalance,
            structure: fs,
            history: historyUpToNow
        });
    };

    // Get fee items filtered by student's grade and selection
    const getFilteredFeeItems = () => {
        if (!student || !feeStructure) return [];
        
        return allFeeItems.filter(item => {
            // Special handling for term-specific items
            if (item.key.startsWith('t')) {
                const termKey = item.key;
                return termKey === selectedTerm.toLowerCase();
            }
            
            // Check if this item is selected for the student
            const isSelected = (student.selectedFees || ['t1', 't2', 't3']).includes(item.key);
            const hasAmount = feeStructure[item.key] > 0;
            
            return isSelected && hasAmount;
        });
    };

    return html`
        <div class="space-y-6">
            <h2 class="text-2xl font-bold no-print">Fee Management</h2>

            <!-- FEE ITEM MANAGER MODAL -->
            ${showFeeManager && html`
                <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div class="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl p-8 shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
                        <div class="flex justify-between items-center mb-6">
                            <h3 class="text-2xl font-black">Fee Item Manager</h3>
                            <button 
                                onClick=${() => setShowFeeManager(false)}
                                class="text-slate-500 hover:text-slate-700 text-xl"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <!-- Add New Fee Item -->
                        <div class="bg-slate-50 p-6 rounded-2xl mb-6">
                            <h4 class="font-bold mb-4 text-lg">Add New Fee Item</h4>
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div class="space-y-1">
                                    <label class="text-xs font-bold text-slate-500 uppercase">Item Key</label>
                                    <input 
                                        type="text"
                                        placeholder="e.g., medical"
                                        class="w-full p-3 bg-white rounded-xl border border-slate-200 outline-none focus:border-primary"
                                        value=${newFeeItem.key}
                                        onInput=${e => setNewFeeItem({...newFeeItem, key: e.target.value})}
                                    />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-xs font-bold text-slate-500 uppercase">Display Label</label>
                                    <input 
                                        type="text"
                                        placeholder="e.g., Medical Fee"
                                        class="w-full p-3 bg-white rounded-xl border border-slate-200 outline-none focus:border-primary"
                                        value=${newFeeItem.label}
                                        onInput=${e => setNewFeeItem({...newFeeItem, label: e.target.value})}
                                    />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-xs font-bold text-slate-500 uppercase">Default Amount</label>
                                    <input 
                                        type="number"
                                        placeholder="0.00"
                                        class="w-full p-3 bg-white rounded-xl border border-slate-200 outline-none focus:border-primary"
                                        value=${newFeeItem.defaultAmount}
                                        onInput=${e => setNewFeeItem({...newFeeItem, defaultAmount: Number(e.target.value)})}
                                    />
                                </div>
                            </div>
                            <button 
                                onClick=${handleAddFeeItem}
                                class="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700"
                            >
                                + Add New Fee Item
                            </button>
                        </div>

                        <!-- Manage Existing Fee Items by Grade -->
                        <div class="mb-6">
                            <div class="flex items-center justify-between mb-4">
                                <h4 class="font-bold text-lg">Configure Amounts by Grade</h4>
                                <select 
                                    class="p-2 bg-slate-50 rounded-lg border border-slate-200 outline-none focus:border-primary"
                                    value=${selectedGradeForFees}
                                    onChange=${e => setSelectedGradeForFees(e.target.value)}
                                >
                                    ${data.settings.grades.map(g => html`
                                        <option value=${g}>${g}</option>
                                    `)}
                                </select>
                            </div>
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto max-h-[300px] pr-2">
                                ${allFeeItems.map(item => {
                                    const structure = data.settings.feeStructures.find(f => f.grade === selectedGradeForFees);
                                    const amount = structure ? structure[item.key] || 0 : 0;
                                    
                                    return html`
                                        <div class="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                                            <div class="flex justify-between items-start">
                                                <div>
                                                    <p class="font-bold text-sm">${item.label}</p>
                                                    <p class="text-[10px] text-slate-500 font-mono">${item.key}</p>
                                                </div>
                                                <button 
                                                    onClick=${() => handleDeleteFeeItem(item.key)}
                                                    class="text-red-500 text-xs hover:text-red-700"
                                                    title="Delete item"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                            <div class="flex items-center gap-2">
                                                <span class="text-xs text-slate-500">${data.settings.currency}</span>
                                                <input 
                                                    type="number"
                                                    class="flex-1 p-2 bg-slate-50 rounded-lg border border-slate-200 outline-none focus:border-primary"
                                                    value=${amount}
                                                    onInput=${e => handleUpdateFeeAmount(selectedGradeForFees, item.key, e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    `;
                                })}
                            </div>
                        </div>

                        <div class="mt-auto pt-6 border-t border-slate-200 flex justify-end">
                            <button 
                                onClick=${() => setShowFeeManager(false)}
                                class="px-6 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            `}

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- PAYMENT ENTRY SECTION -->
                <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 no-print">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="font-bold">Record New Payment</h3>
                        <button 
                            onClick=${() => setShowFeeManager(true)}
                            class="bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-900"
                        >
                            Manage Fee Items
                        </button>
                    </div>
                    
                    <form onSubmit=${handlePayment} class="space-y-6">
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div class="space-y-1">
                                <label class="text-xs font-bold text-slate-500 uppercase">Filter Grade</label>
                                <select 
                                    class="w-full p-3 bg-slate-50 rounded-xl outline-none border border-transparent focus:border-primary font-bold text-primary"
                                    value=${filterGrade}
                                    onChange=${(e) => { setFilterGrade(e.target.value); setSelectedStudentId(''); }}
                                >
                                    <option value="ALL">All Grades</option>
                                    ${(data.settings.grades || []).map(g => html`<option value=${g}>${g}</option>`)}
                                </select>
                            </div>
                            <div class="space-y-1 md:col-span-1">
                                <label class="text-xs font-bold text-slate-500 uppercase">Select Student</label>
                                <select 
                                    required
                                    class="w-full p-3 bg-slate-50 rounded-xl outline-none border border-transparent focus:border-primary"
                                    value=${selectedStudentId}
                                    onChange=${(e) => setSelectedStudentId(e.target.value)}
                                >
                                    <option value="">Select Student</option>
                                    ${(data.students || [])
                                        .filter(s => filterGrade === 'ALL' || s.grade === filterGrade)
                                        .map(s => html`
                                            <option value=${s.id}>${s.name} (Adm: ${s.admissionNo})</option>
                                        `)}
                                </select>
                            </div>
                            <div class="space-y-1">
                                <label class="text-xs font-bold text-slate-500 uppercase">Academic Term</label>
                                <select 
                                    class="w-full p-3 bg-slate-50 rounded-xl outline-none border border-transparent focus:border-primary font-bold text-primary"
                                    value=${selectedTerm}
                                    onChange=${(e) => setSelectedTerm(e.target.value)}
                                >
                                    ${terms.map(t => html`<option value=${t}>${t}</option>`)}
                                </select>
                            </div>
                        </div>

                        ${student && feeStructure && html`
                            <div class="space-y-4">
                                <div class="flex justify-between items-center">
                                    <label class="text-xs font-bold text-slate-500 uppercase">Fee Breakdown (${data.settings.currency})</label>
                                    <div class="text-xs text-slate-500">
                                        ${student.name}'s Selected Items for ${student.grade}
                                    </div>
                                </div>
                                
                                <!-- FEE ITEMS AS CARDS -->
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-2 no-scrollbar">
                                    {/* Previous Arrears Card (Special) */}
                                    ${Number(student.previousArrears) > 0 && html`
                                        <div class="col-span-full p-4 bg-orange-50 rounded-xl border-2 border-orange-200">
                                            <div class="flex justify-between items-center mb-2">
                                                <div>
                                                    <p class="text-[10px] font-black text-orange-600 uppercase">Arrears Brought Forward</p>
                                                    <p class="text-xs text-orange-500">Outstanding balance from previous years</p>
                                                </div>
                                                <button 
                                                    type="button"
                                                    onClick=${() => handleItemInput('previousArrears', student.previousArrears)}
                                                    class="text-[9px] bg-orange-600 text-white px-3 py-1 rounded font-bold hover:bg-orange-700"
                                                >
                                                    Pay Full
                                                </button>
                                            </div>
                                            <div class="flex items-center gap-2">
                                                <span class="text-orange-700 font-bold">${data.settings.currency}</span>
                                                <input 
                                                    type="number"
                                                    placeholder="Enter amount to pay towards arrears..."
                                                    class="flex-1 p-3 bg-white border border-orange-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500 font-bold text-orange-700"
                                                    value=${paymentItems['previousArrears'] || ''}
                                                    onInput=${(e) => handleItemInput('previousArrears', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    `}
                                    
                                    {/* Regular Fee Item Cards */}
                                    ${getFilteredFeeItems().map(item => {
                                        const due = feeStructure[item.key] || 0;
                                        const isEnabled = (student.selectedFees || ['t1', 't2', 't3']).includes(item.key);
                                        
                                        return html`
                                            <div class="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-primary transition-colors">
                                                <div class="flex justify-between items-start mb-2">
                                                    <div>
                                                        <p class="text-xs font-bold text-slate-700">${item.label}</p>
                                                        <p class="text-[10px] text-slate-500">Due: ${data.settings.currency} ${due.toLocaleString()}</p>
                                                    </div>
                                                    <div class="flex items-center gap-2">
                                                        <button 
                                                            type="button"
                                                            onClick=${() => toggleFeeItemForStudent(item.key)}
                                                            class=${`text-[8px] px-2 py-1 rounded font-bold ${
                                                                isEnabled 
                                                                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                                                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                                                            }`}
                                                            title=${isEnabled ? 'Disable for this student' : 'Enable for this student'}
                                                        >
                                                            ${isEnabled ? 'ON' : 'OFF'}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div class="flex items-center gap-2">
                                                    <span class="text-slate-500 text-xs">${data.settings.currency}</span>
                                                    <input 
                                                        type="number"
                                                        placeholder="0"
                                                        class="flex-1 p-2 bg-white border border-slate-300 rounded-lg text-sm outline-none focus:border-primary"
                                                        value=${paymentItems[item.key] || ''}
                                                        onInput=${(e) => handleItemInput(item.key, e.target.value)}
                                                        disabled=${!isEnabled}
                                                    />
                                                </div>
                                            </div>
                                        `;
                                    })}
                                </div>
                                
                                <div class="pt-4 border-t flex justify-between items-center">
                                    <span class="font-bold text-slate-700">Total to Pay:</span>
                                    <span class="text-xl font-black text-blue-600">
                                        ${data.settings.currency} ${Object.values(paymentItems).reduce((sum, v) => sum + (v || 0), 0).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        `}

                        <button 
                            type="submit"
                            class="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed" 
                            disabled=${!selectedStudentId}
                        >
                            Generate Receipt
                        </button>
                    </form>
                </div>

                <!-- RECEIPT DISPLAY SECTION (unchanged from original) -->
                <div class="bg-slate-900 text-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl shadow-2xl relative overflow-hidden print:bg-white print:text-black print:shadow-none print:p-0 min-h-[500px] receipt-container">
                    <div class="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl print:hidden"></div>
                    ${receipt ? html`
                        <div class="relative space-y-6 print:space-y-4 print:w-full">
                            <div class="flex flex-col items-center text-center border-b border-slate-800 print:border-black pb-4">
                                <img src="${data.settings.schoolLogo}" class="w-12 h-12 sm:w-16 sm:h-16 mb-2 object-contain" alt="Logo" />
                                <h3 class="text-lg sm:text-2xl font-black uppercase tracking-tight">${data.settings.schoolName}</h3>
                                <p class="text-[9px] sm:text-sm text-slate-400 print:text-slate-600">${data.settings.schoolAddress}</p>
                            </div>
                            
                            <div class="flex flex-col sm:flex-row justify-between items-start gap-4">
                                <div>
                                    <h4 class="text-blue-400 print:text-blue-600 font-bold uppercase tracking-widest text-[9px] sm:text-[10px]">Official Payment Receipt - Term ${receipt.term || 'N/A'}</h4>
                                    <p class="text-xl sm:text-2xl font-black mt-0.5 sm:mt-1">${receipt.receiptNo}</p>
                                </div>
                                <div class="text-left sm:text-right w-full sm:w-auto border-t border-slate-800 sm:border-0 pt-2 sm:pt-0">
                                    <p class="text-slate-400 print:text-slate-600 text-[10px] sm:text-xs">Date: ${receipt.date}</p>
                                </div>
                            </div>

                            <div class="border-t border-slate-800 print:border-black pt-4 space-y-2">
                                <div class="flex justify-between text-xs sm:text-sm">
                                    <span class="text-slate-400 print:text-slate-600">Student:</span>
                                    <span class="font-bold">${receipt.studentName} (${receipt.grade})</span>
                                </div>
                                
                                <div class="mt-4 overflow-x-auto no-scrollbar">
                                    <div class="grid grid-cols-4 text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase mb-2 border-b border-slate-800 pb-1 print:border-black min-w-[280px]">
                                        <span>Item</span>
                                        <span class="text-right">Fee</span>
                                        <span class="text-right">Paid</span>
                                        <span class="text-right">Balance</span>
                                    </div>
                                    <div class="space-y-1 min-w-[280px]">
                                        {/* Receipt item display logic (unchanged) */}
                                        ${allFeeItems.map(col => {
                                            const paidNow = receipt.items?.[col.key] || 0;
                                            const targetStudent = data.students.find(s => s.name === receipt.studentName);
                                            const isSelected = (targetStudent?.selectedFees || ['t1', 't2', 't3']).includes(col.key);
                                            const feeAmount = isSelected ? (receipt.structure?.[col.key] || 0) : 0;
                                            
                                            if (feeAmount === 0 && paidNow === 0) return null;

                                            const totalPaidForItem = (receipt.history || []).reduce((sum, p) => sum + (p.items?.[col.key] || 0), 0);
                                            const itemBalance = feeAmount - totalPaidForItem;
                                            
                                            return html`
                                                <div class="grid grid-cols-4 text-[10px] border-b border-slate-800/30 print:border-slate-100 py-1.5 items-center">
                                                    <span class="text-slate-400 print:text-slate-500 truncate pr-1">${col.label}</span>
                                                    <span class="text-right text-slate-300 print:text-slate-400 font-medium">${feeAmount.toLocaleString()}</span>
                                                    <span class=${`text-right font-bold ${paidNow > 0 ? 'text-white print:text-black' : 'text-slate-600 print:text-slate-300'}`}>
                                                        ${paidNow > 0 ? paidNow.toLocaleString() : '-'}
                                                    </span>
                                                    <span class="text-right font-mono font-bold ${itemBalance > 0 ? 'text-orange-400 print:text-slate-700' : 'text-green-400 print:text-green-600'}">
                                                        ${itemBalance.toLocaleString()}
                                                    </span>
                                                </div>
                                            `;
                                        })}
                                    </div>
                                </div>

                                <div class="flex justify-between items-center bg-slate-800 print:bg-slate-100 p-4 rounded-xl mt-6">
                                    <span class="text-slate-400 print:text-slate-600 font-bold uppercase text-xs">Total Amount Paid</span>
                                    <span class="text-2xl font-black text-green-400 print:text-green-700">${data.settings.currency} ${receipt.amount.toLocaleString()}</span>
                                </div>
                                
                                <div class="space-y-1 px-2 pt-2">
                                    <div class="flex justify-between border-t border-slate-800/50 print:border-slate-200 pt-1">
                                        <span class="text-slate-500 print:text-slate-400 text-[9px] font-black uppercase tracking-wider">Overall Account Balance</span>
                                        <span class="font-black text-[12px] text-orange-400 print:text-black">${data.settings.currency} ${receipt.balance.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div class="pt-8 text-center hidden print:block">
                                <div class="flex justify-around mb-8 items-end h-16">
                                    <div class="text-center w-32">
                                        <div class="h-10 flex items-center justify-center mb-1">
                                            ${data.settings.clerkSignature && html`<img src="${data.settings.clerkSignature}" class="h-full object-contain" />`}
                                        </div>
                                        <div class="border-t border-black pt-1 text-[8px] font-bold uppercase">Accounts Clerk</div>
                                    </div>
                                    <div class="text-center w-32">
                                        <div class="h-10 flex items-center justify-center mb-1">
                                            <img src="${data.settings.schoolLogo}" class="h-full object-contain opacity-20 grayscale" />
                                        </div>
                                        <div class="border-t border-black pt-1 text-[8px] font-bold uppercase">School Stamp</div>
                                    </div>
                                </div>
                                <p class="text-[10px] italic">Thank you for your payment.</p>
                            </div>
                            
                            <button onClick=${() => window.print()} class="w-full py-3 bg-blue-600 text-white rounded-xl font-bold no-print shadow-lg shadow-blue-500/30">
                                Print Receipt
                            </button>
                        </div>
                    ` : html`
                        <div class="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                            <span class="text-4xl">🧾</span>
                            <p>Select a student and enter item-wise payments to generate a detailed receipt</p>
                        </div>
                    `}
                </div>
            </div>

            <!-- TRANSACTION HISTORY SECTION (unchanged) -->
            <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mt-8 no-print">
                <div class="p-6 border-b border-slate-50 flex justify-between items-center">
                    <h3 class="font-bold">Transaction History</h3>
                    <div class="flex items-center gap-4">
                        <select 
                            class="bg-slate-50 border-0 rounded-lg text-[10px] font-bold uppercase p-2 outline-none focus:ring-1 focus:ring-primary"
                            value=${filterGrade}
                            onChange=${e => setFilterGrade(e.target.value)}
                        >
                            <option value="ALL">All Grades</option>
                            ${data.settings.grades.map(g => html`<option value=${g}>${g}</option>`)}
                        </select>
                        <span class="text-xs text-slate-400">${(data.payments || []).length} Total</span>
                    </div>
                </div>
                <div class="overflow-x-auto no-scrollbar">
                    <table class="w-full text-left min-w-[500px]">
                        <thead class="bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
                            <tr>
                                <th class="px-6 py-3">Receipt #</th>
                                <th class="px-6 py-3">Student</th>
                                <th class="px-6 py-3">Date</th>
                                <th class="px-6 py-3 text-right">Amount</th>
                                <th class="px-6 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-50">
                            ${(data.payments || [])
                                .filter(p => {
                                    if (filterGrade === 'ALL') return true;
                                    const s = data.students.find(st => st.id === p.studentId);
                                    return s?.grade === filterGrade;
                                })
                                .slice().reverse().map(p => {
                                const s = data.students.find(st => st.id === p.studentId);
                                return html`
                                    <tr key=${p.id} class="hover:bg-slate-50">
                                        <td class="px-6 py-4 font-mono text-xs">${p.receiptNo}</td>
                                        <td class="px-6 py-4 font-medium text-sm">${s?.name || 'Unknown'}</td>
                                        <td class="px-6 py-4 text-xs text-slate-500">${p.date}</td>
                                        <td class="px-6 py-4 text-right font-bold text-slate-700">${data.settings.currency} ${p.amount.toLocaleString()}</td>
                                        <td class="px-6 py-4 text-center">
                                            <div class="flex items-center justify-center gap-2">
                                                <button 
                                                    onClick=${() => viewReceipt(p)}
                                                    class="text-blue-600 text-[10px] font-bold uppercase hover:underline"
                                                >
                                                    View
                                                </button>
                                                <button 
                                                    onClick=${() => handleDeletePayment(p.id)}
                                                    class="text-red-500 text-[10px] font-bold uppercase hover:underline"
                                                >
                                                    Void
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                `;
                            })}
                        </tbody>
                    </table>
                </div>
                ${(!data.payments || data.payments.length === 0) && html`
                    <div class="p-12 text-center text-slate-300">No transactions recorded yet.</div>
                `}
            </div>
            <style>
                @media print {
                    .no-print { display: none !important; }
                    .bg-slate-900 { background-color: white !important; color: black !important; }
                    .text-white { color: black !important; }
                    .text-blue-400 { color: #2563eb !important; }
                    .text-green-400 { color: #166534 !important; }
                    .text-orange-400 { color: #9a3412 !important; }
                    .border-slate-800 { border-color: #000 !important; }
                    
                    body, html { height: auto !important; overflow: visible !important; }
                    #app { height: auto !important; overflow: visible !important; }
                    main { overflow: visible !important; position: static !important; }
                    .receipt-container { 
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 100% !important;
                        height: auto !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        z-index: 9999 !important;
                    }
                    .bg-slate-900.print\:bg-white { background: white !important; }
                }
            </style>
        </div>
    `;
};