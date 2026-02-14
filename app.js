import { h, render } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import htm from 'htm';
import { Dashboard } from './components/Dashboard.js';
import { Students } from './components/Students.js';
import { Teachers } from './components/Teachers.js';
import { Staff } from './components/Staff.js';
import { Marklist } from './components/Marklist.js';
import { Assessments } from './components/Assessments.js';
import { ResultAnalysis } from './components/ResultAnalysis.js';
import { Timetable } from './components/Timetable.js';
import { Fees } from './components/Fees.js';
import { FeesRegister } from './components/FeesRegister.js';
import { FeeReminder } from './components/FeeReminder.js';
import { Transport } from './components/Transport.js';
import { Library } from './components/Library.js';
import { Payroll } from './components/Payroll.js';
import { SeniorSchool } from './components/SeniorSchool.js';
import { Archives } from './components/Archives.js';
import { Settings } from './components/Settings.js';
import { Sidebar } from './components/Sidebar.js';
import { Storage } from './lib/storage.js';

const html = htm.bind(h);

const App = () => {
    const [view, setView] = useState('dashboard');
    const [data, setData] = useState(Storage.load());
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [isAdmin, setIsAdmin] = useState(localStorage.getItem('et_is_admin') === 'true');
    const [loginUsername, setLoginUsername] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        Storage.save(data);
    }, [data]);

    useEffect(() => {
        const ws = window.websim || websim;
        if (!ws) return;

        const initCloudSync = async () => {
            try {
                const project = await ws.getCurrentProject();
                const remoteData = await Storage.pullFromCloud(project.id);
                if (remoteData) {
                    setData(prev => Storage.mergeData(prev, remoteData, 'all'));
                }
            } catch (err) {
                console.warn("Initial cloud sync skipped:", err);
            }
        };

        const handleRemoteUpdate = async (event) => {
            const { comment } = event;
            if (comment && comment.raw_content && comment.raw_content.includes('[DATA_SYNC]')) {
                const match = comment.raw_content.match(/\[DATA_SYNC\]\s+(https?:\/\/[^\s\)]+)/);
                if (match && match[1]) {
                    setIsSyncing(true);
                    try {
                        const response = await fetch(match[1]);
                        const remoteData = await response.json();
                        setData(prev => Storage.mergeData(prev, remoteData, 'all'));
                    } catch (e) {
                        console.error("Failed to fetch remote update");
                    } finally {
                        setTimeout(() => setIsSyncing(false), 2000);
                    }
                }
            }
        };

        initCloudSync();
        ws.addEventListener('comment:created', handleRemoteUpdate);
        return () => ws.removeEventListener('comment:created', handleRemoteUpdate);
    }, []);

    // Listen for a restore event dispatched by Archives (or anywhere)
    useEffect(() => {
        const handler = (e) => {
            if (e?.detail?.restored) {
                setData(e.detail.restored);
                alert('Archived year restored into active data.');
            }
        };
        window.addEventListener('edutrack:restore', handler);
        return () => window.removeEventListener('edutrack:restore', handler);
    }, []);

    const handleCloudPush = async () => {
        const ws = window.websim || websim;
        if (!ws) {
            alert("Cloud services are currently unavailable. Please try refreshing the page.");
            return;
        }
        setIsSyncing(true);
        const result = await Storage.pushToCloud(data);
        if (result && result.error) {
            alert("Cloud sync failed: " + result.error);
        }
        setIsSyncing(false);
    };

    useEffect(() => {
        if (!data || !data.settings) return;
        // Apply dynamic theme colors
        const root = document.documentElement;
        root.style.setProperty('--primary-color', data.settings.primaryColor || '#2563eb');
        root.style.setProperty('--secondary-color', data.settings.secondaryColor || '#64748b');
        
        if (data.settings.theme === 'dark') {
            document.body.classList.add('bg-slate-950', 'text-slate-100');
            document.body.classList.remove('bg-gray-50', 'text-slate-900');
        } else {
            document.body.classList.remove('bg-slate-950', 'text-slate-100');
            document.body.classList.add('bg-gray-50', 'text-slate-900');
        }
    }, [data.settings?.primaryColor, data.settings?.secondaryColor, data.settings?.theme]);

    const handleLogin = (e) => {
        e.preventDefault();
        if (loginUsername === 'admin' && loginPassword === 'admin002') {
            setIsAdmin(true);
            localStorage.setItem('et_is_admin', 'true');
            setShowLoginModal(false);
            setLoginUsername('');
            setLoginPassword('');
        } else {
            alert('Invalid Admin Credentials');
        }
    };

    const handleLogout = () => {
        setIsAdmin(false);
        localStorage.removeItem('et_is_admin');
        setView('dashboard');
    };

    const navigate = (v, params = null) => {
        if (params?.studentId) {
            const student = (data.students || []).find(s => s.id === params.studentId);
            setSelectedStudent(student);
        }
        setView(v);
        setIsMobileMenuOpen(false);
    };

    const handleAcademicPrintSelect = (id, isBatch = false) => {
        const student = (data.students || []).find(s => s.id === id);
        setSelectedStudent(student);
        if (isBatch) {
            setView('batch-reports');
        } else {
            setView('student-detail');
        }
    };

    const handleGranularExport = (type) => {
        let exportObj = {};
        if (type === 'students') exportObj = { students: data.students };
        if (type === 'assessments') exportObj = { assessments: data.assessments, remarks: data.remarks };
        if (type === 'senior-school') {
            const seniorGrades = ['GRADE 10', 'GRADE 11', 'GRADE 12'];
            exportObj = { students: data.students.filter(s => seniorGrades.includes(s.grade)) };
        }
        if (type === 'academic-full') exportObj = { students: data.students, assessments: data.assessments, remarks: data.remarks };

        const dataStr = JSON.stringify(exportObj, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `edutrack_${type}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleGranularImport = (type) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const incoming = JSON.parse(event.target.result);
                    const merged = Storage.mergeData(data, incoming, type);
                    setData(merged);
                    alert(`Successfully integrated ${type} data!`);
                } catch (err) {
                    alert('Error parsing data file.');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    const AcademicTransferUI = ({ type }) => html`
        <div class="flex gap-2 no-print ml-auto">
            <button 
                onClick=${() => handleGranularExport(type)}
                class="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 hover:bg-slate-200"
                title="Export this section's data"
            >
                📤 Export
            </button>
            <button 
                onClick=${() => handleGranularImport(type)}
                class="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 hover:bg-slate-200"
                title="Import and merge data"
            >
                📥 Import
            </button>
        </div>
    `;

    const renderView = () => {
        switch (view) {
            case 'dashboard': return html`<${Dashboard} data=${data} />`;
            case 'batch-reports': {
                const grade = selectedStudent?.grade || 'GRADE 1';
                const gradeStudents = data.students.filter(s => s.grade === grade);
                return html`
                    <div class="space-y-8">
                        <div class="flex justify-between items-center no-print bg-white p-4 rounded-xl border mb-6">
                            <button onClick=${() => setView('result-analysis')} class="text-blue-600 font-bold flex items-center gap-1">
                                <span>←</span> Back to Analysis
                            </button>
                            <div class="text-center">
                                <h2 class="font-black">Batch Printing: ${grade}</h2>
                                <p class="text-[10px] text-slate-500 uppercase font-bold">${gradeStudents.length} Reports Ready</p>
                            </div>
                            <button onClick=${() => window.print()} class="bg-primary text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-blue-200">
                                🖨️ Print All
                            </button>
                        </div>
                        <div class="space-y-12">
                            ${gradeStudents.map((s, idx) => html`
                                <div class=${idx > 0 ? 'page-break pt-8' : ''}>
                                    <${StudentDetail} student=${s} data=${data} setData=${setData} isBatch=${true} />
                                </div>
                            `)}
                        </div>
                    </div>
                `;
            }
            case 'students': return html`
                <div class="space-y-4">
                    <div class="flex justify-end"><${AcademicTransferUI} type="students" /></div>
                    <${Students} data=${data} setData=${setData} onSelectStudent=${(id) => navigate('student-detail', { studentId: id })} />
                </div>
            `;
            case 'teachers': return html`<${Teachers} data=${data} setData=${setData} />`;
            case 'staff': return html`<${Staff} data=${data} setData=${setData} />`;
            case 'marklist': return html`
                <div class="space-y-4">
                    <div class="flex justify-end"><${AcademicTransferUI} type="assessments" /></div>
                    <${Marklist} data=${data} setData=${setData} />
                </div>
            `;
            case 'assessments': return html`
                <div class="space-y-4">
                    <div class="flex justify-end"><${AcademicTransferUI} type="assessments" /></div>
                    <${Assessments} data=${data} setData=${setData} />
                </div>
            `;
            case 'senior-school': return html`
                <div class="space-y-4">
                    <div class="flex justify-end"><${AcademicTransferUI} type="senior-school" /></div>
                    <${SeniorSchool} data=${data} setData=${setData} />
                </div>
            `;
            case 'timetable': return html`<${Timetable} data=${data} setData=${setData} />`;
            case 'result-analysis': return html`
                <div class="space-y-4">
                    <div class="flex justify-end"><${AcademicTransferUI} type="academic-full" /></div>
                    <${ResultAnalysis} data=${data} onSelectStudent=${handleAcademicPrintSelect} />
                </div>
            `;
            case 'fees': return html`<${Fees} data=${data} setData=${setData} />`;
            case 'fees-register': return html`<${FeesRegister} data=${data} />`;
            case 'fee-reminder': return html`<${FeeReminder} data=${data} />`;
            case 'transport': return html`<${Transport} data=${data} setData=${setData} />`;
            case 'library': return html`<${Library} data=${data} setData=${setData} />`;
            case 'payroll': return html`<${Payroll} data=${data} setData=${setData} />`;
            case 'archives': return html`<${Archives} data=${data} />`;
            case 'settings': return html`<${Settings} data=${data} setData=${setData} />`;
            case 'student-detail': return html`<${StudentDetail} student=${selectedStudent} data=${data} setData=${setData} onBack=${() => setView('students')} />`;
            default: return html`<${Dashboard} data=${data} />`;
        }
    };

    return html`
        <div class=${`flex flex-col h-screen w-full overflow-hidden ${data.settings.theme === 'dark' ? 'dark text-white' : ''}`}>
            <!-- Dynamic Styles Injection -->
            <style>
                :root {
                    --primary: ${data.settings.primaryColor || '#2563eb'};
                    --secondary: ${data.settings.secondaryColor || '#64748b'};
                }
                .bg-primary { background-color: var(--primary) !important; }
                .text-primary { color: var(--primary) !important; }
                .border-primary { border-color: var(--primary) !important; }
                .focus\:ring-primary:focus { --tw-ring-color: var(--primary) !important; }
                .focus\:border-primary:focus { border-color: var(--primary) !important; }
                
                .bg-secondary { background-color: var(--secondary) !important; }
                .text-secondary { color: var(--secondary) !important; }
                .border-secondary { border-color: var(--secondary) !important; }
                
                /* Override hardcoded blue-600 occurrences for global theme consistency */
                .bg-blue-600 { background-color: var(--primary) !important; }
                .text-blue-600 { color: var(--primary) !important; }
                .border-blue-600 { border-color: var(--primary) !important; }
                .shadow-blue-200 { --tw-shadow-color: var(--primary); shadow: 0 10px 15px -3px var(--primary); }
                
                ${data.settings.theme === 'dark' ? `
                    .bg-white { background-color: #0f172a !important; color: #f1f5f9; }
                    .bg-slate-50 { background-color: #1e293b !important; }
                    .bg-slate-100 { background-color: #334155 !important; }
                    .border-slate-100, .border-slate-50, .border-blue-100 { border-color: #334155 !important; }
                    .text-slate-900 { color: #f8fafc !important; }
                    .text-slate-500, .text-slate-400 { color: #94a3b8 !important; }
                ` : ''}
            </style>

            <!-- Navbar -->
            <header class="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 md:px-8 z-40 no-print">
                <div class="flex items-center gap-3">
                    <button 
                        onClick=${() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        class="md:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-600"
                    >
                        <span class="text-xl">☰</span>
                    </button>
                    <img src="${data.settings.schoolLogo}" class="w-8 h-8 object-contain" />
                    <span class="font-black tracking-tight text-lg hidden sm:block">${data.settings.schoolName}</span>
                </div>
                
                <div class="flex items-center gap-3">
                    <button 
                        onClick=${handleCloudPush}
                        class=${`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all border ${
                            isSyncing 
                            ? 'bg-blue-50 border-blue-200 text-blue-600 animate-pulse' 
                            : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-primary hover:text-primary'
                        }`}
                    >
                        <span class=${isSyncing ? 'animate-spin' : ''}>${isSyncing ? '⏳' : '☁️'}</span>
                        <span class="hidden sm:inline">${isSyncing ? 'Syncing...' : 'Cloud Sync'}</span>
                    </button>

                    <div class="h-8 w-px bg-slate-100 mx-1 hidden sm:block"></div>

                    ${isAdmin ? html`
                        <div class="flex items-center gap-2">
                            <span class="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold uppercase">Admin Mode</span>
                            <button onClick=${handleLogout} class="text-xs font-bold text-red-500 hover:underline uppercase">Logout</button>
                        </div>
                    ` : html`
                        <button onClick=${() => setShowLoginModal(true)} class="bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm shadow-blue-200">
                            Admin Login
                        </button>
                    `}
                </div>
            </header>

            <div class="flex flex-1 overflow-hidden">
                <${Sidebar} 
                    currentView=${view} 
                    setView=${setView} 
                    isCollapsed=${sidebarCollapsed} 
                    setCollapsed=${setSidebarCollapsed}
                    isMobileOpen=${isMobileMenuOpen}
                    setIsMobileOpen=${setIsMobileMenuOpen}
                />
                <main class="flex-1 overflow-y-auto no-scrollbar pb-20 md:pb-0">
                    <div class="max-w-6xl mx-auto p-4 md:p-8">
                        ${!isAdmin && ['settings', 'fees', 'fees-register', 'teachers', 'staff', 'payroll'].includes(view) ? html`
                            <div class="flex flex-col items-center justify-center h-96 text-center space-y-4">
                                <span class="text-5xl">🔒</span>
                                <h2 class="text-xl font-bold">Admin Access Required</h2>
                                <p class="text-slate-400 max-w-xs">Please log in as an administrator to access financial records and system settings.</p>
                                <button onClick=${() => setShowLoginModal(true)} class="bg-primary text-white px-6 py-3 rounded-xl font-bold">Login Now</button>
                            </div>
                        ` : renderView()}
                    </div>
                </main>
            </div>

            <!-- Login Modal -->
            ${showLoginModal && html`
                <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div class="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                        <h3 class="text-2xl font-black mb-2">Administrator Login</h3>
                        <p class="text-slate-400 text-sm mb-6">Enter your security credentials to manage sensitive school data.</p>
                        <form onSubmit=${handleLogin} class="space-y-4">
                            <div class="space-y-1">
                                <label class="text-[10px] font-bold text-slate-400 uppercase ml-1">Username</label>
                                <input 
                                    type="text"
                                    placeholder="Admin username"
                                    class="w-full p-4 bg-slate-50 rounded-2xl border-0 focus:ring-2 focus:ring-primary outline-none"
                                    value=${loginUsername}
                                    onInput=${e => setLoginUsername(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div class="space-y-1">
                                <label class="text-[10px] font-bold text-slate-400 uppercase ml-1">Password</label>
                                <input 
                                    type="password"
                                    placeholder="Enter password..."
                                    class="w-full p-4 bg-slate-50 rounded-2xl border-0 focus:ring-2 focus:ring-primary outline-none"
                                    value=${loginPassword}
                                    onInput=${e => setLoginPassword(e.target.value)}
                                />
                                <p class="text-[8px] text-slate-400 mt-1 italic">Ask the admin</p>
                            </div>
                            <div class="flex gap-3">
                                <button type="button" onClick=${() => setShowLoginModal(false)} class="flex-1 py-4 text-slate-500 font-bold">Cancel</button>
                                <button type="submit" class="flex-1 py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-blue-200">Verify</button>
                            </div>
                        </form>
                    </div>
                </div>
            `}
        </div>
    `;
};

const StudentDetail = ({ student, data, setData, onBack, isBatch = false }) => {
    if (!student) return html`<div>Student not found</div>`;
    
    const settings = data.settings;
    const examTypes = ['Opener', 'Mid-Term', 'End-Term'];
    const currentTerm = 'T1'; // Could be dynamic
    const assessments = data.assessments.filter(a => a.studentId === student.id && a.term === currentTerm);
    
    // Calculate totals for summary cards based on subject averages
    const subjects = Storage.getSubjectsForGrade(student.grade);
    const subjectAverages = subjects.map(subject => {
        const scores = examTypes.map(type => {
            const match = assessments.find(a => a.subject === subject && a.examType === type);
            return match ? Number(match.score) : null;
        }).filter(s => s !== null);
        return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    });

    const totalMarks = subjectAverages.reduce((sum, avg) => sum + (avg || 0), 0);
    const totalPoints = subjectAverages.reduce((sum, avg) => sum + (avg !== null ? Storage.getGradeInfo(avg).points : 0), 0);

    const payments = data.payments.filter(p => p.studentId === student.id);
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    
    const feeStructure = data.settings.feeStructures.find(f => f.grade === student.grade);
    const feeKeys = ['t1', 't2', 't3', 'breakfast', 'lunch', 'trip', 'bookFund', 'caution', 'uniform', 'studentCard', 'remedial'];
    
    // Calculate total due based ONLY on student's selected payable items
    const selectedKeys = student.selectedFees || ['t1', 't2', 't3'];
    const totalDue = feeStructure ? selectedKeys.reduce((sum, key) => sum + (feeStructure[key] || 0), 0) : 0;
    const balance = totalDue - totalPaid;

    const remark = (data.remarks || []).find(r => r.studentId === student.id) || { teacher: '', principal: '' };
    const classTeacher = (data.teachers || []).find(t => t.isClassTeacher && t.classTeacherGrade === student.grade);

    const handleRemarkChange = (field, val) => {
        const otherRemarks = (data.remarks || []).filter(r => r.studentId !== student.id);
        setData({
            ...data,
            remarks: [...otherRemarks, { ...remark, studentId: student.id, [field]: val }]
        });
    };

    return html`
        <div class="space-y-4 print:space-y-2">
            ${!isBatch && html`
                <button onClick=${onBack} class="text-blue-600 flex items-center gap-1 no-print">
                    <span class="text-xl">←</span> Back to Students
                </button>
            `}
            
            <div class=${`bg-white p-6 rounded-2xl shadow-sm border border-slate-100 print:border-0 print:shadow-none print:p-0 ${isBatch ? '' : ''}`}>
                <div class="hidden print:flex flex-col items-center text-center border-b pb-2 mb-2">
                    <img src="${settings.schoolLogo}" class="w-12 h-12 mb-1 object-contain" alt="Logo" />
                    <h1 class="text-xl font-black uppercase text-slate-900">${settings.schoolName}</h1>
                    <p class="text-[10px] text-slate-500 font-medium">${settings.schoolAddress}</p>
                    <div class="mt-2 border-t border-slate-200 w-full pt-2">
                        <h2 class="text-sm font-extrabold uppercase tracking-widest text-blue-600">Progressive Student Report</h2>
                    </div>
                </div>

                <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b pb-2 print:border-b-2 print:border-black">
                    <div class="w-full">
                        <h2 class="text-xl font-black border-b border-slate-100 pb-1 mb-1">${student.name}</h2>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1 text-slate-500 text-[10px]">
                            <div>
                                <p class="text-[9px] font-bold text-slate-400 uppercase">Grade / Class</p>
                                <p class="font-bold text-slate-900">${student.grade}</p>
                            </div>
                            <div>
                                <p class="text-[9px] font-bold text-slate-400 uppercase">Stream / House</p>
                                <p class="font-bold text-slate-900">${student.stream || 'N/A'}</p>
                            </div>
                            <div>
                                <p class="text-[9px] font-bold text-slate-400 uppercase">Admission No.</p>
                                <p class="font-bold text-slate-900 font-mono">${student.admissionNo}</p>
                            </div>
                            <div>
                                <p class="text-[9px] font-bold text-slate-400 uppercase">Assess/UPI No.</p>
                                <p class="font-bold text-slate-900 font-mono">${student.assessmentNo || student.upiNo || '-'}</p>
                            </div>
                        </div>
                    </div>
                    <div class="flex gap-2 no-print">
                        <button onClick=${() => window.print()} class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-200">Print Report Card</button>
                    </div>
                </div>

                <div class="grid grid-cols-2 md:grid-cols-5 print:grid-cols-5 gap-2 mt-4 print:mt-2">
                    <div class="p-2 bg-blue-50 rounded-lg print:p-1.5 border border-blue-100">
                        <p class="text-[8px] text-blue-600 font-bold uppercase">Fee Balance</p>
                        <p class="text-sm font-bold print:text-[11px]">${data.settings.currency} ${balance.toLocaleString()}</p>
                    </div>
                    <div class="p-2 bg-slate-50 rounded-lg print:p-1.5 border border-slate-100">
                        <p class="text-[8px] text-slate-500 font-bold uppercase">Total Marks</p>
                        <p class="text-sm font-bold print:text-[11px]">${totalMarks}</p>
                    </div>
                    <div class="p-2 bg-indigo-50 rounded-lg print:p-1.5 border border-indigo-100">
                        <p class="text-[8px] text-indigo-600 font-bold uppercase">Total Points</p>
                        <p class="text-sm font-bold print:text-[11px]">${totalPoints}</p>
                    </div>
                    <div class="p-2 bg-green-50 rounded-lg print:p-1.5 border border-green-100">
                        <p class="text-[8px] text-green-600 font-bold uppercase">Overall</p>
                        <p class="text-sm font-bold print:text-[11px]">ME</p>
                    </div>
                    <div class="p-2 bg-purple-50 rounded-lg print:p-1.5 border border-purple-100">
                        <p class="text-[8px] text-purple-600 font-bold uppercase">Attendance</p>
                        <p class="text-sm font-bold print:text-[11px]">94%</p>
                    </div>
                </div>

                <div class="mt-4 print:mt-2">
                    <div class="border rounded-xl overflow-hidden print:border-black print:rounded-none overflow-x-auto no-scrollbar">
                        <table class="w-full text-left">
                            <thead class="bg-slate-50 print:bg-white border-b print:border-b-2 print:border-black">
                                <tr class="text-[9px] uppercase font-black text-slate-500">
                                    <th class="p-2 print:p-1.5">Learning Area</th>
                                    <th class="p-2 print:p-1.5 text-center border-l">Opener</th>
                                    <th class="p-2 print:p-1.5 text-center border-l">Mid</th>
                                    <th class="p-2 print:p-1.5 text-center border-l">End</th>
                                    <th class="p-2 print:p-1.5 text-center border-l bg-blue-50 text-blue-700">Average</th>
                                    <th class="p-2 print:p-1.5 text-center border-l">Level</th>
                                    <th class="p-2 print:p-1.5 text-center border-l font-black">Pts</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y print:divide-black">
                                ${Storage.getSubjectsForGrade(student.grade).map(subject => {
                                    const scores = {};
                                    examTypes.forEach(type => {
                                        const match = assessments.find(a => a.subject === subject && a.examType === type);
                                        scores[type] = match ? Number(match.score) : null;
                                    });

                                    const validScores = Object.values(scores).filter(s => s !== null);
                                    const average = validScores.length > 0 
                                        ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
                                        : null;
                                    
                                    const gradeInfo = average !== null ? Storage.getGradeInfo(average) : null;
                                    
                                    return html`
                                        <tr class="print:break-inside-avoid hover:bg-slate-50 border-b print:border-black last:border-0">
                                            <td class="p-2 print:p-1.5 font-bold text-slate-800 print:text-[11px]">
                                                ${subject}
                                            </td>
                                            <td class="p-2 print:p-1.5 text-center text-slate-500 border-l font-medium print:text-[11px]">${scores['Opener'] ?? '-'}</td>
                                            <td class="p-2 print:p-1.5 text-center text-slate-500 border-l font-medium print:text-[11px]">${scores['Mid-Term'] ?? '-'}</td>
                                            <td class="p-2 print:p-1.5 text-center text-slate-500 border-l font-medium print:text-[11px]">${scores['End-Term'] ?? '-'}</td>
                                            <td class="p-2 print:p-1.5 text-center font-black text-blue-600 border-l bg-blue-50/30 print:text-[11px]">${average !== null ? average + '%' : '-'}</td>
                                            <td class="p-2 print:p-1.5 text-center border-l">
                                                <span class=${`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                                    gradeInfo && gradeInfo.level !== '-' ? (
                                                        gradeInfo.level.startsWith('EE') ? 'bg-green-100 text-green-700' :
                                                        gradeInfo.level.startsWith('ME') ? 'bg-blue-100 text-blue-700' :
                                                        gradeInfo.level.startsWith('AE') ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                    ) : 'text-slate-300'
                                                }`}>
                                                    ${gradeInfo ? gradeInfo.level : '-'}
                                                </span>
                                            </td>
                                            <td class="p-2 print:p-1.5 text-center border-l font-black text-slate-700 print:text-[11px]">
                                                ${gradeInfo ? gradeInfo.points : '-'}
                                            </td>
                                        </tr>
                                    `;
                                })}
                            </tbody>
                            <tfoot class="bg-slate-50 border-t-2 border-slate-200 font-bold text-slate-900">
                                <tr class="print:border-black">
                                    <td class="p-2 print:p-1.5 uppercase text-[9px]">Learning Area Totals</td>
                                    ${['Opener', 'Mid-Term', 'End-Term'].map(type => {
                                        const sum = assessments.filter(a => a.examType === type).reduce((a, b) => a + Number(b.score), 0);
                                        return html`<td class="p-2 print:p-1.5 text-center border-l text-[10px] print:text-[11px]">${sum || '-'}</td>`;
                                    })}
                                    <td class="p-2 print:p-1.5 text-center border-l bg-blue-50/50 text-blue-700 text-[10px] print:text-[11px]">
                                        ${Math.round(Storage.getSubjectsForGrade(student.grade).reduce((sum, subject) => {
                                            const subScores = assessments.filter(a => a.subject === subject).map(a => Number(a.score));
                                            return sum + (subScores.length > 0 ? subScores.reduce((a,b)=>a+b,0)/subScores.length : 0);
                                        }, 0)) || '-'}
                                    </td>
                                    <td class="p-2 print:p-1.5 text-center border-l font-black text-blue-700 print:text-[11px]">${totalPoints}</td>
                                </tr>
                                <tr class="bg-white print:border-black">
                                    <td class="p-2 print:p-1.5 uppercase text-[9px] text-blue-600 font-black">Mean Score Average</td>
                                    ${['Opener', 'Mid-Term', 'End-Term'].map(type => {
                                        const typeAssessments = assessments.filter(a => a.examType === type);
                                        const count = Storage.getSubjectsForGrade(student.grade).length;
                                        const avg = typeAssessments.length > 0 ? Math.round(typeAssessments.reduce((a, b) => a + Number(b.score), 0) / count) : 0;
                                        return html`<td class="p-2 print:p-1.5 text-center border-l text-blue-600 font-black text-[10px] print:text-[11px]">${avg ? avg + '%' : '-'}</td>`;
                                    })}
                                    <td class="p-2 print:p-1.5 text-center border-l bg-blue-600 text-white text-[10px] print:text-[11px] font-black">
                                        ${(() => {
                                            const subs = Storage.getSubjectsForGrade(student.grade);
                                            const totalAvg = subs.reduce((sum, subject) => {
                                                const subScores = assessments.filter(a => a.subject === subject).map(a => Number(a.score));
                                                return sum + (subScores.length > 0 ? Math.round(subScores.reduce((a,b)=>a+b,0)/subScores.length) : 0);
                                            }, 0);
                                            return Math.round(totalAvg / subs.length) + '%';
                                        })()}
                                    </td>
                                    <td class="border-l"></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                <div class="mt-4 space-y-4 print:mt-2 print:space-y-2">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 print:gap-2">
                        <div class="space-y-1">
                            <label class="text-[10px] font-bold text-slate-500 uppercase no-print">Class Teacher's Overall Comment</label>
                            <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 print:bg-white print:border-0 print:p-0">
                                <textarea 
                                    class="w-full bg-transparent border-0 focus:ring-0 text-xs italic outline-none no-print min-h-[40px]" 
                                    placeholder="Enter teacher comments..."
                                    value=${remark.teacher}
                                    onInput=${(e) => handleRemarkChange('teacher', e.target.value)}
                                ></textarea>
                                <div class="hidden print:block text-[11px] border-b border-dotted border-black pb-0.5 mb-1">
                                    <span class="font-bold uppercase text-[9px] block">Class Teacher's Remarks:</span>
                                    ${remark.teacher || '____________________________________________________________________________________'}
                                </div>
                               
                            </div>
                        </div>

                        <div class="space-y-1">
                            <label class="text-[10px] font-bold text-slate-500 uppercase no-print">Principal's Overall Comment</label>
                            <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 print:bg-white print:border-0 print:p-0">
                                <textarea 
                                    class="w-full bg-transparent border-0 focus:ring-0 text-xs italic outline-none no-print min-h-[40px]" 
                                    placeholder="Enter principal comments..."
                                    value=${remark.principal}
                                    onInput=${(e) => handleRemarkChange('principal', e.target.value)}
                                ></textarea>
                                <div class="hidden print:block text-[11px] border-b border-dotted border-black pb-0.5 mb-1">
                                    <span class="font-bold uppercase text-[9px] block">Principal's Remarks:</span>
                                    ${remark.principal || '____________________________________________________________________________________'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Start of Page 2: Performance Tracker & Comments -->
                    <div class="report-page-break mt-6 pt-4 print:mt-4 print:pt-2">
                        <div class="flex flex-col gap-8">
                            <!-- Linear Performance Graph -->
                            <div class="bg-white p-4 rounded-2xl border border-slate-100 print:border-black print:rounded-none">
                                <h3 class="font-black text-[10px] uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2 print:text-black">
                                    <span class="w-1.5 h-1.5 rounded-full bg-blue-500 print:hidden"></span>
                                    Subject Performance Trend (Linear Analysis)
                                </h3>
                                
                                <div class="relative h-40 w-full mt-4 mb-8 px-8">
                                    <!-- SVG Line Graph (compact for printing) -->
                                    <svg viewBox="0 0 1000 320" class="w-full h-full overflow-visible">
                                        <!-- Grid Lines -->
                                        ${[0, 25, 50, 75, 100].map(val => {
                                            const y = 320 - (val * 3.2);
                                            return html`
                                                <line x1="0" y1=${y} x2="1000" y2=${y} stroke="#f1f5f9" stroke-width="1" />
                                                <text x="-40" y=${y + 4} class="text-[14px] fill-slate-400 font-bold print:fill-black">${val}%</text>
                                            `;
                                        })}
                                        
                                        <!-- X-Axis Labels & Points -->
                                        ${subjects.map((subject, idx) => {
                                            const x = subjects.length === 1 ? 500 : (idx / Math.max(1, subjects.length - 1)) * 1000;
                                            const avg = subjectAverages[idx] || 0;
                                            const y = 320 - (avg * 3.2);
                                            return html`
                                                <text 
                                                    x=${x} 
                                                    y="360" 
                                                    text-anchor="middle" 
                                                    class="text-[12px] font-black fill-slate-500 uppercase print:fill-black"
                                                    transform=${`rotate(30, ${x}, 360)`}
                                                >
                                                    ${subject.length > 12 ? subject.substring(0, 10) + '...' : subject}
                                                </text>
                                                <circle cx=${x} cy=${y} r="6" class="fill-blue-600 print:fill-black" />
                                                <text x=${x} y=${y - 12} text-anchor="middle" class="text-[12px] font-black fill-blue-800 print:fill-black">${avg}%</text>
                                            `;
                                        })}

                                        <!-- The Trend Line -->
                                        <path 
                                            d=${subjects.map((_, idx) => {
                                                const x = subjects.length === 1 ? 500 : (idx / Math.max(1, subjects.length - 1)) * 1000;
                                                const avg = subjectAverages[idx] || 0;
                                                const y = 320 - (avg * 3.2);
                                                return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                                            }).join(' ')}
                                            fill="none" 
                                            stroke="#2563eb" 
                                            stroke-width="3" 
                                            stroke-linecap="round" 
                                            stroke-linejoin="round"
                                            class="print:stroke-black"
                                        />
                                    </svg>
                                    
                                    <!-- Competency Zones Labels (subtle) -->
                                    <div class="absolute left-0 top-0 h-full w-full pointer-events-none flex flex-col justify-between py-1 opacity-20 print:hidden">
                                        <div class="border-t-2 border-green-500 w-full h-0"></div>
                                        <div class="border-t-2 border-blue-500 w-full h-0"></div>
                                        <div class="border-t-2 border-yellow-500 w-full h-0"></div>
                                        <div class="border-t-2 border-red-500 w-full h-0"></div>
                                    </div>
                                </div>
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
                                <div class="space-y-4">
                                    <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-1">Teacher's Remarks</h4>
                                    <div class="p-4 bg-slate-50 rounded-xl min-h-[100px] border border-slate-100 print:bg-white print:border-black print:p-2">
                                        <p class="text-sm italic text-slate-700">${remark.teacher || '____________________________________________________'}</p>
                                    </div>
                                    <div class="flex flex-col items-center pt-4">
                                        <div class="h-12 w-32 flex items-center justify-center border-b border-black">
                                            <img src="${settings.clerkSignature || settings.schoolLogo}" class="h-full object-contain ${settings.clerkSignature ? '' : 'opacity-10'}" />
                                        </div>
                                        <p class="text-[9px] font-bold uppercase mt-1">Class Teacher Signature</p>
                                    </div>
                                </div>
                                <div class="space-y-4">
                                    <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-1">Principal's Remarks</h4>
                                    <div class="p-4 bg-slate-50 rounded-xl min-h-[100px] border border-slate-100 print:bg-white print:border-black print:p-2">
                                        <p class="text-sm italic text-slate-700">${remark.principal || '____________________________________________________'}</p>
                                    </div>
                                    <div class="flex flex-col items-center pt-4">
                                        <div class="h-12 w-32 flex items-center justify-center border-b border-black">
                                            <img src="${settings.principalSignature || settings.schoolLogo}" class="h-full object-contain ${settings.principalSignature ? '' : 'opacity-10'}" />
                                        </div>
                                        <p class="text-[9px] font-bold uppercase mt-1">Principal Signature & Stamp</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="pt-6 border-t border-slate-100 print:border-black text-center print:pt-4">
                        <p class="text-[10px] text-slate-400 font-medium italic">End of Term Progressive Report - ${settings.schoolName}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
};

render(html`<${App} />`, document.getElementById('app'));