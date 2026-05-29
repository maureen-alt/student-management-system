// Wait for DOM to fully load
document.addEventListener('DOMContentLoaded', function() {
    
    // Handle Login Form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const studentId = document.getElementById('studentId').value;
            const dob = document.getElementById('dob').value;
            
            if (!studentId || !dob) {
                alert('Please enter both Student ID and Date of Birth');
                return;
            }
            
            try {
                const response = await fetch('php/api/login.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ studentId, dob })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    localStorage.setItem('studentId', studentId);
                    localStorage.setItem('studentName', result.name);
                    window.location.href = 'student-dashboard.html';
                } else {
                    alert(result.message || 'Login failed. Please check your credentials.');
                }
            } catch (error) {
                console.error('Login error:', error);
                alert('Error connecting to server. Please make sure your server is running.');
            }
        });
    }
    
    // Handle Registration Form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Registration form submitted'); // Debug log
            
            // Get form values
            const fullName = document.getElementById('fullName')?.value;
            const dob = document.getElementById('dob')?.value;
            const email = document.getElementById('email')?.value;
            const phone = document.getElementById('phone')?.value;
            const parentContact = document.getElementById('parentContact')?.value;
            const grade = document.getElementById('grade')?.value;
            
            // Validate required fields
            if (!fullName || !dob || !email || !grade) {
                alert('Please fill in all required fields (*)');
                return;
            }
            
            // Prepare data
            const formData = {
                fullName: fullName,
                dob: dob,
                email: email,
                phone: phone || '',
                parentContact: parentContact || '',
                grade: grade
            };
            
            console.log('Sending registration data:', formData); // Debug log
            
            try {
                const response = await fetch('php/api/register.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                
                const result = await response.json();
                console.log('Registration response:', result); // Debug log
                
                if (result.success) {
                    alert(`✅ Registration Successful!\n\nYour Student ID is: ${result.studentId}\n\nPlease save this ID for login.`);
                    window.location.href = 'login.html';
                } else {
                    alert('❌ Registration failed: ' + (result.message || 'Unknown error'));
                }
            } catch (error) {
                console.error('Registration error:', error);
                alert('Error connecting to server. Please make sure:\n1. XAMPP/WAMP is running\n2. Files are in the correct directory\n3. Database is set up');
            }
        });
    }
});

// Logout function (global)
function logout() {
    localStorage.clear();
    window.location.href = 'index.html';
}