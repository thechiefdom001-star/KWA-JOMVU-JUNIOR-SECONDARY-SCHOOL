import { h } from 'preact';
import { useState, useMemo } from 'preact/hooks';
import htm from 'htm';
import { Storage } from '../lib/storage.js';

const html = htm.bind(h);

export const ResultAnalysis = ({ data, onSelectStudent }) => {
    const [filterTerm, setFilterTerm] = useState('T1');
    const [filterGrade, setFilterGrade] = useState('GRADE 1');
    const [searchName, setSearchName] = useState('');

    const students = (data.students || []).filter(s => s.grade === filterGrade);
    const assessments = data.assessments || [];
    const subjects = Storage.getSubjectsForGrade(filterGrade);
    const examTypes = ['Opener', 'Mid-Term', 'End-Term'];

    const analysisData = useMemo(() => {
        return students.map(student => {
            const studentAssessments = assessments.filter(a => 
                a.studentId === student.id && 
                a.term === filterTerm
            );

            const subjectAnalysis = subjects.map(subject => {
                const scores = {};
                examTypes.forEach(type => {
                    const match = studentAssessments.find(a => a.subject === subject && a.examType === type);
                    scores[type] = match ? Number(match.score) : null;
                });

                const validScores = Object.values(scores).filter(s => s !== null);
                const average = validScores.length > 0 
                    ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
                    : null;

                return { subject, scores, average };
            });

            const allAverages = subjectAnalysis.map(sa => sa.average).filter(avg => avg !== null);
            const overallAverage = allAverages.length > 0
                ? Math.round(allAverages.reduce((a, b) => a + b, 0) / allAverages.length)
                : 0;

            const performance = Storage.getGradeInfo(overallAverage);

            return {
                ...student,
                subjectAnalysis,
                overallAverage,
                performance
            };
        }).filter(s => s.name.toLowerCase().includes(searchName.toLowerCase()));
    }, [students, assessments, filterTerm, filterGrade, searchName]);

    const classSubjectAnalysis = useMemo(() => {
        return subjects.map(subject => {
            let openerSum = 0, midSum = 0, endSum = 0, avgSum = 0;
            let oCount = 0, mCount = 0, eCount = 0, aCount = 0;

            analysisData.forEach(student => {
                const sa = student.subjectAnalysis.find(s => s.subject === subject);
                if (sa) {
                    if (sa.scores['Opener'] !== null) { openerSum += sa.scores['Opener']; oCount++; }
                    if (sa.scores['Mid-Term'] !== null) { midSum += sa.scores['Mid-Term']; mCount++; }
                    if (sa.scores['End-Term'] !== null) { endSum += sa.scores['End-Term']; eCount++; }
                    if (sa.average !== null) { avgSum += sa.average; aCount++; }
                }
            });

            return {
                opener: oCount > 0 ? Math.round(openerSum / oCount) : '-',
                mid: mCount > 0 ? Math.round(midSum / mCount) : '-',
                end: eCount > 0 ? Math.round(endSum / eCount) : '-',
                avg: aCount > 0 ? Math.round(avgSum / aCount) : '-'
            };
        });
    }, [analysisData, subjects]);

    return html`
        <div class="space-y-6">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
                <div>
                    <h2 class="text-2xl font-bold">Termly Result Analysis</h2>
                    <p class="text-slate-500 text-sm">Aggregated performance across triple-exam cycles</p>
                </div>
                <div class="flex gap-2 w-full md:w-auto">
                    <button 
                        onClick=${() => onSelectStudent(analysisData[0]?.id, true)} 
                        class="flex-1 md:flex-none bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-colors"
                        disabled=${analysisData.length === 0}
                    >
                        Print All Report Forms
                    </button>
                    <button onClick=${() => window.print()} class="flex-1 md:flex-none bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm">Print Analysis</button>
                </div>
            </div>

            <!-- Filters -->
            <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 no-print">
                <div class="space-y-1">
                    <label class="text-[10px] font-bold text-slate-400 uppercase ml-1">Academic Term</label>
                    <select 
                        class="w-full p-2.5 bg-slate-50 rounded-xl border-0 focus:ring-2 focus:ring-primary outline-none text-sm font-bold"
                        value=${filterTerm}
                        onChange=${e => setFilterTerm(e.target.value)}
                    >
                        <option value="T1">Term 1</option>
                        <option value="T2">Term 2</option>
                        <option value="T3">Term 3</option>
                    </select>
                </div>
                <div class="space-y-1">
                    <label class="text-[10px] font-bold text-slate-400 uppercase ml-1">Grade Level</label>
                    <select 
                        class="w-full p-2.5 bg-slate-50 rounded-xl border-0 focus:ring-2 focus:ring-primary outline-none text-sm font-bold"
                        value=${filterGrade}
                        onChange=${e => setFilterGrade(e.target.value)}
                    >
                        ${data.settings.grades.map(g => html`<option value=${g}>${g}</option>`)}
                    </select>
                </div>
                <div class="space-y-1">
                    <label class="text-[10px] font-bold text-slate-400 uppercase ml-1">Search Student</label>
                    <input 
                        type="text"
                        placeholder="Name or Admission No..."
                        class="w-full p-2.5 bg-slate-50 rounded-xl border-0 focus:ring-2 focus:ring-primary outline-none text-sm"
                        value=${searchName}
                        onInput=${e => setSearchName(e.target.value)}
                    />
                </div>
            </div>

            <!-- Analysis Print Header -->
            <div class="print-only mb-6 flex flex-col items-center text-center">
                <img src="${data.settings.schoolLogo}" class="w-16 h-16 mb-2 object-contain" />
                <h1 class="text-2xl font-black uppercase">${data.settings.schoolName}</h1>
                <h2 class="text-sm font-bold uppercase text-slate-500 mt-1">Termly Academic Performance Analysis - ${filterTerm} (${filterGrade})</h2>
                <div class="mt-4 grid grid-cols-3 w-full border-y border-slate-200 py-2 text-[10px] font-bold uppercase">
                    <span>Date: ${new Date().toLocaleDateString()}</span>
                    <span>Students: ${analysisData.length}</span>
                    <span>Academic Year: 2024</span>
                </div>
            </div>

            <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto no-scrollbar">
                <table class="w-full text-left border-collapse min-w-[1000px]">
                    <thead class="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th class="px-4 py-4 text-[10px] font-black text-slate-500 uppercase border-r sticky left-0 bg-slate-50 z-10">Student Name</th>
                            ${subjects.map(s => html`
                                <th class="px-2 py-4 text-[9px] font-black text-slate-500 uppercase text-center border-r" colspan="1">
                                    <div class="truncate max-w-[80px] mx-auto">${s}</div>
                                    <div class="flex justify-between mt-1 px-1 font-normal text-[7px] text-slate-400">
                                        <span>Opn</span>
                                        <span>Mid</span>
                                        <span>End</span>
                                        <span class="font-bold text-primary">Avg</span>
                                    </div>
                                </th>
                            `)}
                            <th class="px-4 py-4 text-[10px] font-black text-slate-900 uppercase text-right bg-slate-100">Overall Avg</th>
                            <th class="px-4 py-4 text-[10px] font-black text-slate-900 uppercase text-center bg-slate-100 no-print">Action</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        ${analysisData.map(student => html`
                            <tr key=${student.id} class="hover:bg-slate-50 transition-colors">
                                <td class="px-4 py-3 font-bold text-xs border-r sticky left-0 bg-white z-10">
                                    ${student.name}
                                    <p class="text-[8px] text-slate-400 font-mono">${student.admissionNo}</p>
                                </td>
                                ${student.subjectAnalysis.map(sa => html`
                                    <td class="px-1 py-3 border-r">
                                        <div class="flex justify-between items-center text-[9px] gap-1 px-1">
                                            <span class="text-slate-400 w-5 text-center">${sa.scores['Opener'] ?? '-'}</span>
                                            <span class="text-slate-400 w-5 text-center">${sa.scores['Mid-Term'] ?? '-'}</span>
                                            <span class="text-slate-400 w-5 text-center">${sa.scores['End-Term'] ?? '-'}</span>
                                            <span class="font-black text-primary w-6 text-center bg-blue-50 rounded">${sa.average ?? '-'}</span>
                                        </div>
                                    </td>
                                `)}
                                <td class="px-4 py-3 text-right bg-slate-50/50">
                                    <div class="flex flex-col items-end">
                                        <span class="text-sm font-black text-slate-900">${student.overallAverage}%</span>
                                        <span class="text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${
                                            student.performance.level.startsWith('EE') ? 'bg-green-100 text-green-700' :
                                            student.performance.level.startsWith('ME') ? 'bg-blue-100 text-blue-700' :
                                            student.performance.level.startsWith('AE') ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-red-100 text-red-700'
                                        }">${student.performance.level}</span>
                                    </div>
                                </td>
                                <td class="px-4 py-3 text-center bg-slate-50/50 no-print">
                                    <button 
                                        onClick=${() => onSelectStudent(student.id, false)}
                                        class="bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase hover:border-primary hover:text-primary transition-all"
                                    >
                                        Detailed Report
                                    </button>
                                </td>
                            </tr>
                        `)}
                    </tbody>
                    <tfoot class="bg-slate-50 border-t-2 border-slate-200">
                        <tr class="font-black text-[10px] text-slate-700">
                            <td class="px-4 py-3 border-r sticky left-0 bg-slate-50 z-10 uppercase">Class Mean (Subject Analysis)</td>
                            ${classSubjectAnalysis.map(ca => html`
                                <td class="px-1 py-3 border-r">
                                    <div class="flex justify-between items-center text-[9px] gap-1 px-1">
                                        <span class="text-slate-400 w-5 text-center">${ca.opener}</span>
                                        <span class="text-slate-400 w-5 text-center">${ca.mid}</span>
                                        <span class="text-slate-400 w-5 text-center">${ca.end}</span>
                                        <span class="font-black text-primary w-6 text-center bg-blue-100 rounded">${ca.avg}</span>
                                    </div>
                                </td>
                            `)}
                            <td class="px-4 py-3 text-right bg-blue-600 text-white">
                                ${analysisData.length > 0 
                                    ? Math.round(analysisData.reduce((a, b) => a + b.overallAverage, 0) / analysisData.length)
                                    : 0}%
                            </td>
                            <td class="no-print bg-slate-50"></td>
                        </tr>
                    </tfoot>
                </table>
                ${analysisData.length === 0 && html`
                    <div class="p-20 text-center text-slate-300">
                        <p class="text-4xl mb-4">📉</p>
                        <p class="font-bold">No results found for ${filterGrade} in ${filterTerm}</p>
                        <p class="text-xs">Ensure you have entered marks in the Assessments module.</p>
                    </div>
                `}
            </div>

            <!-- Professional Analysis Summary & Charts -->
            <div class="space-y-6">
                <!-- Row 1: Distribution & Mean -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm print:border-slate-300">
                        <h3 class="font-black text-xs uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                            <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            Performance Distribution
                        </h3>
                        <div class="space-y-5">
                            ${['EE', 'ME', 'AE', 'BE'].map(level => {
                                const count = analysisData.filter(s => s.performance.level.startsWith(level)).length;
                                const pct = analysisData.length > 0 ? (count / analysisData.length) * 100 : 0;
                                const colors = { 
                                    EE: 'bg-green-500 border-green-600', 
                                    ME: 'bg-blue-500 border-blue-600', 
                                    AE: 'bg-yellow-500 border-yellow-600', 
                                    BE: 'bg-red-500 border-red-600' 
                                };
                                const labels = { EE: 'Exceeding', ME: 'Meeting', AE: 'Approaching', BE: 'Below' };
                                return html`
                                    <div class="space-y-1.5">
                                        <div class="flex justify-between text-[10px] font-black uppercase">
                                            <span class="text-slate-500">${labels[level]} Expectations</span>
                                            <span class="text-slate-900">${count} Students (${Math.round(pct)}%)</span>
                                        </div>
                                        <div class="h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100 flex">
                                            <div class=${`h-full ${colors[level]} border-r transition-all duration-1000`} style=${{ width: `${pct}%` }}></div>
                                        </div>
                                    </div>
                                `;
                            })}
                        </div>
                    </div>

                    <div class="bg-blue-600 p-8 rounded-2xl shadow-lg shadow-blue-100 text-white flex flex-col justify-center relative overflow-hidden print:bg-white print:text-slate-900 print:border-2 print:border-blue-600">
                        <div class="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-3xl print:hidden"></div>
                        <h3 class="text-blue-100 print:text-blue-600 font-black text-xs uppercase tracking-widest mb-1 relative z-10">Overall Class Mean</h3>
                        <div class="flex items-baseline gap-2 relative z-10">
                            <p class="text-6xl font-black">${
                                analysisData.length > 0 
                                    ? Math.round(analysisData.reduce((a, b) => a + b.overallAverage, 0) / analysisData.length)
                                    : 0
                            }%</p>
                            <span class="text-blue-200 print:text-slate-400 font-bold uppercase text-xs">Competency Score</span>
                        </div>
                        <p class="text-blue-100 print:text-slate-500 text-[10px] leading-relaxed mt-4 max-w-xs relative z-10 italic">
                            Measured across all subjects and exam cycles for ${filterTerm}. This indicates a class-wide "Meeting Expectations" status.
                        </p>
                    </div>
                </div>

                <!-- Row 2: Subject-wise Performance Chart (Printable) -->
                <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm print:border-slate-300">
                    <h3 class="font-black text-xs uppercase tracking-widest text-slate-400 mb-8 flex items-center gap-2">
                        <span class="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                        Subject-wise Performance Profile
                    </h3>
                    <div class="space-y-4">
                        ${subjects.map((subject, idx) => {
                            const data = classSubjectAnalysis[idx];
                            const avgVal = data.avg === '-' ? 0 : Number(data.avg);
                            const barColor = avgVal >= 75 ? 'bg-green-500' : avgVal >= 50 ? 'bg-blue-500' : avgVal >= 35 ? 'bg-yellow-500' : 'bg-red-500';
                            
                            return html`
                                <div class="grid grid-cols-12 items-center gap-4">
                                    <div class="col-span-3 text-[10px] font-black uppercase text-slate-600 truncate" title=${subject}>${subject}</div>
                                    <div class="col-span-8 flex items-center gap-3">
                                        <div class="flex-1 h-4 bg-slate-50 rounded border border-slate-100 overflow-hidden">
                                            <div class=${`h-full ${barColor} transition-all duration-1000 shadow-inner`} style=${{ width: `${avgVal}%` }}></div>
                                        </div>
                                        <span class="w-10 text-[11px] font-black text-slate-900 text-right">${avgVal}%</span>
                                    </div>
                                    <div class="col-span-1 flex justify-end">
                                        <span class=${`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${
                                            avgVal >= 75 ? 'bg-green-100 text-green-700' : 
                                            avgVal >= 50 ? 'bg-blue-100 text-blue-700' : 
                                            avgVal >= 35 ? 'bg-yellow-100 text-yellow-700' : 
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            ${avgVal >= 75 ? 'EE' : avgVal >= 50 ? 'ME' : avgVal >= 35 ? 'AE' : 'BE'}
                                        </span>
                                    </div>
                                </div>
                            `;
                        })}
                    </div>
                    <div class="mt-8 pt-4 border-t border-slate-100 flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        <span>0%</span>
                        <span>25%</span>
                        <span>50% (ME)</span>
                        <span>75% (EE)</span>
                        <span>100%</span>
                    </div>
                </div>
            </div>
        </div>
    `;
};