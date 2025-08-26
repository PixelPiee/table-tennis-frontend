// Import the API
// import { api } from './api.js';

// Package prices
const PACKAGE_PRICES = {
    '1 Month': 4000,
    '6 Months': 20000,
    '1 Year': 40000
};

// Global variables
let students = [];
let payments = [];
let currentUser = null;

// Initialize the application
async function init() {
    try {
        console.log('Starting application initialization...');
        
        // Show loading state
        const mainContent = document.querySelector('main');
        const setLoading = (isLoading) => {
            if (mainContent) {
                const loadingElement = mainContent.querySelector('.loading-state');
                if (loadingElement) {
                    loadingElement.style.display = isLoading ? 'block' : 'none';
                }
            }
        };
        
        setLoading(true);
        
        try {
            // Load initial data
            console.log('Fetching students and payments from backend...');
            const [studentsData, paymentsData] = await Promise.all([
                api.getStudents().catch(err => {
                    console.error('Error fetching students:', err);
                    throw new Error('Failed to load students. Please try again later.');
                }),
                api.getPayments().catch(err => {
                    console.error('Error fetching payments:', err);
                    // Don't throw here, we can still continue without payments
                    return [];
                })
            ]);
            
            console.log('Data loaded from backend:', { 
                studentCount: studentsData?.length || 0, 
                paymentCount: paymentsData?.length || 0 
            });
            
            // Update global state
            students = Array.isArray(studentsData) ? studentsData : [];
            payments = Array.isArray(paymentsData) ? paymentsData : [];
            
            // Initialize UI
            updateUI();
            setupEventListeners();
            
            console.log('Application initialized successfully');
        } catch (error) {
            console.error('Initialization error:', error);
            
            // Show error to user
            const errorMessage = `
                <div class="alert alert-danger mt-4" role="alert">
                    <h4 class="alert-heading">Initialization Error</h4>
                    <p>${error.message || 'Failed to initialize the application.'}</p>
                    <hr>
                    <p class="mb-0">Please check the following:</p>
                    <ul>
                        <li>Make sure the backend server is running at http://localhost:3001</li>
                        <li>Check your internet connection</li>
                        <li>Refresh the page to try again</li>
                    </ul>
                </div>
            `;
            
            if (mainContent) {
                mainContent.innerHTML = errorMessage;
            } else {
                document.body.innerHTML = errorMessage;
            }
            
            throw error; // Re-throw to be caught by the outer try-catch
        } finally {
            setLoading(false);
        }
    } catch (error) {
        // This will catch any errors not handled in the inner try-catch
        console.error('Fatal initialization error:', error);
        // Error UI is already shown by the inner catch block
        throw error; // Re-throw to be caught by the caller
    }
}

// Update UI based on current state
async function updateUI() {
    try {
        console.log('Updating UI...');
        
        // Update student views
        updateStudentList();
        
        // Update payment views
        updatePaymentList();
        
        // Update dashboard if on dashboard page
        if (window.location.pathname.includes('coach-login.html') || 
            window.location.pathname.endsWith('index.html') || 
            window.location.pathname === '/') {
            updateDashboard();
        }
        
        // Update any other UI components that depend on student/payment data
        updateStudentDropdowns();
        
        console.log('UI update complete');
    } catch (error) {
        console.error('Error updating UI:', error);
    }
}

// Update student dropdowns in forms
function updateStudentDropdowns() {
    // Update student dropdown in payment form
    const paymentForm = document.getElementById('paymentForm');
    if (paymentForm) {
        const studentSelect = paymentForm.querySelector('select[name="studentId"]');
        if (studentSelect) {
            // Store current selection
            const currentValue = studentSelect.value;
            
            // Clear existing options except the first one (which is usually the default/placeholder)
            while (studentSelect.options.length > 1) {
                studentSelect.remove(1);
            }
            
            // Add student options
            students.forEach(student => {
                if (student && student.id && student.name) {
                    const option = document.createElement('option');
                    option.value = student.id;
                    option.textContent = `${student.name} (${student.phone || 'No phone'})`;
                    studentSelect.appendChild(option);
                }
            });
            
            // Restore selection if it still exists
            if (currentValue && Array.from(studentSelect.options).some(opt => opt.value === currentValue)) {
                studentSelect.value = currentValue;
            }
        }
    }
}

// Set up event listeners
function setupEventListeners() {
    // Package selection buttons
    document.querySelectorAll('.select-package').forEach(button => {
        button.addEventListener('click', handlePackageSelect);
    });

    // Student form submission
    const studentForm = document.getElementById('studentForm');
    if (studentForm) {
        studentForm.addEventListener('submit', handleStudentSubmit);
    }

    // Payment form submission
    const paymentForm = document.getElementById('paymentForm');
    if (paymentForm) {
        paymentForm.addEventListener('submit', handlePaymentSubmit);
    }
}

// Handle student form submission
async function handleStudentSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    const student = {
        name: formData.get('name').trim(),
        email: formData.get('email').trim(),
        phone: formData.get('phone').trim(),
        package: formData.get('package'),
        start_date: formData.get('start_date'),
        end_date: formData.get('end_date'),
        amount: parseFloat(formData.get('amount'))
    };
    
    // Basic validation
    if (!student.name) {
        alert('Please enter a name');
        return;
    }
    
    try {
        // Show loading state
        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
        
        // Add student to backend
        const newStudent = await api.addStudent(student);
        
        // Update local state
        students.push(newStudent);
        
        // Update UI
        updateUI();
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(form.closest('.modal'));
        if (modal) {
            modal.hide();
        }
        
        // Show success message
        alert('Student added successfully!');
        
    } catch (error) {
        console.error('Error saving student:', error);
        alert('Error saving student. Please try again.');
    } finally {
        // Reset form and button state
        form.reset();
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
        }
    }
}

// Handle payment form submission
async function handlePaymentSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    const payment = {
        studentId: formData.get('studentId'),
        amount: parseFloat(formData.get('amount')),
        date: formData.get('paymentDate') || new Date().toISOString().split('T')[0],
        method: formData.get('paymentMethod') || 'Cash',
        notes: formData.get('notes') || ''
    };
    
    // Basic validation
    if (!payment.studentId || isNaN(payment.amount) || payment.amount <= 0) {
        alert('Please select a student and enter a valid amount');
        return;
    }
    
    try {
        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Processing...';
        
        // Add to backend
        const newPayment = await api.addPayment(payment);
        
        // Update local state
        payments.push(newPayment);
        updateUI();
        
        // Reset form
        form.reset();
        
        // Close modal if needed
        const modal = bootstrap.Modal.getInstance(form.closest('.modal'));
        if (modal) modal.hide();
        
        // Show success message
        alert('Payment recorded successfully!');
    } catch (error) {
        console.error('Error recording payment:', error);
        alert(`Failed to record payment: ${error.message || 'Please try again.'}`);
    } finally {
        // Reset button state
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    }
}

// Update student list in the UI
function updateStudentList() {
    const studentList = document.getElementById('studentList');
    const studentTable = document.getElementById('studentsTable');
    
    // Update card view
    if (studentList) {
        studentList.innerHTML = students.length > 0 ? students.map(student => `
            <div class="card mb-3">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h5 class="card-title mb-1">${student.name || 'No Name'}</h5>
                            <p class="card-text text-muted small mb-1">
                                <i class="bi bi-envelope me-1"></i> ${student.email || 'No email'}<br>
                                <i class="bi bi-telephone me-1"></i> ${student.phone || 'No phone'}<br>
                                <i class="bi bi-box-seam me-1"></i> ${student.package || 'No package'}
                            </p>
                        </div>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-outline-primary edit-student" data-id="${student.id}">
                                <i class="bi bi-pencil"></i> Edit
                            </button>
                            <button class="btn btn-sm btn-outline-danger delete-student" data-id="${student.id}">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('') : '<div class="text-muted text-center py-4">No students found. Add your first student!</div>';
        
        // Add event listeners for edit/delete buttons
        document.querySelectorAll('.edit-student').forEach(button => {
            button.addEventListener('click', handleEditStudent);
        });
        
        document.querySelectorAll('.delete-student').forEach(button => {
            button.addEventListener('click', handleDeleteStudent);
        });
    }
    
    // Update table view if it exists
    if (studentTable) {
        const tbody = studentTable.querySelector('tbody');
        if (tbody) {
            tbody.innerHTML = students.length > 0 ? students.map(student => `
                <tr>
                    <td>${student.name || '—'}</td>
                    <td>${student.email || '—'}</td>
                    <td>${student.phone || '—'}</td>
                    <td>${student.package || '—'}</td>
                    <td class="text-nowrap">
                        <button class="btn btn-sm btn-outline-primary edit-student" data-id="${student.id}">
                            <i class="bi bi-pencil"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-student" data-id="${student.id}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('') : '<tr><td colspan="5" class="text-center py-4">No students found</td></tr>';
            
            // Add event listeners for edit/delete buttons
            tbody.querySelectorAll('.edit-student').forEach(button => {
                button.addEventListener('click', handleEditStudent);
            });
            
            tbody.querySelectorAll('.delete-student').forEach(button => {
                button.addEventListener('click', handleDeleteStudent);
            });
        }
    }
}

// Update payment list in the UI
function updatePaymentList() {
    const paymentList = document.getElementById('paymentList');
    const paymentTable = document.getElementById('paymentsTable');
    
    // Helper function to format date
    const formatDate = (dateString) => {
        if (!dateString) return '—';
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
    };
    
    // Update card view
    if (paymentList) {
        paymentList.innerHTML = payments.length > 0 ? payments.map(payment => {
            const student = students.find(s => s.id == payment.student_id) || {};
            return `
                <div class="card mb-3">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <h5 class="card-title mb-1">₹${payment.amount || '0'} - ${student.name || 'Unknown Student'}</h5>
                                <p class="card-text text-muted small mb-1">
                                    <i class="bi bi-calendar me-1"></i> ${formatDate(payment.payment_date)}<br>
                                    <i class="bi bi-credit-card me-1"></i> ${payment.payment_method || 'Cash'}<br>
                                    ${payment.notes ? `<i class="bi bi-chat-text me-1"></i> ${payment.notes}` : ''}
                                </p>
                            </div>
                            <div class="btn-group">
                                <button class="btn btn-sm btn-outline-primary edit-payment" data-id="${payment.id}">
                                    <i class="bi bi-pencil"></i> Edit
                                </button>
                                <button class="btn btn-sm btn-outline-danger delete-payment" data-id="${payment.id}">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('') : '<div class="text-muted text-center py-4">No payments found. Record your first payment!</div>';
        
        // Add event listeners for edit/delete buttons
        document.querySelectorAll('.edit-payment').forEach(button => {
            button.addEventListener('click', handleEditPayment);
        });
        
        document.querySelectorAll('.delete-payment').forEach(button => {
            button.addEventListener('click', handleDeletePayment);
        });
    }
    
    // Update table view if it exists
    if (paymentTable) {
        const tbody = paymentTable.querySelector('tbody');
        if (tbody) {
            tbody.innerHTML = payments.length > 0 ? payments.map(payment => {
                const student = students.find(s => s.id == payment.student_id) || {};
                return `
                    <tr>
                        <td>${formatDate(payment.payment_date)}</td>
                        <td>${student.name || '—'}</td>
                        <td>₹${payment.amount || '0'}</td>
                        <td>${payment.payment_method || 'Cash'}</td>
                        <td>${payment.notes || '—'}</td>
                        <td class="text-nowrap">
                            <button class="btn btn-sm btn-outline-primary edit-payment" data-id="${payment.id}">
                                <i class="bi bi-pencil"></i> Edit
                            </button>
                            <button class="btn btn-sm btn-outline-danger delete-payment" data-id="${payment.id}">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('') : '<tr><td colspan="6" class="text-center py-4">No payments found</td></tr>';
            
            // Add event listeners for edit/delete buttons
            tbody.querySelectorAll('.edit-payment').forEach(button => {
                button.addEventListener('click', handleEditPayment);
            });
            
            tbody.querySelectorAll('.delete-payment').forEach(button => {
                button.addEventListener('click', handleDeletePayment);
            });
        }
    }
}

// Handle edit student
async function handleEditStudent(event) {
    try {
        const button = event.target.closest('button');
        if (!button) return;
        
        const studentId = button.dataset.id;
        const student = students.find(s => s.id == studentId);
        if (!student) {
            console.error('Student not found:', studentId);
            alert('Error: Student not found');
            return;
        }
        
        // Populate form with student data
        const form = document.getElementById('studentForm');
        if (!form) {
            console.error('Student form not found');
            return;
        }
        
        // Store the student ID for the update
        form.dataset.studentId = studentId;
        
        // Set form values
        form.elements['name'].value = student.name || '';
        form.elements['email'].value = student.email || '';
        form.elements['phone'].value = student.phone || '';
        form.elements['package'].value = student.package || '';
        form.elements['start_date'].value = student.start_date || '';
        form.elements['end_date'].value = student.end_date || '';
        form.elements['amount'].value = student.amount || '';
        
        // Update form title
        const modalTitle = document.querySelector('#studentModal .modal-title');
        if (modalTitle) {
            modalTitle.textContent = 'Edit Student';
        }
        
        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('studentModal'));
        modal.show();
    } catch (error) {
        console.error('Error in handleEditStudent:', error);
        alert('Error loading student details. Please try again.');
    }
}

// Handle delete student
async function handleDeleteStudent(event) {
    try {
        const button = event.target.closest('button');
        if (!button) return;
        
        const studentId = button.dataset.id;
        const student = students.find(s => s.id == studentId);
        
        if (!student) {
            console.error('Student not found for deletion:', studentId);
            alert('Error: Student not found');
            return;
        }
        
        if (!confirm(`Are you sure you want to delete ${student.name || 'this student'}? This will also delete all their payment records.`)) {
            return;
        }
        
        // Show loading state
        const originalText = button.innerHTML;
        button.disabled = true;
        button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Deleting...';
        
        await deleteStudent(studentId);
        
        // Remove from local state
        students = students.filter(s => s.id != studentId);
        payments = payments.filter(p => p.student_id != studentId);
        
        // Update UI
        updateUI();
        
        // Show success message
        alert('Student and related payments deleted successfully');
    } catch (error) {
        console.error('Error deleting student:', error);
        alert(`Error deleting student: ${error.message || 'Please try again.'}`);
    } finally {
        // Reset button state
        if (button) {
            button.disabled = false;
            button.innerHTML = originalText;
        }
    }
}

// Handle edit payment
async function handleEditPayment(event) {
    const paymentId = event.target.dataset.id;
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) return;
    
    // Populate form with payment data
    const form = document.getElementById('paymentForm');
    if (form) {
        Object.entries(payment).forEach(([key, value]) => {
            if (form.elements[key]) {
                form.elements[key].value = value;
            }
        });
        
        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('paymentModal'));
        modal.show();
    }
}

// Handle delete payment
async function handleDeletePayment(event) {
    if (!confirm('Are you sure you want to delete this payment record? This action cannot be undone.')) {
        return;
    }
    
    const paymentId = event.target.dataset.id;
    try {
        await deletePayment(paymentId);
        payments = payments.filter(p => p.id !== paymentId);
        updatePaymentList();
        alert('Payment record deleted successfully');
    } catch (error) {
        console.error('Error deleting payment:', error);
        alert('Error deleting payment record. Please try again.');
    }
}

// Function to generate month cards
function generateMonthCards() {
    console.log('Generating month cards...');
    // Implementation for generating month cards
}

// Initialize the application
function initApp() {
    console.log('Initializing application...');
    
    try {
        // Generate month cards
        generateMonthCards();
        
        // Add event listeners to package buttons
        const packageButtons = document.querySelectorAll('.select-package');
        console.log(`Found ${packageButtons.length} package buttons`);
        
        packageButtons.forEach(button => {
            button.removeEventListener('click', handlePackageSelect); // Remove any existing listeners
            button.addEventListener('click', handlePackageSelect);
        });
        
        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Error initializing application:', error);
    }
}

// Log when script is loaded
console.log('Script loaded successfully!');

// Initialize the app when the script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Initialize coach dashboard if on the coach dashboard page
function initCoachDashboard() {
    // Event listeners for coach dashboard
    const loginCoachBtn = document.getElementById('loginCoach');
    const logoutCoachBtn = document.getElementById('logoutCoach');
    const addStudentBtn = document.getElementById('addStudentBtn');
    const saveStudentBtn = document.getElementById('saveStudent');
    const savePaymentBtn = document.getElementById('savePayment');
    const studentPackageSelect = document.getElementById('studentPackage');
    
    if (loginCoachBtn) loginCoachBtn.addEventListener('click', handleCoachLogin);
    if (logoutCoachBtn) logoutCoachBtn.addEventListener('click', handleCoachLogout);
    if (addStudentBtn) addStudentBtn.addEventListener('click', showAddStudentModal);
    if (saveStudentBtn) saveStudentBtn.addEventListener('click', saveStudent);
    if (savePaymentBtn) savePaymentBtn.addEventListener('click', savePayment);
    if (studentPackageSelect) studentPackageSelect.addEventListener('change', updateFeesBasedOnPackage);
    
    // Set default payment date to today
    const paymentDateInput = document.getElementById('paymentDate');
    if (paymentDateInput) paymentDateInput.valueAsDate = new Date();
    
    // Check if already logged in
    if (localStorage.getItem('coachLoggedIn') === 'true') {
        showCoachDashboard();
    }
}

// Call the coach dashboard initialization if we're on the coach dashboard page
if (window.location.pathname.includes('coach-login.html')) {
    initCoachDashboard();
}

// Update fees based on selected package
function updateFeesBasedOnPackage() {
    const packageSelect = document.getElementById('studentPackage');
    const feesInput = document.getElementById('studentFees');
    feesInput.value = PACKAGE_PRICES[packageSelect.value] || '';
}

// Generate month cards
function generateMonthCards() {
    const container = document.querySelector('#packages .row:first-child');
    container.innerHTML = ''; // Clear existing content
    
    months.forEach((month, index) => {
        const col = document.createElement('div');
        col.className = 'col-md-2 col-4 mb-4';
        col.innerHTML = `
            <div class="card package-card h-100" style="cursor: pointer;" data-month="${index}">
                <div class="card-body text-center">
                    <h5 class="card-title">${month}</h5>
                    <p class="text-muted">Click for details</p>
                </div>
            </div>
        `;
        container.appendChild(col);
    });
    
    // Add click event to month cards
    document.querySelectorAll('.package-card[data-month]').forEach(card => {
        card.addEventListener('click', () => {
            const monthIndex = parseInt(card.getAttribute('data-month'));
            showPackageOptions(monthIndex);
        });
    });
}

// Show package options
function showPackageOptions(monthIndex) {
    const monthName = months[monthIndex];
    const today = new Date();
    const currentYear = today.getFullYear();
    
    // In a real app, you would check availability for the specific month
    const modal = new bootstrap.Modal(document.getElementById('paymentModal'));
    document.getElementById('selectedPackage').value = `${monthName} ${currentYear} - 1 Month`;
    document.getElementById('amountToPay').value = '₹4,000';
    document.querySelector('input[name="paymentMethod"]').checked = true;
    
    // Store selected package info for payment processing
    document.getElementById('paymentModal').setAttribute('data-package-type', 'monthly');
    document.getElementById('paymentModal').setAttribute('data-amount', '4000');
    
    modal.show();
}

// Handle package selection
function handlePackageSelect(event) {
    const button = event.target;
    const days = parseInt(button.getAttribute('data-days'));
    const price = parseInt(button.getAttribute('data-price'));
    
    let packageName = '';
    if (days === 30) packageName = '1 Month';
    else if (days === 180) packageName = '6 Months';
    else if (days === 365) packageName = '1 Year';
    
    const modal = new bootstrap.Modal(document.getElementById('paymentModal'));
    document.getElementById('selectedPackage').value = packageName + ' Package';
    document.getElementById('amountToPay').value = `₹${price.toLocaleString('en-IN')}`;
    
    // Store selected package info for payment processing
    document.getElementById('paymentModal').setAttribute('data-package-type', packageName.toLowerCase().includes('month') ? 'monthly' : 'yearly');
    document.getElementById('paymentModal').setAttribute('data-amount', price.toString());
    
    modal.show();
}

// Handle payment
function handlePayment() {
    const packageType = document.getElementById('paymentModal').getAttribute('data-package-type');
    const amount = document.getElementById('paymentModal').getAttribute('data-amount');
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    const packageName = document.getElementById('selectedPackage').value;
    
    // In a real app, you would process the payment here
    // For demo, we'll just show an alert and add to the payments list
    
    // Create a payment record
    const payment = {
        id: Date.now(),
        date: new Date().toLocaleDateString(),
        studentName: 'Demo Student', // In a real app, get this from a form
        package: packageName,
        amount: parseInt(amount),
        paymentMethod: paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)
    };
    
    payments.push(payment);
    
    // Save to localStorage (in a real app, save to a database)
    localStorage.setItem('tableTennisPayments', JSON.stringify(payments));
    
    // Close the modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('paymentModal'));
    modal.hide();
    
    // Show success message
    alert(`Payment of ₹${amount} for ${packageName} has been processed successfully!`);
    
    // Update dashboard
    updateDashboard();
}

// Update dashboard with data
function updateDashboard() {
    // Calculate total earnings and other stats
    const totalEarnings = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalFees = students.reduce((sum, student) => sum + (parseInt(student.fees) || 0), 0);
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalBalance = totalFees - totalPaid;
    
    // Update summary cards
    document.getElementById('totalEarnings').textContent = `₹${totalEarnings.toLocaleString('en-IN')}`;
    document.getElementById('totalStudents').textContent = students.length;
    document.getElementById('totalFees').textContent = `₹${totalFees.toLocaleString('en-IN')}`;
    document.getElementById('totalPaid').textContent = `₹${totalPaid.toLocaleString('en-IN')}`;
    document.getElementById('totalBalance').textContent = `₹${totalBalance.toLocaleString('en-IN')}`;
    
    // Update students table
    updateStudentsTable();
    
    // Update payments table
    updatePaymentsTable();
}

// Update students table
function updateStudentsTable() {
    const tbody = document.getElementById('studentsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    
    students.forEach(student => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student.name}</td>
            <td>${student.package}</td>
            <td>${formatDate(student.start_date || student.created_at)}</td>
            <td>${student.end_date ? formatDate(student.end_date) : 'N/A'}</td>
            <td><span class="badge bg-success">Active</span></td>
            <td>${student.amount ? '₹' + parseInt(student.amount).toLocaleString() : 'N/A'}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editStudent(${student.id})">Edit</button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteStudent(${student.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Update payments table
function updatePaymentsTable() {
    const tbody = document.querySelector('#paymentsTable tbody');
    tbody.innerHTML = '';
    
    if (payments.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="6" class="text-center">No payment records found</td>';
        tbody.appendChild(row);
        return;
    }
    
    // Sort by date (newest first)
    const sortedPayments = [...payments].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Show only latest 10 payments
    sortedPayments.slice(0, 10).forEach(payment => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(payment.date).toLocaleDateString()}</td>
            <td>${payment.studentName || 'N/A'}</td>
            <td>${payment.package || 'N/A'}</td>
            <td>₹${payment.amount.toLocaleString('en-IN')}</td>
            <td>${payment.method || 'N/A'}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="deletePayment('${payment.id}')">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Show add student modal
function showAddStudentModal() {
    document.getElementById('studentForm').reset();
    document.getElementById('studentId').value = '';
    document.getElementById('studentModal').querySelector('.modal-title').textContent = 'Add New Student';
    document.getElementById('saveStudent').textContent = 'Add Student';
    
    // Set default package and fees
    document.getElementById('studentPackage').value = '1 Month';
    document.getElementById('studentFees').value = PACKAGE_PRICES['1 Month'];
    
    const modal = new bootstrap.Modal(document.getElementById('studentModal'));
    modal.show();
}

// Save student (add or update)
async function saveStudent() {
    const form = document.getElementById('studentForm');
    if (!form) {
        console.error('Student form not found');
        return;
    }

    try {
        // Get form elements using their IDs
        const studentId = document.getElementById('studentId')?.value || '';
        const name = document.getElementById('studentName')?.value.trim();
        const packageType = document.getElementById('studentPackage')?.value;
        const startDate = document.getElementById('startDate')?.value;
        const endDate = document.getElementById('endDate')?.value;
        const amount = parseFloat(document.getElementById('studentAmount')?.value) || 0;
        const paymentStatus = document.getElementById('studentStatus')?.value;
        
        // Basic validation
        if (!name) {
            alert('Please enter the student\'s name');
            return;
        }
        
        if (!packageType) {
            alert('Please select a package');
            return;
        }
        
        if (!startDate) {
            alert('Please select a start date');
            return;
        }
        
        if (!endDate) {
            alert('Please select an end date');
            return;
        }
        
        // Prepare student data with all required fields
        const studentData = {
            name,
            email: 'example@example.com', // Add a default email since it's required
            phone: '1234567890', // Add a default phone number since it's required
            package: packageType,
            start_date: startDate,
            end_date: endDate,
            amount: amount
        };
        
        console.log('Sending student data to server:', studentData);
        
        console.log('Saving student data:', studentData);
        
        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn?.innerHTML || '';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
        }
        
        let response;
        
        if (studentId) {
            // Update existing student
            response = await fetch(`${API_BASE}/students/${studentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(studentData)
            });
        } else {
            // Add new student
            response = await fetch(`${API_BASE}/students`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(studentData)
            });
        }
        
        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
                console.error('Error response from server:', errorData);
            } catch (e) {
                console.error('Could not parse error response as JSON');
                const text = await response.text();
                console.error('Raw error response:', text);
                throw new Error(`Server responded with status ${response.status}: ${text}`);
            }
            throw new Error(errorData.message || `Failed to save student. Status: ${response.status}`);
        }
        
        const savedStudent = await response.json();
        
        // Update local state
        if (studentId) {
            // Update existing student
            const index = students.findIndex(s => s.id == studentId);
            if (index !== -1) {
                students[index] = { ...students[index], ...savedStudent };
            }
        } else {
            // Add new student
            students.push(savedStudent);
        }
        
        // Close the modal
        const modal = bootstrap.Modal.getInstance(form.closest('.modal'));
        if (modal) modal.hide();
        
        // Refresh UI
        updateUI();
        
        // Show success message
        alert(`Student ${studentId ? 'updated' : 'added'} successfully!`);
        
    } catch (error) {
        console.error('Error saving student:', error);
        alert(`Error: ${error.message || 'Failed to save student. Please try again.'}`);
    } finally {
        // Reset button state
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    }
}

// Edit student
function editStudent(studentId) {
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    
    document.getElementById('studentId').value = student.id;
    document.getElementById('studentName').value = student.name;
    document.getElementById('studentPhone').value = student.phone || '';
    document.getElementById('studentEmail').value = student.email || '';
    document.getElementById('studentPackage').value = student.package || '1 Month';
    document.getElementById('studentFees').value = student.fees || PACKAGE_PRICES['1 Month'];
    
    document.getElementById('studentModal').querySelector('.modal-title').textContent = 'Edit Student';
    document.getElementById('saveStudent').textContent = 'Update Student';
    
    const modal = new bootstrap.Modal(document.getElementById('studentModal'));
    modal.show();
}

// Delete student from the backend
async function deleteStudent(studentId) {
    try {
        if (!studentId) {
            throw new Error('No student ID provided');
        }
        
        // First, delete all payments for this student
        const paymentIds = payments
            .filter(p => p.student_id == studentId)
            .map(p => p.id);
        
        // Delete payments in parallel
        await Promise.all(paymentIds.map(async paymentId => {
            try {
                const response = await fetch(`${API_BASE}/payments/${paymentId}`, {
                    method: 'DELETE'
                });
                
                if (!response.ok) {
                    throw new Error(`Failed to delete payment ${paymentId}`);
                }
            } catch (error) {
                console.error(`Error deleting payment ${paymentId}:`, error);
                // Continue with student deletion even if payment deletion fails
            }
        }));
        
        // Then delete the student
        const response = await fetch(`${API_BASE}/students/${studentId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to delete student');
        }
        
        // Remove from local state
        students = students.filter(s => s.id != studentId);
        payments = payments.filter(p => p.student_id != studentId);
        
        return true;
    } catch (error) {
        console.error('Error in deleteStudent:', error);
        throw error; // Re-throw to be handled by the caller
    }
}

// Show payment modal
function showPaymentModal(studentId) {
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    
    document.getElementById('paymentStudentId').value = studentId;
    document.getElementById('paymentAmount').value = '';
    document.getElementById('paymentMethod').value = 'Cash';
    document.getElementById('paymentDate').valueAsDate = new Date();
    document.getElementById('paymentNotes').value = '';
    
    const modal = new bootstrap.Modal(document.getElementById('paymentModal'));
    modal.show();
}

// Save payment
async function savePayment() {
    const form = document.getElementById('paymentForm');
    if (!form) {
        console.error('Payment form not found');
        return;
    }

    try {
        // Get form values
        const studentId = form.elements['student_id']?.value;
        const amount = parseFloat(form.elements['amount']?.value);
        const method = form.elements['method']?.value || 'Cash';
        const paymentDate = form.elements['payment_date']?.value || new Date().toISOString().split('T')[0];
        const notes = form.elements['notes']?.value.trim() || null;
        
        // Validate inputs
        if (!studentId) {
            alert('Please select a student');
            return;
        }
        
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid payment amount');
            return;
        }
        
        // Find the student
        const student = students.find(s => s.id == studentId);
        if (!student) {
            alert('Student not found');
            return;
        }
        
        // Prepare payment data
        const paymentData = {
            student_id: studentId,
            amount: amount,
            method: method,
            payment_date: paymentDate,
            notes: notes,
            package: student.package || '1 Month'
        };
        
        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn?.innerHTML || '';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';
        }
        
        // Send request to backend
        const response = await fetch(`${API_BASE}/payments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(paymentData)
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to save payment');
        }
        
        const savedPayment = await response.json();
        
        // Add to local state
        payments.push(savedPayment);
        
        // Close the modal
        const modal = bootstrap.Modal.getInstance(form.closest('.modal'));
        if (modal) modal.hide();
        
        // Refresh UI
        updateUI();
        
        // Show success message
        alert('Payment recorded successfully!');
        
    } catch (error) {
        console.error('Error saving payment:', error);
        alert(`Error: ${error.message || 'Failed to record payment. Please try again.'}`);
    } finally {
        // Reset button state
        const submitBtn = form?.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    }
}

// Delete payment
async function deletePayment(paymentId) {
    try {
        if (!paymentId) {
            throw new Error('No payment ID provided');
        }
        
        if (!confirm('Are you sure you want to delete this payment record? This action cannot be undone.')) {
            return;
        }
        
        // Show loading state
        const button = document.querySelector(`.delete-payment[data-id="${paymentId}"]`);
        const originalText = button?.innerHTML || '';
        if (button) {
            button.disabled = true;
            button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
        }
        
        // Send delete request to backend
        const response = await fetch(`${API_BASE}/payments/${paymentId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to delete payment');
        }
        
        // Remove from local state
        payments = payments.filter(p => p.id != paymentId);
        
        // Refresh UI
        updateUI();
        
        // Show success message
        alert('Payment deleted successfully!');
        
    } catch (error) {
        console.error('Error deleting payment:', error);
        alert(`Error: ${error.message || 'Failed to delete payment. Please try again.'}`);
    } finally {
        // Reset button state
        if (button) {
            button.disabled = false;
            button.innerHTML = originalText;
        }
    }
}

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Show loading state
        const mainContent = document.querySelector('main');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="d-flex justify-content-center align-items-center" style="height: 50vh;">
                    <div class="text-center">
                        <div class="spinner-border text-primary mb-3" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <p>Loading application data...</p>
                    </div>
                </div>
            `;
        }

        // Initialize the application
        console.log('DOM fully loaded, initializing application...');
        await init();
        
        // Check if we're on the coach dashboard page
        if (window.location.pathname.includes('coach-login.html')) {
            console.log('Coach dashboard detected, initializing...');
            initCoachDashboard();
        }
        
        // Set up event listeners for package selection
        document.querySelectorAll('.select-package').forEach(button => {
            button.addEventListener('click', handlePackageSelect);
        });
        
        // Initialize any other components
        function initializeComponents() {
            console.log('Initializing components...');
            
            // Set up student form if it exists
            const studentForm = document.getElementById('studentForm');
            if (studentForm) {
                console.log('Student form detected, setting up...');
                studentForm.addEventListener('submit', handleStudentSubmit);
                
                // Set up date picker for join date
                const joinDateInput = document.getElementById('joinDate');
                if (joinDateInput && !joinDateInput.value) {
                    joinDateInput.valueAsDate = new Date();
                }
            }
            
            // Set up payment form if it exists
            const paymentForm = document.getElementById('paymentForm');
            if (paymentForm) {
                console.log('Payment form detected, setting up...');
                paymentForm.addEventListener('submit', handlePaymentSubmit);
                
                // Set up date picker for payment date
                const paymentDateInput = document.getElementById('paymentDate');
                if (paymentDateInput && !paymentDateInput.value) {
                    paymentDateInput.valueAsDate = new Date();
                }
                
                // Set up student dropdown
                const studentSelect = document.getElementById('studentId');
                if (studentSelect) {
                    students.forEach(student => {
                        const option = document.createElement('option');
                        option.value = student.id;
                        option.textContent = `${student.name} (${student.email || 'No email'})`;
                        studentSelect.appendChild(option);
                    });
                }
            }
        }

        initializeComponents();
        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Error initializing application:', error);
        
        // Show error message to user
        const errorMessage = `
            <div class="alert alert-danger mt-4" role="alert">
                <h4 class="alert-heading">Application Error</h4>
                <p>Failed to load the application. Please check the following:</p>
                <ul>
                    <li>Make sure the backend server is running at http://localhost:3001</li>
                    <li>Check your internet connection</li>
                    <li>Try refreshing the page</li>
                </ul>
                <hr>
                <p class="mb-0">Error details: ${error.message || 'Unknown error'}</p>
            </div>
        `;
        
        const mainContent = document.querySelector('main');
        if (mainContent) {
            mainContent.innerHTML = errorMessage;
        } else {
            document.body.innerHTML = errorMessage;
        }
    }
});
