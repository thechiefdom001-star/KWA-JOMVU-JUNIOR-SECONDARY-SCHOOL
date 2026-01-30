import { h } from 'preact';
import { useState } from 'preact/hooks';
import htm from 'htm';
import { Storage } from '../lib/storage.js';

const html = htm.bind(h);

export const Marklist = ({ data, setData }) => {
    const [selectedGrade, setSelectedGrade] = useState('GRADE 1');
    const [selectedTerm, setSelectedTerm] = useState('T1');
    const [selectedExamType, setSelectedExamType] = useState('End-Term');

    const subjects = Storage.getSubjectsForGrade(selectedGrade);
    const students = (data?.students || []).filter(s => s.grade === selectedGrade);

    const handleTeacherRemarkChange = (studentId, value) => {
        const existing = (data.remarks || []).find(r => r.studentId === studentId) || { teacher: '', principal: '' };
        const otherRemarks = (data.remarks || []).filter(r => r.studentId !== studentId);
        const updated = { ...existing, studentId, teacher: value };
        setData({ ...data, remarks: [...otherRemarks, updated] });
    };

    return html`
        <div class="space-y-6">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
                <h2 class="text-2xl font-bold">Class Marklist</h2>
                <div class="flex flex-wrap gap-2 w-full md:w-auto">
                    <select 
                        class="flex-1 md:flex-none p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                        value=${selectedGrade}
                        onChange=${(e) => setSelectedGrade(e.target.value)}
                    >
                        ${data.settings.grades.map(g => html`<option value=${g}>${g}</option>`)}
                    </select>
                    <select 
                        class="flex-1 md:flex-none p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                        value=${selectedTerm}
                        onChange=${(e) => setSelectedTerm(e.target.value)}
                    >
                        <option value="T1">Term 1</option>
                        <option value="T2">Term 2</option>
                        <option value="T3">Term 3</option>
                    </select>
                    <select 
                        class="flex-1 md:flex-none p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                        value=${selectedExamType}
                        onChange=${(e) => setSelectedExamType(e.target.value)}
                    >
                        <option value="Opener">Opener</option>
                        <option value="Mid-Term">Mid-Term</option>
                        <option value="End-Term">End-Term</option>
                    </select>
                    <button onClick=${() => window.print()} class="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold">Print</button>
                </div>
            </div>

            <div class="print-only mb-6 flex flex-col items-center text-center">
                <img src="${data.settings.schoolLogo}" class="w-16 h-16 mb-2 object-contain" alt="Logo" />
                <h1 class="text-2xl font-black uppercase">${data.settings.schoolName}</h1>
                <h2 class="text-sm font-bold uppercase text-slate-500 mt-1">Official Class Marklist - ${selectedGrade}</h2>
                <p class="text-[10px] font-bold text-slate-400 uppercase mt-1">${selectedTerm} | ${selectedExamType} EXAM</p>
            </div>

            <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto no-scrollbar">
                <table class="w-full text-left border-collapse min-w-[1200px]">
                    <thead class="bg-slate-50 border-b border-slate-200">
                        <tr class="text-center print:bg-slate-100">
                            <th class="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase border-r text-left">Details</th>
                            ${subjects.map(() => html`
                                <th class="px-1 py-1 text-[8px] font-bold text-slate-400 border-r" colspan="2">Score | Level</th>
                            `)}
                            <th class="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Comments</th>
                        </tr>
                        <tr>
                            <th class="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase border-r">Student Name</th>
                            ${subjects.map(s => html`
                                <th class="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-center border-r" colspan="2">${s}</th>
                            `)}
                            <th class="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-center">Remarks</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        ${students.map(student => {
                            const remark = (data.remarks || []).find(r => r.studentId === student.id) || { teacher: '', principal: '' };
                            return html`
                                <tr key=${student.id} class="hover:bg-slate-50">
                                    <td class="px-4 py-3 font-bold text-sm border-r whitespace-nowrap">${student.name}</td>
                                    ${subjects.map(subject => {
                                        const assessment = data.assessments.find(a => 
                                            a.studentId === student.id && 
                                            a.subject === subject && 
                                            a.term === selectedTerm && 
                                            a.examType === selectedExamType
                                        );
                                        return html`
                                            <td class="px-2 py-3 text-[10px] text-center font-bold text-slate-600 border-l">
                                                ${assessment?.score || '-'}
                                            </td>
                                            <td class="px-2 py-3 text-[10px] text-center border-r">
                                                <span class=${`font-bold ${
                                                    (assessment?.level || '').startsWith('EE') ? 'text-green-600' :
                                                    (assessment?.level || '').startsWith('ME') ? 'text-blue-600' :
                                                    (assessment?.level || '').startsWith('AE') ? 'text-orange-500' :
                                                    (assessment?.level || '').startsWith('BE') ? 'text-red-500' :
                                                    'text-slate-300'
                                                }`}>
                                                    ${assessment?.level || '-'}
                                                </span>
                                            </td>
                                        `;
                                    })}
                                    <td class="px-4 py-3 text-[10px] border-l text-slate-500 align-top">
                                        <div class="flex flex-col gap-1">
                                            <textarea
                                                class="w-full text-[10px] border border-slate-200 rounded px-1 py-1 outline-none focus:ring-1 focus:ring-blue-500 no-print"
                                                rows="2"
                                                placeholder="Teacher comment..."
                                                value=${remark.teacher}
                                                onInput=${(e) => handleTeacherRemarkChange(student.id, e.target.value)}
                                            ></textarea>
                                            <span class="hidden print:block italic">
                                                ${remark.teacher || '_______________________________'}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        })}
                    </tbody>
                    <tfoot class="bg-slate-50 border-t-2 border-slate-200">
                        <tr class="font-bold text-slate-900">
                            <td class="px-4 py-3 text-[10px] uppercase border-r">Column Totals</td>
                            ${subjects.map(subject => {
                                const subjectScores = students.map(s => {
                                    const a = data.assessments.find(as => as.studentId === s.id && as.subject === subject && as.term === selectedTerm && as.examType === selectedExamType);
                                    return a ? Number(a.score) : 0;
                                });
                                const total = subjectScores.reduce((a, b) => a + b, 0);
                                return html`
                                    <td class="px-2 py-3 text-[10px] text-center border-l bg-blue-50/30" colspan="2">
                                        ${total || '-'}
                                    </td>
                                `;
                            })}
                            <td class="bg-slate-100"></td>
                        </tr>
                        <tr class="font-black text-blue-600">
                            <td class="px-4 py-3 text-[10px] uppercase border-r">Mean Average</td>
                            ${subjects.map(subject => {
                                const validScores = students.map(s => {
                                    const a = data.assessments.find(as => as.studentId === s.id && as.subject === subject && as.term === selectedTerm && as.examType === selectedExamType);
                                    return a ? Number(a.score) : null;
                                }).filter(s => s !== null);
                                const avg = validScores.length > 0 ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) : 0;
                                return html`
                                    <td class="px-2 py-3 text-[10px] text-center border-l bg-blue-50/50" colspan="2">
                                        ${avg ? avg + '%' : '-'}
                                    </td>
                                `;
                            })}
                            <td class="bg-slate-100"></td>
                        </tr>
                    </tfoot>
                </table>
                ${students.length === 0 && html`<div class="p-12 text-center text-slate-400">No students registered in this grade.</div>`}
            </div>

            <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm no-print">
                <h3 class="font-bold mb-4">Class Performance Analysis (Graphical)</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    ${subjects.map(subject => {
                        const subjectAssessments = data.assessments.filter(a => a.subject === subject && students.some(s => s.id === a.studentId));
                        const meCount = subjectAssessments.filter(a => a.level === 'EE' || a.level === 'ME').length;
                        const pct = students.length > 0 ? (meCount / students.length) * 100 : 0;
                        return html`
                            <div class="text-center p-4 bg-slate-50 rounded-xl">
                                <div class="relative w-16 h-16 mx-auto mb-2">
                                    <svg class="w-full h-full" viewBox="0 0 36 36">
                                        <path class="text-slate-200" stroke-width="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                        <path class="text-blue-600" stroke-dasharray="${pct}, 100" stroke-width="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                    </svg>
                                    <span class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold">${Math.round(pct)}%</span>
                                </div>
                                <p class="text-[10px] font-bold text-slate-500 uppercase">${subject}</p>
                            </div>
                        `;
                    })}
                </div>
            </div>
        </div>
    `;
};