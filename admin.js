// Check admin login (simple check - in production use proper session)
let adminLoggedIn = localStorage.getItem('adminLoggedIn');
if (!adminLoggedIn) {
    // For demo, auto-login admin
    localStorage.setItem('adminLoggedIn', 'true');
}

let currentSection = 'students';

function showSection(section) {
    currentSection = section;
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.getElementById(`${section}Section`).classList.add('active');
    
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    loadSectionData(section);
}

function loadSectionData(section) {
    switch(section) {
        case 'students':
            loadStudents();
            break;
        case 'results':
            loadStudentsForDropdown();
            loadResults();
            break;
        case 'fees':
            loadStudentsForDropdown();
            loadFees();
            break;
        case 'attendance':
            loadAttendanceList();
            loadAttendanceRecords();
            break;
    }
}

// Load all students
async function loadStudents() {
    const response = await fetch('../php/api/admin/get-students.php');
    const students = await response.json();
    
    const tbody = document.getElementById('studentsTableBody');
    tbody.innerHTML = students.map(student => `
        <tr>
            <td>${student.student_id}</td>
            <td>${student.full_name}</td>
            <td>${student.email}</td>
            <td>${student.grade}</td>
            <td>${student.phone || '-'}</td>
            <td>
                <button class="action-btn edit-btn" onclick="editStudent('${student.student_id}')">Edit</button>
                <button class="action-btn delete-btn" onclick="deleteStudent('${student.student_id}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

function searchStudents() {
    const searchTerm = document.getElementById('searchStudent').value.toLowerCase();
    const rows = document.querySelectorAll('#studentsTableBody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

function openAddStudentModal() {
    document.getElementById('modalTitle').innerText = 'Add New Student';
    document.getElementById('studentForm').reset();
    document.getElementById('editStudentId').value = '';
    document.getElementById('studentModal').style.display = 'flex';
}

async function editStudent(studentId) {
    const response = await fetch(`../php/api/admin/get-student-data.php?studentId=${studentId}`);
    const student = await response.json();
    
    document.getElementById('modalTitle').innerText = 'Edit Student';
    document.getElementById('editStudentId').value = student.student_id;
    document.getElementById('studentName').value = student.full_name;
    document.getElementById('studentDob').value = student.date_of_birth;
    document.getElementById('studentEmail').value = student.email;
    document.getElementById('studentPhone').value = student.phone || '';
    document.getElementById('studentParentContact').value = student.parent_contact || '';
    document.getElementById('studentGrade').value = student.grade;
    document.getElementById('studentModal').style.display = 'flex';
}

function closeStudentModal() {
    document.getElementById('studentModal').style.display = 'none';
}

// Handle student form submission
document.getElementById('studentForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        studentId: document.getElementById('editStudentId').value,
        fullName: document.getElementById('studentName').value,
        dob: document.getElementById('studentDob').value,
        email: document.getElementById('studentEmail').value,
        phone: document.getElementById('studentPhone').value,
        parentContact: document.getElementById('studentParentContact').value,
        grade: document.getElementById('studentGrade').value
    };
    
    const url = formData.studentId ? '../php/admin/edit-student.php' : '../php/admin/add-student.php';
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    });
    
    const result = await response.json();
    alert(result.message);
    if (result.success) {
        closeStudentModal();
        loadStudents();
    }
});

async function deleteStudent(studentId) {
    if (confirm('Are you sure you want to delete this student? This will delete all associated records.')) {
        const response = await fetch('../php/admin/delete-student.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId })
        });
        const result = await response.json();
        alert(result.message);
        if (result.success) loadStudents();
    }
}

// Load students for dropdowns
async function loadStudentsForDropdown() {
    const response = await fetch('../php/admin/get-students.php');
    const students = await response.json();
    
    const options = '<option value="">-- Select Student --</option>' + 
        students.map(s => `<option value="${s.student_id}">${s.student_id} - ${s.full_name}</option>`).join('');
    
    document.getElementById('resultStudentId').innerHTML = options;
    document.getElementById('feesStudentId').innerHTML = options;
}

// Handle result addition
document.getElementById('addResultForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        studentId: document.getElementById('resultStudentId').value,
        subjectId: document.getElementById('resultSubject').value,
        examName: document.getElementById('examName').value,
        score: document.getElementById('score').value,
        maxScore: document.getElementById('maxScore').value,
        term: document.getElementById('term').value,
        academicYear: document.getElementById('academicYear').value
    };
    
    const grade = calculateGrade(formData.score, formData.maxScore);
    
    const response = await fetch('../php/admin/add-result.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, grade })
    });
    
    const result = await response.json();
    alert(result.message);
    if (result.success) {
        document.getElementById('addResultForm').reset();
        loadResults();
    }
});

function calculateGrade(score, maxScore) {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'E';
}

async function loadResults() {
    const response = await fetch('../php/admin/get-results.php');
    const results = await response.json();
    
    const tbody = document.getElementById('resultsTableBody');
    tbody.innerHTML = results.map(result => `
        <tr>
            <td>${result.student_name}</td>
            <td>${result.subject_name}</td>
            <td>${result.exam_name}</td>
            <td>${result.score}/${result.max_score}</td>
            <td>${result.grade}</td>
            <td><button class="action-btn delete-btn" onclick="deleteResult(${result.id})">Delete</button></td>
        </tr>
    `).join('');
}

async function deleteResult(resultId) {
    if (confirm('Delete this result?')) {
        const response = await fetch('../php/api/admin/delete-result.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resultId })
        });
        const result = await response.json();
        alert(result.message);
        if (result.success) loadResults();
    }
}

// Handle fees update
document.getElementById('updateFeesForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        studentId: document.getElementById('feesStudentId').value,
        totalFees: document.getElementById('totalFees').value,
        amountPaid: document.getElementById('amountPaid').value,
        status: document.getElementById('feeStatus').value
    };
    
    const response = await fetch('../php/admin/update-fees.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    });
    
    const result = await response.json();
    alert(result.message);
    if (result.success) {
        loadFees();
    }
});

async function loadFees() {
    const response = await fetch('../php/admin/get-fees.php');
    const fees = await response.json();
    
    const tbody = document.getElementById('feesTableBody');
    tbody.innerHTML = fees.map(fee => `
        <tr>
            <td>${fee.student_name}</td>
            <td>KSh ${parseInt(fee.total_fees).toLocaleString()}</td>
            <td>KSh ${parseInt(fee.amount_paid).toLocaleString()}</td>
            <td>KSh ${(fee.total_fees - fee.amount_paid).toLocaleString()}</td>
            <td><span class="fee-status ${fee.status === 'Paid' ? 'fee-paid' : 'fee-pending'}">${fee.status}</span></td>
        </tr>
    `).join('');
}

// Attendance functions
async function loadAttendanceList() {
    const response = await fetch('../php/admin/get-students.php');
    const students = await response.json();
    
    const container = document.getElementById('attendanceList');
    container.innerHTML = `
        <div style="margin-bottom: 20px;">
            <label>Date: <input type="date" id="attendanceDateSelect" onchange="loadAttendanceForDate()"></label>
        </div>
        <div id="attendanceStudentsList">
            ${students.map(student => `
                <div style="margin-bottom: 10px; padding: 10px; background: #f8f9fa; border-radius: 5px;">
                    <label>
                        <input type="checkbox" class="attendance-checkbox" data-student="${student.student_id}" data-name="${student.full_name}">
                        ${student.full_name} (${student.student_id})
                    </label>
                    <select class="attendance-status" data-student="${student.student_id}" style="margin-left: 10px;">
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                        <option value="Late">Late</option>
                    </select>
                </div>
            `).join('')}
        </div>
    `;
}

document.getElementById('attendanceForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const date = document.getElementById('attendanceDate').value;
    const checkboxes = document.querySelectorAll('.attendance-checkbox');
    const attendanceData = [];
    
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            const studentId = checkbox.getAttribute('data-student');
            const statusSelect = document.querySelector(`.attendance-status[data-student="${studentId}"]`);
            attendanceData.push({
                studentId: studentId,
                status: statusSelect.value,
                date: date
            });
        }
    });
    
    if (attendanceData.length === 0) {
        alert('Please select at least one student');
        return;
    }
    
    const response = await fetch('../php/api/admin/save-attendance.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendance: attendanceData })
    });
    
    const result = await response.json();
    alert(result.message);
    if (result.success) {
        loadAttendanceRecords();
    }
});

async function loadAttendanceRecords() {
    const response = await fetch('../php/api/admin/get-attendance.php');
    const records = await response.json();
    
    const tbody = document.getElementById('attendanceRecordsBody');
    tbody.innerHTML = records.map(record => `
        <tr>
            <td>${record.date}</td>
            <td>${record.student_name}</td>
            <td>${record.status}</td>
        </tr>
    `).join('');
}

function logout() {
    localStorage.clear();
    window.location.href = '../index.html';
}

// Initial load
loadStudents();