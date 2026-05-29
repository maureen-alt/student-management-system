// Check if logged in
document.addEventListener('DOMContentLoaded', function() {
    const studentId = localStorage.getItem('studentId');
    if (!studentId) {
        window.location.href = 'login.html';
        return;
    }
    
    // Set username
    const userName = localStorage.getItem('studentName') || 'Student';
    const userNameSpan = document.getElementById('userName');
    if (userNameSpan) {
        userNameSpan.innerHTML = `👋 ${userName}`;
    }
    
    // Load dashboard data
    loadDashboard();
});

async function loadDashboard() {
    const studentId = localStorage.getItem('studentId');
    if (!studentId) return;
    
    try {
        const response = await fetch(`php/api/get-student-data.php?studentId=${studentId}`);
        const data = await response.json();
        
        if (data.success) {
            renderStats(data.stats);
            renderProfile(data.profile);
            renderSubjects(data.subjects);
            renderResults(data.results);
            renderFees(data.fees);
        } else {
            alert('Failed to load dashboard data');
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
        alert('Error loading data. Please check server connection.');
    }
}

function renderStats(stats) {
    const statsGrid = document.getElementById('statsGrid');
    if (!statsGrid) return;
    
    statsGrid.innerHTML = `
        <div class="stat-card">
            <div class="stat-title">📚 Total Subjects</div>
            <div class="stat-value">${stats.totalSubjects || 0}</div>
        </div>
        <div class="stat-card">
            <div class="stat-title">📊 Average Score</div>
            <div class="stat-value">${stats.averageScore || 0}%</div>
        </div>
        <div class="stat-card">
            <div class="stat-title">📈 Attendance Rate</div>
            <div class="stat-value">${stats.attendance || 0}%</div>
        </div>
        <div class="stat-card">
            <div class="stat-title">💰 Fees Status</div>
            <div class="stat-value">${stats.feesStatus || 'Pending'}</div>
        </div>
    `;
}

function renderProfile(profile) {
    const dynamicContent = document.getElementById('dynamicContent');
    if (!dynamicContent) return;
    
    dynamicContent.innerHTML += `
        <div class="section-card">
            <div class="section-title">👤 My Profile</div>
            <div class="profile-info">
                <div class="info-row">
                    <div class="info-label">Student ID:</div>
                    <div class="info-value">${profile.studentId || 'N/A'}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Full Name:</div>
                    <div class="info-value">${profile.name || 'N/A'}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Date of Birth:</div>
                    <div class="info-value">${profile.dob || 'N/A'}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Email:</div>
                    <div class="info-value">${profile.email || 'N/A'}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Grade:</div>
                    <div class="info-value">${profile.grade || 'N/A'}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Registration Date:</div>
                    <div class="info-value">${profile.registrationDate || 'N/A'}</div>
                </div>
            </div>
        </div>
    `;
}

function renderSubjects(subjects) {
    const dynamicContent = document.getElementById('dynamicContent');
    if (!dynamicContent || !subjects || subjects.length === 0) return;
    
    let subjectsHtml = `
        <div class="section-card">
            <div class="section-title">📖 Subjects & Performance</div>
            <div class="subjects-grid">
    `;
    
    subjects.forEach(subject => {
        subjectsHtml += `
            <div class="subject-card">
                <span class="subject-name">${subject.name}</span>
                <span class="subject-grade">${subject.grade || 'Pending'}</span>
            </div>
        `;
    });
    
    subjectsHtml += `</div></div>`;
    dynamicContent.innerHTML += subjectsHtml;
}

function renderResults(results) {
    const dynamicContent = document.getElementById('dynamicContent');
    if (!dynamicContent || !results || results.length === 0) return;
    
    let resultsHtml = `
        <div class="section-card">
            <div class="section-title">📝 Exam Results</div>
            <div class="subjects-grid">
    `;
    
    results.forEach(result => {
        resultsHtml += `
            <div class="subject-card">
                <span class="subject-name">${result.exam_name} - ${result.subject_name}</span>
                <span class="subject-grade">${result.score}/${result.max_score} (${result.grade})</span>
            </div>
        `;
    });
    
    resultsHtml += `</div></div>`;
    dynamicContent.innerHTML += resultsHtml;
}

function renderFees(fees) {
    const dynamicContent = document.getElementById('dynamicContent');
    if (!dynamicContent) return;
    
    const statusClass = fees.status === 'Paid' ? 'fee-paid' : 'fee-pending';
    
    dynamicContent.innerHTML += `
        <div class="section-card">
            <div class="section-title">💰 Fee Details</div>
            <div class="profile-info">
                <div class="info-row">
                    <div class="info-label">Total Fees:</div>
                    <div class="info-value">KSh ${(fees.total || 0).toLocaleString()}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Amount Paid:</div>
                    <div class="info-value">KSh ${(fees.paid || 0).toLocaleString()}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Balance:</div>
                    <div class="info-value">KSh ${(fees.balance || 0).toLocaleString()}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Status:</div>
                    <div class="info-value"><span class="fee-status ${statusClass}">${fees.status || 'Pending'}</span></div>
                </div>
            </div>
        </div>
    `;
}

function logout() {
    localStorage.clear();
    window.location.href = 'index.html';
}