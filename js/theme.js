// Theme toggle functionality
function toggleTheme() {
    const html = document.documentElement;
    const icon = document.querySelector('.theme-toggle i');
    const currentTheme = html.getAttribute('data-bs-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    html.setAttribute('data-bs-theme', newTheme);
    icon.className = newTheme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-fill';
    
    // Save theme preference
    localStorage.setItem('theme', newTheme);
}

// Load saved theme and attach event listener
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const html = document.documentElement;
    const icon = document.querySelector('.theme-toggle i');
    
    html.setAttribute('data-bs-theme', savedTheme);
    icon.className = savedTheme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-fill';

    const themeToggleBtn = document.querySelector('.theme-toggle');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }
});