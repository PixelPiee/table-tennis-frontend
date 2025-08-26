// News management functionality
let newsItems = []; // Declare newsItems globally
let newsModal;
let currentNewsId = null;
let quillEditor = null;

document.addEventListener('DOMContentLoaded', function() {
    newsModal = new bootstrap.Modal(document.getElementById('newsModal'));
    
    // Initialize Quill with full build
    quillEditor = new Quill('#editor-container', {
        theme: 'snow',
        modules: {
            toolbar: [
                [{ 'font': [] }],
                [{ 'size': ['small', false, 'large', 'huge'] }],
                [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'script': 'sub'}, { 'script': 'super' }],
                ['blockquote', 'code-block'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                [{ 'indent': '-1'}, { 'indent': '+1' }],
                [{ 'direction': 'rtl' }],
                [{ 'align': [] }],
                ['link', 'image', 'video', 'formula'],
                ['clean']
            ]
        },
        placeholder: 'Write your news content here...'
    });
    
    // Handle image upload
    const toolbar = quillEditor.getModule('toolbar');
    toolbar.addHandler('image', () => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();

        input.onchange = async () => {
            const file = input.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const range = quillEditor.getSelection(true);
                    quillEditor.insertEmbed(range.index, 'image', e.target.result);
                };
                reader.readAsDataURL(file);
            }
        };
    });
    
    // Add form submit handler
    document.getElementById('newsForm').addEventListener('submit', handleNewsSubmit);
    
    // Add featured image handler
    document.getElementById('featuredImage').addEventListener('change', handleFeaturedImageUpload);
    
    // Load news items
    fetchNewsForDashboard();
});

// Open news modal
function openNewsModal(newsId = null) {
    currentNewsId = newsId;
    const form = document.getElementById('newsForm');
    const modalTitle = document.querySelector('#newsModal .modal-title');
    
    // Reset form
    form.reset();
    quillEditor.setContents([]);
    document.getElementById('imagePreview').innerHTML = '';
    
    if (newsId) {
        // Edit mode
        modalTitle.textContent = 'Edit News';
        const news = newsItems.find(n => n.id === newsId);
        if (news) {
            document.getElementById('newsTitle').value = news.title;
            document.getElementById('newsCategory').value = news.category;
            quillEditor.root.innerHTML = news.content;
            document.getElementById('newsStatus').value = news.status;
            document.getElementById('isBreakingNews').checked = news.isBreaking || false;
            document.getElementById('isHighlighted').checked = news.isHighlighted || false;
            
            // Show featured image if exists
            if (news.image) {
                document.getElementById('imagePreview').innerHTML = `
                    <img src="${news.image}" alt="Featured image">
                `;
            }
        }
    } else {
        // Add mode
        modalTitle.textContent = 'Add News';
        quillEditor.root.innerHTML = '<h2>Write your news content here...</h2><p>Start typing to add your content.</p>';
    }
    
    newsModal.show();
}

// Handle featured image upload
function handleFeaturedImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('imagePreview').innerHTML = `
            <img src="${e.target.result}" alt="Featured image preview">
        `;
    };
    reader.readAsDataURL(file);
}

// Remove featured image
function removeFeaturedImage() {
    document.getElementById('featuredImage').value = '';
    document.getElementById('imagePreview').innerHTML = '';
}

// Handle news form submission
async function handleNewsSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    
    try {
        // Show loading state
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
        
        // Get form data
        const newsData = {
            title: document.getElementById('newsTitle').value.trim(),
            category: document.getElementById('newsCategory').value,
            content: quillEditor.root.innerHTML,
            status: document.getElementById('newsStatus').value,
            isBreaking: document.getElementById('isBreakingNews').checked,
            isHighlighted: document.getElementById('isHighlighted').checked,
            date: new Date().toISOString()
        };

        // Validate required fields
        if (!newsData.title || !newsData.category || !newsData.content) {
            throw new Error('Please fill in all required fields');
        }
        
        // Handle featured image
        const featuredImage = document.getElementById('featuredImage').files[0];
        if (featuredImage) {
            if (featuredImage.size > 5 * 1024 * 1024) { // 5MB limit
                throw new Error('Featured image must be less than 5MB');
            }
            const reader = new FileReader();
            newsData.image = await new Promise((resolve, reject) => {
                reader.onload = e => resolve(e.target.result);
                reader.onerror = e => reject(new Error('Error reading image'));
                reader.readAsDataURL(featuredImage);
            });
        }
        
        // Clean and compress content if needed
        if (newsData.content.length > 1000000) { // 1MB
            throw new Error('Content is too large. Please reduce the size of images or content.');
        }
        
        let response;
        if (currentNewsId) {
            // Update existing news
            response = await fetch(`${window.api.API_BASE}/news/${currentNewsId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newsData)
            });
        } else {
            // Add new news
            response = await fetch(`${window.api.API_BASE}/news`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newsData)
            });
        }
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.error || `Server error: ${response.status}`);
        }
        
        const responseData = await response.json();
        
        // Close modal and refresh data
        newsModal.hide();
        await fetchNewsForDashboard();
        
        // Show success message
        showAlert('success', `News ${currentNewsId ? 'updated' : 'added'} successfully!`);
        
    } catch (error) {
        console.error('Error saving news:', error);
        showAlert('danger', `Error saving news: ${error.message}`);
    } finally {
        // Reset button state
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
    }
}

// Delete news
async function deleteNews(newsId) {
    if (!confirm('Are you sure you want to delete this news item?')) return;
    
    try {
        const response = await fetch(`${window.api.API_BASE}/news/${newsId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        await fetchNewsForDashboard();
        showAlert('success', 'News deleted successfully!');
        
    } catch (error) {
        console.error('Error deleting news:', error);
        showAlert('danger', 'Error deleting news. Please try again.');
    }
}

// Fetch news for dashboard
async function fetchNewsForDashboard() {
    try {
        const response = await fetch(`${window.api.API_BASE}/news`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const news = await response.json();
        newsItems = news; // Store fetched news in the global variable
        updateNewsTable(news);
        
    } catch (error) {
        console.error('Error fetching news:', error);
        showAlert('danger', 'Error loading news. Please refresh the page.');
    }
}

// Update news table
function updateNewsTable(news) {
    const tbody = document.getElementById('newsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = news.map(item => `
        <tr>
            <td>${formatDate(item.date)}</td>
            <td>
                ${item.title}
                ${item.isBreaking ? '<span class="badge bg-danger ms-2">Breaking</span>' : ''}
                ${item.isHighlighted ? '<span class="badge bg-warning ms-2">Highlighted</span>' : ''}
            </td>
            <td><span class="badge category-${item.category}">${item.category}</span></td>
            <td><span class="badge ${item.status === 'published' ? 'bg-success' : 'bg-secondary'}">${item.status}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="openNewsModal(${item.id})">
                    <i class="bi bi-pencil"></i> Edit
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteNews(${item.id})">
                    <i class="bi bi-trash"></i> Delete
                </button>
            </td>
        </tr>
    `).join('');
}

// Show alert message
function showAlert(type, message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    document.querySelector('#alertContainer').appendChild(alertDiv);
    
    // Remove alert after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentElement) {
            alertDiv.remove();
        }
    }, 5000);
} 

// Helper function to format date
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN');
}

// Initialize news functionality on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    // Existing DOMContentLoaded logic already handles Quill, form submit, etc.
    // We just need to ensure fetchNewsForDashboard is called.
    fetchNewsForDashboard();
}); 