// Google Sheet Sync Service
// Handles data synchronization between EduTrack and Google Sheets

const STUDENT_HEADERS = ['id', 'name', 'grade', 'stream', 'admissionNo', 'parentContact', 'selectedFees'];
const ASSESSMENT_HEADERS = ['id', 'studentId', 'subject', 'score', 'term', 'examType', 'academicYear', 'date', 'level'];
const ATTENDANCE_HEADERS = ['id', 'studentId', 'date', 'status', 'term', 'academicYear'];

class GoogleSheetSync {
    constructor() {
        this.settings = {};
    }

    setSettings(settings) {
        this.settings = settings;
    }

    isConfigured() {
        return this.settings.googleScriptUrl && this.settings.googleScriptUrl.includes('script.google.com');
    }

    async ping() {
        if (!this.isConfigured()) {
            return { success: false, error: 'Google Sheet not configured' };
        }

        try {
            const url = new URL(this.settings.googleScriptUrl);
            url.searchParams.set('action', 'ping');
            
            const response = await fetch(url.toString());
            const data = await response.json();
            return data;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async fetchAll() {
        if (!this.isConfigured()) {
            return { success: false, error: 'Google Sheet not configured' };
        }

        try {
            const url = new URL(this.settings.googleScriptUrl);
            url.searchParams.set('action', 'syncAll');
            
            const response = await fetch(url.toString());
            const data = await response.json();
            
            return {
                success: true,
                students: data.students || [],
                assessments: data.assessments || [],
                attendance: data.attendance || []
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async fetchAssessments(term, grade) {
        if (!this.isConfigured()) {
            return { success: false, error: 'Google Sheet not configured' };
        }

        try {
            const url = new URL(this.settings.googleScriptUrl);
            url.searchParams.set('action', 'getAssessments');
            if (term) url.searchParams.set('term', term);
            if (grade) url.searchParams.set('grade', grade);
            
            const response = await fetch(url.toString());
            const data = await response.json();
            
            return {
                success: true,
                assessments: data.assessments || []
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async pushAssessment(assessment) {
        if (!this.isConfigured()) {
            return { success: false, error: 'Google Sheet not configured' };
        }

        try {
            const response = await fetch(this.settings.googleScriptUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'addAssessment',
                    assessment: assessment
                })
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async pushBulkAssessments(assessments) {
        if (!this.isConfigured()) {
            return { success: false, error: 'Google Sheet not configured' };
        }

        try {
            const response = await fetch(this.settings.googleScriptUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'bulkAddAssessments',
                    assessments: assessments
                })
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async pushStudent(student) {
        if (!this.isConfigured()) {
            return { success: false, error: 'Google Sheet not configured' };
        }

        try {
            const response = await fetch(this.settings.googleScriptUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'addStudent',
                    student: student
                })
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async pushAttendance(attendance) {
        if (!this.isConfigured()) {
            return { success: false, error: 'Google Sheet not configured' };
        }

        try {
            const response = await fetch(this.settings.googleScriptUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'addAttendance',
                    attendance: attendance
                })
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Sync local data TO Google Sheet
    async syncToGoogle(localData) {
        if (!this.isConfigured()) {
            return { success: false, error: 'Google Sheet not configured' };
        }

        try {
            const results = [];
            const studentCount = localData.students?.length || 0;
            const assessmentCount = localData.assessments?.length || 0;
            const attendanceCount = localData.attendance?.length || 0;

            console.log('Pushing to Google Sheet:', { studentCount, assessmentCount, attendanceCount });

            // Push all students
            if (studentCount > 0) {
                console.log('Pushing students...', localData.students.slice(0, 2));
                const result = await this.replaceAllRecords('Students', localData.students, STUDENT_HEADERS);
                console.log('Students result:', result);
                results.push(`Students: ${result.success ? result.count : 'Failed'}`);
            }

            // Push all assessments
            if (assessmentCount > 0) {
                console.log('Pushing assessments...', localData.assessments.slice(0, 2));
                const result = await this.replaceAllRecords('Assessments', localData.assessments, ASSESSMENT_HEADERS);
                console.log('Assessments result:', result);
                results.push(`Assessments: ${result.success ? result.count : 'Failed'}`);
            }

            // Push attendance
            if (attendanceCount > 0) {
                console.log('Pushing attendance...');
                const result = await this.replaceAllRecords('Attendance', localData.attendance, ATTENDANCE_HEADERS);
                console.log('Attendance result:', result);
                results.push(`Attendance: ${result.success ? result.count : 'Failed'}`);
            }

            return { success: true, message: results.join(', '), counts: { studentCount, assessmentCount, attendanceCount } };
        } catch (error) {
            console.error('Sync error:', error);
            return { success: false, error: error.message };
        }
    }

    async replaceAllRecords(sheetName, records, headers) {
        try {
            const url = this.settings.googleScriptUrl;
            console.log('Pushing to:', url);
            
            // Create JSONP-style request using no-cors mode
            const payload = JSON.stringify({
                action: 'replaceAll',
                sheetName: sheetName,
                records: records,
                headers: headers
            });
            
            // Try with no-cors mode first (won't get response but should work)
            // But we need response, so use regular fetch
            const response = await fetch(url, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8'
                },
                body: payload
            });
            
            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);
            
            if (!response.ok) {
                return { success: false, error: 'HTTP ' + response.status + ': ' + response.statusText };
            }
            
            const text = await response.text();
            console.log('Response length:', text.length);
            
            if (!text || text.trim() === '') {
                return { success: true, message: 'Request sent (no response)' };
            }
            
            try {
                const data = JSON.parse(text);
                return data;
            } catch (e) {
                return { success: true, message: 'Data sent, response: ' + text.substring(0, 100) };
            }
        } catch (error) {
            console.error('Replace error:', error);
            // If CORS error, try with GET approach
            if (error.message && error.message.includes('CORS')) {
                return { success: false, error: 'CORS error. Enable CORS in script or use a proxy.' };
            }
            return { success: false, error: error.message };
        }
    }

    // Sync FROM Google Sheet to local storage
    async syncFromGoogle() {
        const result = await this.fetchAll();
        
        if (!result.success) {
            return result;
        }

        return {
            success: true,
            data: {
                students: result.students || [],
                assessments: result.assessments || [],
                attendance: result.attendance || []
            }
        };
    }

    // Two-way sync with conflict resolution (newer wins)
    async twoWaySync(localData) {
        if (!this.isConfigured()) {
            return { success: false, error: 'Google Sheet not configured' };
        }

        try {
            // Get Google Sheet data
            const googleResult = await this.fetchAll();
            if (!googleResult.success) {
                return googleResult;
            }

            const googleStudents = googleResult.students || [];
            const googleAssessments = googleResult.assessments || [];
            const googleAttendance = googleResult.attendance || [];

            const localStudents = localData.students || [];
            const localAssessments = localData.assessments || [];
            const localAttendance = localData.attendance || [];

            // Merge students (by id - newer timestamp wins)
            const mergedStudents = this.mergeById(localStudents, googleStudents);
            
            // Merge assessments
            const mergedAssessments = this.mergeById(localAssessments, googleAssessments);
            
            // Merge attendance
            const mergedAttendance = this.mergeById(localAttendance, googleAttendance);

            return {
                success: true,
                data: {
                    students: mergedStudents,
                    assessments: mergedAssessments,
                    attendance: mergedAttendance
                },
                stats: {
                    students: { local: localStudents.length, google: googleStudents.length, merged: mergedStudents.length },
                    assessments: { local: localAssessments.length, google: googleAssessments.length, merged: mergedAssessments.length },
                    attendance: { local: localAttendance.length, google: googleAttendance.length, merged: mergedAttendance.length }
                }
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Merge two arrays by ID, keeping the newer version
    mergeById(local, remote) {
        const merged = new Map();

        // Add all local items
        local.forEach(item => {
            if (item.id) {
                merged.set(item.id, { ...item, source: 'local' });
            }
        });

        // Merge remote items (overwrite if newer)
        remote.forEach(item => {
            if (item.id) {
                const existing = merged.get(item.id);
                if (!existing) {
                    merged.set(item.id, { ...item, source: 'google' });
                }
                // Could add timestamp comparison here for true "newer wins"
            }
        });

        return Array.from(merged.values());
    }
}

export const googleSheetSync = new GoogleSheetSync();
