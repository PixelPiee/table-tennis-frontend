// News functionality
let currentFilter = 'all';
let newsItems = [];

// Initialize news functionality
document.addEventListener('DOMContentLoaded', function() {
    // Load news items
    fetchNews();
    
    // Add filter click handlers
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Update active state
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Update filter and refresh display
            currentFilter = this.dataset.filter;
            displayNews();
        });
    });
});

// Fetch news from the backend
async function fetchNews() {
    try {
        const response = await fetch(`${api.API_BASE}/news`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        newsItems = await response.json();
        
        // Check for breaking news
        const breakingNews = newsItems.find(news => 
            news.status === 'published' && 
            news.category === 'announcements' && 
            isWithinLast24Hours(news.date)
        );
        
        if (breakingNews) {
            showBreakingNews(breakingNews);
        }
        
        displayNews();
    } catch (error) {
        console.error('Error fetching news:', error);
    }
}

// Display news items based on current filter
function displayNews() {
    const container = document.getElementById('newsContainer');
    if (!container) return;
    
    // Filter news items
    let filteredNews = newsItems.filter(item => item.status === 'published');
    
    if (currentFilter !== 'all') {
        filteredNews = filteredNews.filter(item => item.category === currentFilter);
    }
    
    // Sort by date (newest first)
    filteredNews.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Generate HTML
    container.innerHTML = filteredNews.map(news => `
        <div class="col-lg-4 col-md-6 mb-4">
            <div class="news-card h-100">
                ${news.image ? `
                    <img src="${news.image}" class="card-img-top" alt="${news.title}">
                ` : ''}
                <div class="card-body">
                    <span class="news-category category-${news.category}">${news.category}</span>
                    <div class="news-date">${formatDate(news.date)}</div>
                    <h3 class="news-title">${news.title}</h3>
                    <p class="news-excerpt">${truncateText(news.content, 150)}</p>
                    <button class="btn btn-link p-0" onclick="showFullNews(${news.id})">Read More</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Show breaking news banner
function showBreakingNews(news) {
    const banner = document.getElementById('breakingNews');
    if (banner) {
        banner.querySelector('.breaking-news-content').textContent = news.title;
        banner.classList.remove('d-none');
    }
}

// Show full news in a modal
function showFullNews(newsId) {
    const news = newsItems.find(n => n.id === newsId);
    if (!news) return;
    
    // Create and show modal
    const modalHtml = `
        <div class="modal fade" id="newsModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${news.title}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        ${news.image ? `
                            <img src="${news.image}" class="img-fluid mb-3" alt="${news.title}">
                        ` : ''}
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <span class="badge category-${news.category}">${news.category}</span>
                            <small class="text-muted">${formatDate(news.date)}</small>
                        </div>
                        <div class="news-content">${news.content}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('newsModal'));
    modal.show();
    
    // Remove modal from DOM after hiding
    document.getElementById('newsModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

// Helper function to check if date is within last 24 hours
function isWithinLast24Hours(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = (now - date) / (1000 * 60 * 60);
    return diffHours <= 24;
}

// Helper function to truncate text
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
}

// Helper function to format date
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
} 