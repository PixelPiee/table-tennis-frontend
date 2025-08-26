// Fetch students and payments from the backend
let students = [];
let payments = [];

// Fetch data from backend on load
async function fetchData() {
    try {
        students = await api.getStudents();
        payments = await api.getPayments();
        updateDashboard();
    } catch (error) {
        console.error('Error initializing data:', error);
    }
}

// DOM Elements
const loginForm = document.getElementById('loginForm');
const loginFormElement = document.getElementById('loginFormElement');
const dashboard = document.getElementById('dashboard');
const logoutBtn = document.getElementById('logoutBtn');
const addStudentBtn = document.getElementById('addStudentBtn');
const studentModal = new bootstrap.Modal(document.getElementById('studentModal'));
const studentForm = document.getElementById('studentForm');

// Login credentials (in a real app, this would be handled server-side)
const COACH_CREDENTIALS = {
    username: 'coach',
    password: 'coach123'
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Always show login page first
    showLogin();
    
    // Clear any existing login status to ensure fresh login
    localStorage.removeItem('coachLoggedIn');

    // Add event listeners
    if (loginFormElement) {
        loginFormElement.addEventListener('submit', handleLogin);
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    if (addStudentBtn) {
        addStudentBtn.addEventListener('click', () => openStudentModal());
    }
    
    if (studentForm) {
        studentForm.addEventListener('submit', handleStudentFormSubmit);
    }

    // Package amount and end date calculation
    const packageSelect = document.getElementById('studentPackage');
    const startDateInput = document.getElementById('studentStartDate');
    
    if (packageSelect && startDateInput) {
        // Function to calculate end date based on package
        function updateEndDate() {
            const package = packageSelect.value;
            const startDate = new Date(startDateInput.value);
            const endDateInput = document.getElementById('studentEndDate');
            
            if (!package || !startDate || !endDateInput) return;
            
            let endDate = new Date(startDate);
            switch(package) {
                case '1 Month':
                    endDate.setMonth(endDate.getMonth() + 1);
                    break;
                case '3 Months':
                    endDate.setMonth(endDate.getMonth() + 3);
                    break;
                case '6 Months':
                    endDate.setMonth(endDate.getMonth() + 6);
                    break;
                case '1 Year':
                    endDate.setFullYear(endDate.getFullYear() + 1);
                    break;
            }
            endDateInput.value = endDate.toISOString().split('T')[0];
        }
        
        // Update end date when package or start date changes
        packageSelect.addEventListener('change', updateEndDate);
        startDateInput.addEventListener('change', updateEndDate);
        
        // Package amount mapping
        const packageMap = {
            '1 Month': 4000,
            '3 Months': 10000,
            '6 Months': 20000,
            '1 Year': 40000
        };
        
        packageSelect.addEventListener('change', function() {
            const selectedPackage = this.value;
            if (packageMap[selectedPackage]) {
                document.getElementById('studentAmount').value = packageMap[selectedPackage];
            }
            updateEndDate();
        });
    }
});

// Handle login
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const loginButton = document.querySelector('#loginFormElement button[type="submit"]');
    const originalButtonText = loginButton.innerHTML;
    
    // Show loading state
    loginButton.disabled = true;
    loginButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Signing in...';
    
    // Simulate network delay (in a real app, this would be an API call)
    setTimeout(() => {
        if (username === COACH_CREDENTIALS.username && password === COACH_CREDENTIALS.password) {
            // Successful login
            localStorage.setItem('coachLoggedIn', 'true');
            localStorage.setItem('lastLogin', new Date().toISOString());
            showDashboard();
        } else {
            // Failed login
            const errorDiv = document.createElement('div');
            errorDiv.className = 'alert alert-danger mt-3';
            errorDiv.role = 'alert';
            errorDiv.textContent = 'Invalid username or password. Please try again.';
            
            // Remove any existing error messages
            const existingError = document.querySelector('.alert-danger');
            if (existingError) {
                existingError.remove();
            }
            
            // Add new error message
            loginFormElement.appendChild(errorDiv);
            
            // Clear password field and focus it
            document.getElementById('password').value = '';
            document.getElementById('password').focus();
        }
        
        // Reset button state
        loginButton.disabled = false;
        loginButton.innerHTML = originalButtonText;
    }, 800); // Simulate network delay
}

// Handle logout
function handleLogout() {
        localStorage.removeItem('coachLoggedIn');
        localStorage.removeItem('lastLogin');
        showLogin();
}

// Show login form
function showLogin() {
    if (loginForm) {
        loginForm.style.display = 'block';
    }
    
    if (dashboard) {
        dashboard.style.display = 'none';
    }
}

// Show dashboard
async function showDashboard() {
    if (loginForm) loginForm.style.display = 'none';
    if (dashboard) dashboard.style.display = 'block';
    
    // Fetch data from backend and update dashboard
    await fetchData();
}

// Update dashboard with current data
function updateDashboard() {
    updateSummaryCards();
    updateStudentsTable();
    updatePaymentsTable();
}

// Update summary cards
function updateSummaryCards() {
    // Calculate total earnings (only from paid students)
    const totalEarnings = students
        .filter(student => student.status === 'Paid')
        .reduce((sum, student) => sum + (student.amount || 0), 0);

    // Calculate total pending payments
    const pendingStudents = students.filter(student => student.status === 'Pending');
    const totalPending = pendingStudents
        .reduce((sum, student) => sum + (student.amount || 0), 0);

    // Update the cards
    const totalRevenue = document.getElementById('totalRevenue');
    const totalStudents = document.getElementById('totalStudents');
    const pendingPayments = document.getElementById('pendingPayments');
    const pendingCount = document.getElementById('pendingCount');

    if (totalRevenue) totalRevenue.textContent = `₹${totalEarnings}`;
    if (totalStudents) totalStudents.textContent = students.length;
    if (pendingPayments) pendingPayments.textContent = `₹${totalPending}`;
    if (pendingCount) pendingCount.textContent = pendingStudents.length;
}

// Update students table
function updateStudentsTable() {
    const tbody = document.getElementById('studentsTableBody');
    if (!tbody) {
        console.warn('Students table body not found');
        return;
    }

    tbody.innerHTML = '';
    
    if (!Array.isArray(students)) {
        console.warn('Students is not an array:', students);
        return;
    }
    
    students.forEach((student, index) => {
        // Determine payment status
        const statusText = student.status || 'Pending';
        const statusClass = statusText === 'Paid' ? 'bg-success' : 'bg-warning';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student.name || '-'}</td>
            <td>${student.phone || '-'}</td>
            <td>${student.email || '-'}</td>
            <td>${formatDate(student.start_date)}</td>
            <td>${student.package || '-'}</td>
            <td>₹${student.amount || 0}</td>
            <td><span class="badge ${statusClass}">${statusText}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="openStudentModal(${student.id})">
                    <i class="bi bi-pencil"></i> Edit
                </button>
                <button class="btn btn-sm btn-outline-info me-1" onclick="openRecordPaymentModal(${student.id})">
                    <i class="bi bi-cash"></i> Record Payment
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteStudent(${student.id})">
                    <i class="bi bi-trash"></i> Delete
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Update payments table
function updatePaymentsTable() {
    const tbody = document.getElementById('paymentsTableBody');
    if (!tbody) {
        console.warn('Payments table body not found');
        return;
    }

    tbody.innerHTML = '';
    
    if (!Array.isArray(payments)) {
        console.warn('Payments is not an array:', payments);
        return;
    }
    
    payments.forEach(payment => {
        const student = students.find(s => s.id === payment.student_id);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(payment.payment_date)}</td>
            <td>${student ? student.name : 'Unknown'}</td>
            <td>${payment.notes || 'Payment'}</td>
            <td>₹${payment.amount || 0}</td>
            <td><span class="badge bg-success">Paid</span></td>
        `;
        tbody.appendChild(row);
    });
}

// Delete student
async function deleteStudent(id) {
    if (!id) {
        console.warn('No student ID provided');
        return;
    }

    const student = students.find(s => s.id === id);
    if (!student) {
        console.error('Student not found:', id);
        return;
    }

    if (confirm(`Are you sure you want to delete ${student.name}? This will also delete all related payments.`)) {
        try {
            // Show loading state
            const deleteButton = document.querySelector(`button[onclick="deleteStudent(${id})"]`);
            if (deleteButton) {
                const originalText = deleteButton.innerHTML;
                deleteButton.disabled = true;
                deleteButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Deleting...';
            }

            // Delete the student
            await api.deleteStudent(id);

            // Show success message
            const alertDiv = document.createElement('div');
            alertDiv.className = 'alert alert-success alert-dismissible fade show';
            alertDiv.innerHTML = `
                <strong>Success!</strong> Student "${student.name}" has been deleted.
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            `;
            document.querySelector('#alertContainer').appendChild(alertDiv);

            // Refresh the data
            await fetchData();

            // Remove alert after 5 seconds
            setTimeout(() => {
                if (alertDiv.parentElement) {
                    alertDiv.remove();
                }
            }, 5000);

        } catch (error) {
            console.error('Error deleting student:', error);
            
            // Show error message
            const alertDiv = document.createElement('div');
            alertDiv.className = 'alert alert-danger alert-dismissible fade show';
            alertDiv.innerHTML = `
                <strong>Error!</strong> Failed to delete student: ${error.message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            `;
            document.querySelector('#alertContainer').appendChild(alertDiv);

            // Reset delete button if it exists
            const deleteButton = document.querySelector(`button[onclick="deleteStudent(${id})"]`);
            if (deleteButton) {
                deleteButton.disabled = false;
                deleteButton.innerHTML = '<i class="bi bi-trash"></i> Delete';
            }

            // Remove error alert after 5 seconds
            setTimeout(() => {
                if (alertDiv.parentElement) {
                    alertDiv.remove();
                }
            }, 5000);
        }
    }
}

// Open student modal
function openStudentModal(studentId = null) {
    const form = document.getElementById('studentForm');
    const modalTitle = document.querySelector('#studentModal .modal-title');
    
    // Reset form and remove any previous student ID
    form.reset();
    form.removeAttribute('data-student-id');
    
    if (studentId) {
        const student = students.find(s => s.id === studentId);
        if (!student) {
            console.error('Student not found:', studentId);
            return;
        }
        
        // Set modal title for edit
        modalTitle.textContent = 'Edit Student';
        
        // Set form data
        form.querySelector('#studentName').value = student.name || '';
        form.querySelector('#studentEmail').value = student.email || '';
        form.querySelector('#studentPhone').value = student.phone || '';
        form.querySelector('#studentPackage').value = student.package || '';
        form.querySelector('#studentStartDate').value = student.start_date || '';
        form.querySelector('#studentEndDate').value = student.end_date || '';
        form.querySelector('#studentAmount').value = student.amount || '';
        form.querySelector('#studentStatus').value = student.status || 'Pending';
        
        // Store student ID for update
        form.setAttribute('data-student-id', studentId);
    } else {
        // Set modal title for new student
        modalTitle.textContent = 'Add Student';
        
        // Set default values for new student
        const today = new Date().toISOString().split('T')[0];
        form.querySelector('#studentStartDate').value = today;
        form.querySelector('#studentStatus').value = 'Pending';
        
        // Trigger package change to set amount and end date
        const packageSelect = form.querySelector('#studentPackage');
        if (packageSelect) {
            packageSelect.value = '1 Month'; // Set default package
            packageSelect.dispatchEvent(new Event('change')); // This will set amount and end date
        }
    }
    
    // Show modal
    studentModal.show();
}

// Handle student form submission
async function handleStudentFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    
    // Show loading state
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
    
    try {
        // Get form data
        const studentData = {
            name: form.querySelector('#studentName').value.trim(),
            email: form.querySelector('#studentEmail').value.trim(),
            phone: form.querySelector('#studentPhone').value.trim(),
            package: form.querySelector('#studentPackage').value,
            start_date: form.querySelector('#studentStartDate').value,
            amount: parseFloat(form.querySelector('#studentAmount').value) || 0,
            status: form.querySelector('#studentStatus').value || 'Pending'
        };
        
        // Calculate end date based on package
        const startDate = new Date(studentData.start_date);
        let endDate = new Date(startDate);
        switch(studentData.package) {
            case '1 Month':
                endDate.setMonth(endDate.getMonth() + 1);
                break;
            case '3 Months':
                endDate.setMonth(endDate.getMonth() + 3);
                break;
            case '6 Months':
                endDate.setMonth(endDate.getMonth() + 6);
                break;
            case '1 Year':
                endDate.setFullYear(endDate.getFullYear() + 1);
                break;
        }
        studentData.end_date = endDate.toISOString().split('T')[0];
        
        // Get student ID if editing
        const studentId = form.getAttribute('data-student-id');
        
        let updatedStudent;
        let oldStudent;
        
        if (studentId) {
            // Get the current student data before update
            oldStudent = students.find(s => s.id === parseInt(studentId));
            
            // Update existing student
            updatedStudent = await api.updateStudent(parseInt(studentId), studentData);
            console.log('Student updated:', updatedStudent);
            
            // If status changed from Pending to Paid, create a payment record
            if (oldStudent && oldStudent.status === 'Pending' && studentData.status === 'Paid') {
                const paymentData = {
                    student_id: updatedStudent.id,
                    amount: studentData.amount,
                    payment_date: new Date().toISOString().split('T')[0],
                    payment_method: 'Cash',
                    notes: `Payment received for ${studentData.package} package`
                };
                
                await api.addPayment(paymentData);
            }
        } else {
            // Add new student
            updatedStudent = await api.addStudent(studentData);
            console.log('New student added:', updatedStudent);
            
            // If new student is marked as paid, create a payment record
            if (studentData.status === 'Paid') {
                const paymentData = {
                    student_id: updatedStudent.id,
                    amount: studentData.amount,
                    payment_date: studentData.start_date,
                    payment_method: 'Cash',
                    notes: `Initial payment for ${studentData.package} package`
                };
                
                await api.addPayment(paymentData);
            }
        }
        
        // Close modal and refresh data
        studentModal.hide();
        await fetchData();
        
        // Show success message
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-success alert-dismissible fade show';
        alertDiv.innerHTML = `
            <strong>Success!</strong> Student ${studentId ? 'updated' : 'added'} successfully.
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        document.querySelector('#alertContainer').appendChild(alertDiv);
        
        // Reset form
        form.reset();
        form.removeAttribute('data-student-id');
        
    } catch (error) {
        console.error('Error saving student:', error);
        
        // Show error message
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger alert-dismissible fade show';
        alertDiv.innerHTML = `
            <strong>Error!</strong> Failed to save student: ${error.message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        document.querySelector('#alertContainer').appendChild(alertDiv);
        
    } finally {
        // Always reset button state
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText || 'Save Student';
        }
        
        // Remove any stale alerts after 5 seconds
        setTimeout(() => {
            const alerts = document.querySelectorAll('.alert');
            alerts.forEach(alert => {
                if (alert && alert.parentElement) {
                    alert.remove();
                }
            });
        }, 5000);
    }
}

// Open record payment modal
function openRecordPaymentModal(studentId) {
    const modal = new bootstrap.Modal(document.getElementById('recordPaymentModal'));
    const form = document.getElementById('paymentForm');
    const student = students.find(s => s.id === studentId);

    if (!student) {
        console.error('Student not found for payment:', studentId);
        return;
    }

    // Populate student ID and default values
    form.querySelector('#paymentStudentId').value = studentId;
    form.querySelector('#recordPaymentAmount').value = student.amount || '';
    form.querySelector('#recordPaymentDate').value = new Date().toISOString().split('T')[0];
    form.querySelector('#recordPaymentMethod').value = 'Cash'; // Default to Cash
    form.querySelector('#recordPaymentNotes').value = `Payment for ${student.name} (${student.package})`;

    modal.show();
}

// Handle record payment form submission
async function handleRecordPaymentSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const submitButton = document.getElementById('saveRecordPayment');
    const originalButtonText = submitButton.innerHTML;

    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';

    try {
        const paymentData = {
            student_id: parseInt(form.querySelector('#paymentStudentId').value),
            amount: parseFloat(form.querySelector('#recordPaymentAmount').value),
            payment_date: form.querySelector('#recordPaymentDate').value,
            payment_method: form.querySelector('#recordPaymentMethod').value,
            notes: form.querySelector('#recordPaymentNotes').value.trim()
        };

        await api.addPayment(paymentData);

        // Update student status to Paid if not already
        const studentId = paymentData.student_id;
        const student = students.find(s => s.id === studentId);
        if (student && student.status !== 'Paid') {
            await api.updateStudent(studentId, { ...student, status: 'Paid' });
        }

        const recordPaymentModal = bootstrap.Modal.getInstance(document.getElementById('recordPaymentModal'));
        recordPaymentModal.hide();
        await fetchData();
        showAlert('Payment recorded successfully!', 'success');
        form.reset();
    } catch (error) {
        console.error('Error recording payment:', error);
        showAlert(`Failed to record payment: ${error.message}`, 'danger');
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
    }
}

// Generic alert function
function showAlert(message, type) {
    const alertContainer = document.getElementById('alertContainer');
    if (alertContainer) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            <strong>${type === 'success' ? 'Success!' : 'Error!'}</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        alertContainer.appendChild(alertDiv);
        setTimeout(() => alertDiv.remove(), 5000);
    }
}

// Add event listener for record payment form submission
document.addEventListener('DOMContentLoaded', () => {
    const recordPaymentForm = document.querySelector('#recordPaymentModal #paymentForm');
    if (recordPaymentForm) {
        recordPaymentForm.addEventListener('submit', handleRecordPaymentSubmit);
    }
});

// Format date helper function
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN');
}
