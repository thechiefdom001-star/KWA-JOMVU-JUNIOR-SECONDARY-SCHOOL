export const Storage = {
    key: 'edutrack_cbc_data',
    
    defaultData: {
        students: [
            { id: '1', name: 'John Doe', grade: 'GRADE 1', admissionNo: '2024/001', assessmentNo: 'ASN-001', upiNo: 'UPI-789X', stream: 'North', parentContact: '0711222333', selectedFees: ['t1', 't2', 't3', 'bookFund', 'caution', 'studentCard'] },
            { id: '2', name: 'Jane Smith', grade: 'GRADE 2', admissionNo: '2024/002', assessmentNo: 'ASN-002', upiNo: 'UPI-456Y', stream: 'South', parentContact: '0722333444', selectedFees: ['t1', 't2', 't3', 'breakfast', 'lunch'] }
        ],
        assessments: [
            { id: 'a1', studentId: '1', subject: 'Mathematics', level: 'EE', score: 85, date: '2024-03-20' },
            { id: 'a2', studentId: '1', subject: 'English Language', level: 'ME', score: 72, date: '2024-03-20' }
        ],
        payments: [
            { id: 'p1', studentId: '1', amount: 20000, date: '2024-03-01', receiptNo: 'RCP-001' }
        ],
        teachers: [
            { id: 't1', name: 'Peter Mwangi', contact: '0712345678', subjects: 'Mathematics, Science', grades: 'GRADE 1, GRADE 2', employeeNo: 'T-001', nssfNo: 'NSSF-123', shifNo: 'SHIF-456', taxNo: 'A001234567X' }
        ],
        staff: [
            { id: 's1', name: 'Alice Wambui', role: 'Bursar', contact: '0722000111', employeeNo: 'S-001', nssfNo: 'NSSF-789', shifNo: 'SHIF-012', taxNo: 'A009876543Z' },
            { id: 's2', name: 'John Kamau', role: 'Driver', contact: '0733000222', employeeNo: 'S-002', nssfNo: 'NSSF-345', shifNo: 'SHIF-678', taxNo: 'A005556667Y' }
        ],
        remarks: [],
        transport: {
            routes: [
                { id: 'r1', name: 'Route A - City Center', fee: 5000 },
                { id: 'r2', name: 'Route B - Westlands', fee: 6500 }
            ],
            assignments: []
        },
        library: {
            books: [
                { id: 'b1', title: 'The River and the Source', author: 'Margaret Ogola', isbn: '978-9966-882-05-9', status: 'Available', quantity: 10 },
                { id: 'b2', title: 'Kidagaa Kimemwozea', author: 'Ken Walibora', isbn: '978-9966-10-142-2', status: 'Available', quantity: 5 }
            ],
            transactions: []
        },
        payroll: [],
        settings: {
            schoolName: 'Evergreen Academy',
            schoolAddress: '123 Academic Drive, Nairobi, Kenya',
            schoolLogo: 'school_logo.png',
            principalSignature: '',
            clerkSignature: '',
            academicYear: '2024/2025',
            currency: 'KES.',
            theme: 'light',
            primaryColor: '#2563eb',
            secondaryColor: '#64748b',
            grades: ['PP1', 'PP2', 'GRADE 1', 'GRADE 2', 'GRADE 3', 'GRADE 4', 'GRADE 5', 'GRADE 6', 'GRADE 7', 'GRADE 8', 'GRADE 9', 'GRADE 10', 'GRADE 11', 'GRADE 12'],
            feeStructures: [
                { grade: 'PP1', t1: 15000, t2: 12000, t3: 12000, admission: 2000, diary: 500, development: 5000, boarding: 0, breakfast: 3000, lunch: 5000, trip: 2000, bookFund: 1000, caution: 2000, uniform: 4500, studentCard: 500, remedial: 0, assessmentFee: 1000, projectFee: 500 },
                { grade: 'PP2', t1: 15000, t2: 12000, t3: 12000, admission: 2000, diary: 500, development: 5000, boarding: 0, breakfast: 3000, lunch: 5000, trip: 2000, bookFund: 1000, caution: 2000, uniform: 4500, studentCard: 500, remedial: 0, assessmentFee: 1000, projectFee: 500 },
                { grade: 'GRADE 1', t1: 25000, t2: 20000, t3: 20000, admission: 3000, diary: 500, development: 5000, boarding: 15000, breakfast: 3500, lunch: 6000, trip: 2500, bookFund: 1500, caution: 2000, uniform: 5000, studentCard: 500, remedial: 2000, assessmentFee: 1500, projectFee: 1000 },
                { grade: 'GRADE 2', t1: 25000, t2: 20000, t3: 20000, admission: 3000, diary: 500, development: 5000, boarding: 15000, breakfast: 3500, lunch: 6000, trip: 2500, bookFund: 1500, caution: 2000, uniform: 5000, studentCard: 500, remedial: 2000, assessmentFee: 1500, projectFee: 1000 },
                { grade: 'GRADE 3', t1: 25000, t2: 20000, t3: 20000, admission: 3000, diary: 500, development: 5000, boarding: 15000, breakfast: 3500, lunch: 6000, trip: 2500, bookFund: 1500, caution: 2000, uniform: 5000, studentCard: 500, remedial: 2000, assessmentFee: 1500, projectFee: 1000 },
                { grade: 'GRADE 4', t1: 30000, t2: 25000, t3: 25000, admission: 3000, diary: 500, development: 5000, boarding: 20000, breakfast: 4000, lunch: 7000, trip: 3000, bookFund: 2000, caution: 2000, uniform: 5500, studentCard: 500, remedial: 2500, assessmentFee: 2000, projectFee: 1500 },
                { grade: 'GRADE 5', t1: 30000, t2: 25000, t3: 25000, admission: 3000, diary: 500, development: 5000, boarding: 20000, breakfast: 4000, lunch: 7000, trip: 3000, bookFund: 2000, caution: 2000, uniform: 5500, studentCard: 500, remedial: 2500, assessmentFee: 2000, projectFee: 1500 },
                { grade: 'GRADE 6', t1: 30000, t2: 25000, t3: 25000, admission: 3000, diary: 500, development: 5000, boarding: 20000, breakfast: 4000, lunch: 7000, trip: 3000, bookFund: 2000, caution: 2000, uniform: 5500, studentCard: 500, remedial: 2500, assessmentFee: 2000, projectFee: 1500 },
                { grade: 'GRADE 7', t1: 35000, t2: 30000, t3: 30000, admission: 5000, diary: 500, development: 7500, boarding: 25000, breakfast: 4500, lunch: 8000, trip: 4000, bookFund: 2500, caution: 3000, uniform: 6000, studentCard: 1000, remedial: 3000, assessmentFee: 3000, projectFee: 2000 },
                { grade: 'GRADE 8', t1: 35000, t2: 30000, t3: 30000, admission: 5000, diary: 500, development: 7500, boarding: 25000, breakfast: 4500, lunch: 8000, trip: 4000, bookFund: 2500, caution: 3000, uniform: 6000, studentCard: 1000, remedial: 3000, assessmentFee: 3000, projectFee: 2000 },
                { grade: 'GRADE 9', t1: 35000, t2: 30000, t3: 30000, admission: 5000, diary: 500, development: 7500, boarding: 25000, breakfast: 4500, lunch: 8000, trip: 4000, bookFund: 2500, caution: 3000, uniform: 6000, studentCard: 1000, remedial: 3000, assessmentFee: 3000, projectFee: 2000 },
                { grade: 'GRADE 10', t1: 45000, t2: 40000, t3: 40000, admission: 10000, diary: 1000, development: 10000, boarding: 30000, breakfast: 5000, lunch: 10000, trip: 5000, bookFund: 5000, caution: 5000, uniform: 8000, studentCard: 1000, remedial: 5000, assessmentFee: 5000, projectFee: 3000 },
                { grade: 'GRADE 11', t1: 45000, t2: 40000, t3: 40000, admission: 10000, diary: 1000, development: 10000, boarding: 30000, breakfast: 5000, lunch: 10000, trip: 5000, bookFund: 5000, caution: 5000, uniform: 8000, studentCard: 1000, remedial: 5000, assessmentFee: 5000, projectFee: 3000 },
                { grade: 'GRADE 12', t1: 45000, t2: 40000, t3: 40000, admission: 10000, diary: 1000, development: 10000, boarding: 30000, breakfast: 5000, lunch: 10000, trip: 5000, bookFund: 5000, caution: 5000, uniform: 8000, studentCard: 1000, remedial: 5000, assessmentFee: 5000, projectFee: 3000 }
            ]
        }
    },

    load() {
        const stored = localStorage.getItem(this.key);
        if (!stored) return this.defaultData;
        try {
            const parsed = JSON.parse(stored);
            if (!parsed || typeof parsed !== 'object') return this.defaultData;
            
            const settings = parsed.settings || {};
            
            // Ensure Senior School grades are present
            const allGrades = [...new Set([...this.defaultData.settings.grades, ...(settings.grades || [])])];
            
            // Ensure fee structures for new grades exist
            const existingGrades = (settings.feeStructures || []).map(f => f.grade);
            const missingStructures = this.defaultData.settings.feeStructures.filter(f => !existingGrades.includes(f.grade));
            const allFeeStructures = [...(settings.feeStructures || []), ...missingStructures];

            // Deep merge essential structures to avoid "undefined" errors on legacy data
            return {
                ...this.defaultData,
                ...parsed,
                settings: { 
                    ...this.defaultData.settings, 
                    ...settings,
                    grades: allGrades,
                    feeStructures: allFeeStructures,
                    schoolAddress: settings.schoolAddress || this.defaultData.settings.schoolAddress 
                },
                transport: { ...this.defaultData.transport, ...(parsed.transport || {}) },
                library: { ...this.defaultData.library, ...(parsed.library || {}) }
            };
        } catch (e) {
            console.error("Storage load error:", e);
            return this.defaultData;
        }
    },

    save(data) {
        localStorage.setItem(this.key, JSON.stringify(data));
    },

    async pushToCloud(data) {
        try {
            const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
            const file = new File([blob], `edutrack_sync_${Date.now()}.json`, { type: 'application/json' });
            const url = await window.websim.upload(file);
            const result = await window.websim.postComment({
                content: `[DATA_SYNC] ${url}`
            });
            return result;
        } catch (e) {
            console.error("Cloud push failed:", e);
            return { error: e.message };
        }
    },

    async pullFromCloud(projectId) {
        try {
            const response = await fetch(`/api/v1/projects/${projectId}/comments?first=50`);
            const result = await response.json();
            // Find the most recent sync comment
            const syncComment = result.comments.data.find(c => c.comment.raw_content.includes('[DATA_SYNC]'));
            if (syncComment) {
                const match = syncComment.comment.raw_content.match(/\[DATA_SYNC\]\s+(https?:\/\/[^\s\)]+)/);
                if (match && match[1]) {
                    const dataResponse = await fetch(match[1]);
                    return await dataResponse.json();
                }
            }
        } catch (e) {
            console.error("Cloud pull failed:", e);
        }
        return null;
    },

    getGradeInfo(score) {
        const s = Number(score);
        if (s >= 90) return { level: 'EE1', points: 8, label: 'Exceeding Expectations', desc: 'Exceptional' };
        if (s >= 75) return { level: 'EE2', points: 7, label: 'Exceeding Expectations', desc: 'Very Good' };
        if (s >= 58) return { level: 'ME1', points: 6, label: 'Meeting Expectations', desc: 'Good' };
        if (s >= 41) return { level: 'ME2', points: 5, label: 'Meeting Expectations', desc: 'Fair' };
        if (s >= 31) return { level: 'AE1', points: 4, label: 'Approaching Expectations', desc: 'Needs Improvement' };
        if (s >= 21) return { level: 'AE2', points: 3, label: 'Approaching Expectations', desc: 'Below Average' };
        if (s >= 11) return { level: 'BE1', points: 2, label: 'Below Expectations', desc: 'Well Below Average' };
        if (s > 0) return { level: 'BE2', points: 1, label: 'Below Expectations', desc: 'Minimal' };
        return { level: '-', points: 0, label: 'Not Assessed', desc: 'No Data' };
    },

    calculateKenyanPayroll(basicSalary, extraEarnings = {}, extraDeductions = {}) {
        const basic = Number(basicSalary) || 0;
        const earningsObj = extraEarnings || {};
        const deductionsObj = extraDeductions || {};
        
        const totalExtraEarnings = Object.values(earningsObj).reduce((a, b) => a + (Number(b) || 0), 0);
        
        // Gross for Tax Purpose (Basic + Allowances)
        const gross = basic + totalExtraEarnings;
        
        // 1. NSSF (New Rates 2024 Tier I & II - approx 6% capped at 2,160)
        const nssf = Math.min(gross * 0.06, 2160);
        
        // 2. Taxable Income
        const taxableIncome = gross - nssf;
        
        // 3. PAYE Calculation
        let tax = 0;
        if (gross > 24000) {
            let remaining = taxableIncome;
            
            // Band 1: 0 - 24,000 @ 10%
            const b1 = Math.min(remaining, 24000);
            tax += b1 * 0.10;
            remaining -= b1;
            
            // Band 2: Next 8,333 @ 25%
            if (remaining > 0) {
                const b2 = Math.min(remaining, 8333);
                tax += b2 * 0.25;
                remaining -= b2;
            }
            
            // Band 3: Next 467,667 @ 30%
            if (remaining > 0) {
                const b3 = Math.min(remaining, 467667);
                tax += b3 * 0.30;
                remaining -= b3;
            }

            // Band 4: Next 300,000 @ 32.5%
            if (remaining > 0) {
                const b4 = Math.min(remaining, 300000);
                tax += b4 * 0.325;
                remaining -= b4;
            }

            // Band 5: Over 800,000 @ 35%
            if (remaining > 0) {
                tax += remaining * 0.35;
            }
            
            // Apply Personal Relief
            tax = Math.max(0, tax - 2400);
        }

        // 4. SHIF (2.75% of Gross)
        const shif = gross * 0.0275;

        // 5. Housing Levy (AHL - 1.5% of Gross)
        const ahl = gross * 0.015;

        // 6. NITA (Employer pays, but often recorded - 50 KES)
        const nita = 50;

        const totalStatutory = nssf + tax + shif + ahl;
        const totalExtraDeductions = Object.values(deductionsObj).reduce((a, b) => a + (Number(b) || 0), 0);
        
        const netPay = gross - totalStatutory - totalExtraDeductions;

        return {
            basic,
            extraEarnings: earningsObj,
            extraDeductions: deductionsObj,
            gross,
            nssf,
            paye: tax,
            shif,
            ahl,
            nita,
            totalStatutory,
            totalExtraDeductions,
            totalDeductions: totalStatutory + totalExtraDeductions,
            netPay
        };
    },

    numberToWords(num) {
        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

        const convert_thousands = (n) => {
            if (n >= 1000) return convert_hundreds(Math.floor(n / 1000)) + " Thousand " + convert_hundreds(n % 1000);
            else return convert_hundreds(n);
        };

        const convert_hundreds = (n) => {
            if (n > 99) return ones[Math.floor(n / 100)] + " Hundred " + convert_tens(n % 100);
            else return convert_tens(n);
        };

        const convert_tens = (n) => {
            if (n < 10) return ones[n];
            else if (n >= 10 && n < 20) return teens[n - 10];
            else return tens[Math.floor(n / 10)] + " " + ones[n % 10];
        };

        if (num === 0) return "Zero";
        
        let wholeNumber = Math.floor(num);
        let decimal = Math.round((num - wholeNumber) * 100);
        
        let result = "";
        if (wholeNumber >= 1000000) {
            result += convert_thousands(Math.floor(wholeNumber / 1000000)) + " Million " + convert_thousands(wholeNumber % 1000000);
        } else {
            result += convert_thousands(wholeNumber);
        }

        result = result.trim() + " Shillings";
        if (decimal > 0) {
            result += " and " + convert_tens(decimal) + " Cents";
        } else {
            result += " Only";
        }
        
        return result;
    },

    getStudentFinancials(student, payments, settings) {
        const structure = settings.feeStructures?.find(f => f.grade === student.grade);
        const selectedKeys = student.selectedFees || ['t1', 't2', 't3'];
        
        let baseDue = structure ? selectedKeys.reduce((sum, key) => sum + (structure[key] || 0), 0) : 0;
        const previousArrears = Number(student.previousArrears) || 0;

        // Apply category discounts
        if (student.category === 'Sponsored') {
            baseDue = 0;
        } else if (student.category === 'Staff') {
            baseDue = baseDue * 0.5;
        }

        // Total Due is cumulative: Arrears B/F + Current Term/Year Fees
        const totalDue = previousArrears + baseDue;
        
        // Sum all payments for this student
        // We filter by student ID. Payments can be tagged with the grade they were made in.
        const totalPaid = (payments || [])
            .filter(p => p.studentId === student.id)
            .reduce((sum, p) => sum + Number(p.amount), 0);

        return {
            totalDue, // Includes Balance Brought Forward
            totalPaid,
            balance: totalDue - totalPaid,
            baseDue,
            previousArrears
        };
    },

    mergeData(existingData, incomingData, type) {
        if (!incomingData) return existingData;
        
        switch (type) {
            case 'students': {
                const existing = [...(existingData.students || [])];
                const incoming = incomingData.students || [];
                incoming.forEach(newS => {
                    const idx = existing.findIndex(s => s.admissionNo === newS.admissionNo);
                    if (idx > -1) existing[idx] = { ...existing[idx], ...newS };
                    else existing.push(newS);
                });
                return { ...existingData, students: existing };
            }
            case 'assessments': {
                const existing = [...(existingData.assessments || [])];
                const incoming = incomingData.assessments || [];
                incoming.forEach(newA => {
                    const idx = existing.findIndex(a => 
                        a.studentId === newA.studentId && 
                        a.subject === newA.subject && 
                        a.term === newA.term && 
                        a.examType === newA.examType
                    );
                    if (idx > -1) existing[idx] = { ...existing[idx], ...newA };
                    else existing.push(newA);
                });
                return { ...existingData, assessments: existing };
            }
            case 'remarks': {
                const existing = [...(existingData.remarks || [])];
                const incoming = incomingData.remarks || [];
                incoming.forEach(newR => {
                    const idx = existing.findIndex(r => r.studentId === newR.studentId);
                    if (idx > -1) existing[idx] = { ...existing[idx], ...newR };
                    else existing.push(newR);
                });
                return { ...existingData, remarks: existing };
            }
            case 'senior-school': {
                const existing = [...(existingData.students || [])];
                const incoming = incomingData.students || [];
                incoming.forEach(newS => {
                    const idx = existing.findIndex(s => s.admissionNo === newS.admissionNo);
                    if (idx > -1) {
                        existing[idx] = { 
                            ...existing[idx], 
                            seniorPathway: newS.seniorPathway, 
                            seniorElectives: newS.seniorElectives 
                        };
                    }
                });
                return { ...existingData, students: existing };
            }
            case 'all': {
                return {
                    ...existingData,
                    ...incomingData,
                    settings: { ...existingData.settings, ...(incomingData.settings || {}) },
                    students: incomingData.students || existingData.students,
                    assessments: incomingData.assessments || existingData.assessments,
                    payments: incomingData.payments || existingData.payments,
                    teachers: incomingData.teachers || existingData.teachers,
                    staff: incomingData.staff || existingData.staff,
                    payroll: incomingData.payroll || existingData.payroll
                };
            }
            default:
                return { ...existingData, ...incomingData };
        }
    },

    getSubjectsForGrade(grade, student = null) {
        const primaryGrades = ['PP1', 'PP2', 'GRADE 1', 'GRADE 2', 'GRADE 3', 'GRADE 4', 'GRADE 5', 'GRADE 6'];
        const juniorGrades = ['GRADE 7', 'GRADE 8', 'GRADE 9'];
        const seniorGrades = ['GRADE 10', 'GRADE 11', 'GRADE 12'];
        
        if (primaryGrades.includes(grade)) {
            return ['English', 'Kiswahili/KSL', 'Mathematics', 'Science', 'Social Studies', 'Religious Ed', 'Creative Arts'];
        } else if (juniorGrades.includes(grade)) {
            return ['Integrated Science', 'Health Ed', 'Pre-Technical/Career Ed', 'Business Studies', 'Agriculture', 'Life Skills', 'Sports'];
        } else if (seniorGrades.includes(grade)) {
            // Core subjects
            const core = ['English', 'Kiswahili', 'Mathematics', 'CSL'];
            if (student && student.seniorElectives) {
                return [...core, ...student.seniorElectives];
            }
            
            // For general list (like Assessment dropdown), return core + common electives
            return [...core, 
                'Biology', 'Chemistry', 'Physics', 'Agriculture', 'Computer Studies', 
                'History and Citizenship', 'Geography', 'CRE', 'IRE', 'Accounting', 
                'Economics', 'Fine Arts', 'Music and Dance', 'Sports Science'
            ];
        }
        return ['Mathematics', 'English', 'Science'];
    }
};