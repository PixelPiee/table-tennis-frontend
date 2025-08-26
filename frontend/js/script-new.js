// Initialize data storage
const students = JSON.parse(localStorage.getItem('tableTennisStudents') || '[]');
const payments = JSON.parse(localStorage.getItem('tableTennisPayments') || '[]');

// Package prices
const PACKAGE_PRICES = {
    '1 Month': 4000,
    '6 Months': 20000,
    '1 Year': 40000
};

// DOM Elements
const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

// Function to handle package selection
function handlePackageSelect(event) {
    event.preventDefault();
    console.log('Package selected!');
    
    const button = event.currentTarget;
    const packageName = button.getAttribute('data-package');
    const price = button.getAttribute('data-price');
    const duration = button.getAttribute('data-duration');
    
    console.log('Selected package:', { packageName, price, duration });
    
    if (packageName && price && duration) {
        const url = `payment-options.html?package=${encodeURIComponent(packageName)}&price=${price}&duration=${duration}`;
        console.log('Redirecting to:', url);
        window.location.href = url;
    } else {
        console.error('Missing package details');
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
            button.removeEventListener('click', handlePackageSelect);
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
