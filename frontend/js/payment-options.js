// Get package details from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const selectedPackage = {
    name: urlParams.get('package'),
    amount: urlParams.get('amount')
};

let studentData = null;
let paymentMethod = null;

// Display package details
document.addEventListener('DOMContentLoaded', function() {
    const packageDetails = document.getElementById('packageDetails');
    if (packageDetails && selectedPackage.name && selectedPackage.amount) {
        packageDetails.innerHTML = `
            <div>
                <h6 class="mb-1">${selectedPackage.name}</h6>
                <p class="mb-0 text-muted">Training Package</p>
            </div>
            <div class="text-end">
                <h5 class="mb-1">₹${selectedPackage.amount}</h5>
                <p class="mb-0 text-muted">Total Amount</p>
            </div>
        `;
    } else {
        window.location.href = 'index.html'; // Redirect if no package selected
    }
});

// Handle payment method selection
function selectPaymentMethod(method) {
    if (method === 'cash') {
        paymentMethod = method;
        const paymentOptions = document.querySelectorAll('.payment-option');
        paymentOptions.forEach(option => {
            option.classList.remove('selected');
        });

        const selectedOption = document.querySelector('.payment-option:first-child');
        selectedOption.classList.add('selected');
        document.getElementById('studentForm').style.display = 'block';
    }
}

// Handle form submission
document.getElementById('studentDetailsForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    
    try {
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';
        
        // Prepare student data
        studentData = {
            name: document.getElementById('name').value,
            phone: document.getElementById('phone').value,
            email: document.getElementById('email').value || null,
            package: selectedPackage.name,
            amount: parseInt(selectedPackage.amount),
            start_date: new Date().toISOString().split('T')[0],
            status: 'Pending'
        };
        
        // Add student to database for cash payment
        const newStudent = await api.addStudent(studentData);
        console.log('Student registered:', newStudent);
        
        // Show success message with Bootstrap alert
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-success alert-dismissible fade show mt-3';
        alertDiv.innerHTML = `
            <h5 class="alert-heading mb-1">Registration Successful!</h5>
            <p class="mb-0">Please visit the academy to complete your payment. Your registration ID is: #${newStudent.id}</p>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.getElementById('studentForm').appendChild(alertDiv);
        
        // Clear form
        e.target.reset();
        
        // Redirect after 3 seconds
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 3000);
        
    } catch (error) {
        console.error('Error processing request:', error);
        
        // Show error message
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger alert-dismissible fade show mt-3';
        alertDiv.innerHTML = `
            <h5 class="alert-heading mb-1">Registration Failed</h5>
            <p class="mb-0">There was an error processing your request. Please try again or contact support.</p>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.getElementById('studentForm').appendChild(alertDiv);
    } finally {
        // Reset button state
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
    }
});

// Initialize tooltips
document.addEventListener('DOMContentLoaded', function() {
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});
