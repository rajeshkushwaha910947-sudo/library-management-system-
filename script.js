// ========== USER AUTHENTICATION SYSTEM ==========
const STORAGE_USERS = 'librisflow_users';
const STORAGE_SESSION = 'librisflow_session';
let notificationCount = 0;

// Initialize default users
function initUsers() {
    if (!localStorage.getItem(STORAGE_USERS)) {
        const defaultUsers = {
            'admin@librisflow.com': {
                email: 'admin@librisflow.com',
                password: 'admin123',
                name: 'Administrator',
                phone: '',
                memberSince: new Date().toISOString()
            }
        };
        localStorage.setItem(STORAGE_USERS, JSON.stringify(defaultUsers));
    }
}

// Register new user
function registerUser(fullName, email, password, phone) {
    const users = JSON.parse(localStorage.getItem(STORAGE_USERS) || '{}');
    
    // Check if email already exists
    if (users[email]) {
        return { success: false, message: 'Email already registered. Please login.' };
    }
    
    // Create new user
    const newUser = {
        email: email,
        password: password,
        name: fullName,
        phone: phone || '',
        memberSince: new Date().toISOString()
    };
    
    users[email] = newUser;
    localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
    
    return { success: true, message: 'Account created successfully!' };
}

// Validate login
function validateLogin(email, password) {
    const users = JSON.parse(localStorage.getItem(STORAGE_USERS) || '{}');
    
    if (users[email] && users[email].password === password) {
        return { success: true, user: users[email] };
    }
    
    return { success: false, message: 'Invalid email or password.' };
}

// Session management
function setSession(email) {
    localStorage.setItem(STORAGE_SESSION, JSON.stringify({ email: email, loggedInAt: new Date().toISOString() }));
}

function getSession() {
    const session = localStorage.getItem(STORAGE_SESSION);
    return session ? JSON.parse(session) : null;
}

function clearSession() {
    localStorage.removeItem(STORAGE_SESSION);
}

function isLoggedIn() {
    return getSession() !== null;
}

function getCurrentUser() {
    const session = getSession();
    return session ? session.email : null;
}

function getUserData(email) {
    const users = JSON.parse(localStorage.getItem(STORAGE_USERS) || '{}');
    return users[email] || null;
}

function updateUserInStorage(email, updates) {
    const users = JSON.parse(localStorage.getItem(STORAGE_USERS) || '{}');
    if (users[email]) {
        users[email] = { ...users[email], ...updates };
        localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
    }
}

// ========== UI FUNCTIONS ==========
function showLoginForm() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginError').style.display = 'none';
    document.getElementById('registerError').style.display = 'none';
}

function showRegisterForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('loginError').style.display = 'none';
    document.getElementById('registerError').style.display = 'none';
}

// Handle Registration
window.handleRegister = function() {
    const fullName = document.getElementById('regFullName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    const termsAccepted = document.getElementById('regTerms').checked;
    const errorDiv = document.getElementById('registerError');
    
    // Validation
    if (!fullName) {
        errorDiv.style.display = 'block';
        errorDiv.innerText = 'Please enter your full name.';
        return;
    }
    
    if (!email) {
        errorDiv.style.display = 'block';
        errorDiv.innerText = 'Please enter your email address.';
        return;
    }
    
    if (!email.includes('@') || !email.includes('.')) {
        errorDiv.style.display = 'block';
        errorDiv.innerText = 'Please enter a valid email address.';
        return;
    }
    
    if (!password) {
        errorDiv.style.display = 'block';
        errorDiv.innerText = 'Please enter a password.';
        return;
    }
    
    if (password.length < 6) {
        errorDiv.style.display = 'block';
        errorDiv.innerText = 'Password must be at least 6 characters long.';
        return;
    }
    
    if (password !== confirmPassword) {
        errorDiv.style.display = 'block';
        errorDiv.innerText = 'Passwords do not match.';
        return;
    }
    
    if (!termsAccepted) {
        errorDiv.style.display = 'block';
        errorDiv.innerText = 'Please accept the Terms of Service and Privacy Policy.';
        return;
    }
    
    const result = registerUser(fullName, email, password, phone);
    
    if (result.success) {
        errorDiv.style.display = 'block';
        errorDiv.className = 'success-message';
        errorDiv.innerText = result.message + ' Redirecting to login...';
        
        setTimeout(() => {
            showLoginForm();
            document.getElementById('loginEmail').value = email;
            document.getElementById('loginPassword').value = '';
            errorDiv.className = 'error-message';
            errorDiv.style.display = 'none';
        }, 2000);
    } else {
        errorDiv.style.display = 'block';
        errorDiv.className = 'error-message';
        errorDiv.innerText = result.message;
    }
};

// Handle Login
window.handleLogin = function() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');
    
    if (!email || !password) {
        errorDiv.style.display = 'block';
        errorDiv.innerText = 'Please enter both email and password.';
        return;
    }
    
    const result = validateLogin(email, password);
    
    if (result.success) {
        setSession(email);
        errorDiv.style.display = 'none';
        document.getElementById('authContainer').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        updateUserUI(email);
        
        if (window.libraryCore) {
            window.libraryCore.loadDataForUser(email);
            if (window.libraryUI) window.libraryUI.render();
        }
        navigateToPage('home');
        addNotification(`Welcome back, ${result.user.name || email.split('@')[0]}!`);
    } else {
        errorDiv.style.display = 'block';
        errorDiv.innerText = result.message || 'Login failed. Please try again.';
    }
};

window.handleLogout = function() {
    clearSession();
    document.getElementById('authContainer').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('loginEmail').value = 'admin@librisflow.com';
    document.getElementById('loginPassword').value = '';
    document.getElementById('loginError').style.display = 'none';
};

function updateUserUI(email) {
    const userData = getUserData(email);
    const userName = userData?.name || email.split('@')[0];
    const displayName = userName.charAt(0).toUpperCase() + userName.slice(1);
    document.getElementById('userName').innerText = displayName;
    document.getElementById('userEmail').innerText = email;
    document.getElementById('userAvatar').innerText = userName.charAt(0).toUpperCase();
}

// Notification System
function addNotification(message) {
    notificationCount++;
    const badge = document.getElementById('notificationBadge');
    if (badge) badge.innerText = notificationCount;
    
    const notifList = document.getElementById('notificationList');
    if (notifList) {
        const notif = document.createElement('div');
        notif.className = 'notification-item';
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        notif.innerHTML = `
            <i class="fas fa-bell"></i>
            <div class="notif-content">
                <p>${message}</p>
                <span class="notif-time">${timeString}</span>
            </div>
        `;
        notifList.insertBefore(notif, notifList.firstChild);
        
        while (notifList.children.length > 11) {
            notifList.removeChild(notifList.lastChild);
        }
    }
}

function clearAllNotifications() {
    const notifList = document.getElementById('notificationList');
    if (notifList) {
        while (notifList.children.length > 1) {
            notifList.removeChild(notifList.lastChild);
        }
        notificationCount = 0;
        document.getElementById('notificationBadge').innerText = '0';
        addNotification('Welcome to LibrisFlow Pro!');
    }
}

function showToast(message, bgColor = '#667eea') {
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.style.backgroundColor = bgColor;
    toast.innerHTML = `<i class="fas fa-bell"></i> ${message}`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 2800);
}

// Profile Modal Functions
function showProfileModal() {
    const userEmail = getCurrentUser();
    const userData = getUserData(userEmail);
    document.getElementById('profileName').value = userData?.name || '';
    document.getElementById('profileEmail').value = userEmail;
    document.getElementById('profilePhone').value = userData?.phone || '';
    const memberDate = userData?.memberSince ? new Date(userData.memberSince).toLocaleDateString() : 'Today';
    document.getElementById('profileMemberSince').value = memberDate;
    document.getElementById('profileAvatar').innerText = (userData?.name?.charAt(0) || userEmail.charAt(0)).toUpperCase();
    document.getElementById('profileModal').classList.add('active');
}

function closeProfileModal() {
    document.getElementById('profileModal').classList.remove('active');
}

function updateProfile() {
    const userEmail = getCurrentUser();
    const newName = document.getElementById('profileName').value;
    const newPhone = document.getElementById('profilePhone').value;
    
    if (newName.trim()) {
        updateUserInStorage(userEmail, { name: newName.trim(), phone: newPhone });
        updateUserUI(userEmail);
        showToast('Profile updated successfully!', '#10b981');
    }
    closeProfileModal();
}

function showFeatures() {
    showToast('✨ Premium features coming soon!', '#667eea');
}

function showSupport() {
    showToast('📧 Contact support@librisflow.com for assistance', '#667eea');
}

function showTerms() {
    showToast('📜 Terms of Service: Use responsibly. Books must be returned within 30 days.', '#667eea');
}

function showPrivacy() {
    showToast('🔒 We value your privacy. Your data is securely stored locally.', '#667eea');
}

function subscribeNewsletter() {
    const email = document.getElementById('newsletterEmail').value;
    if (email && email.includes('@')) {
        showToast(`📧 Subscribed! Check your email ${email}`, '#10b981');
        document.getElementById('newsletterEmail').value = '';
    } else {
        showToast('Please enter a valid email address', '#ef4444');
    }
}

// ========== PAGE RENDERING FUNCTIONS ==========
function renderHomePage() {
    return `
        <div class="welcome-banner">
            <h1><i class="fas fa-book-open"></i> Welcome to Library Management</h1>
            <p>Your complete solution for modern library management</p>
        </div>
        
        <div class="stats-grid-home">
            <div class="stat-card-home">
                <i class="fas fa-book"></i>
                <div class="stat-number-home" id="homeTotalBooks">0</div>
                <div>Total Books</div>
            </div>
            <div class="stat-card-home">
                <i class="fas fa-check-circle"></i>
                <div class="stat-number-home" id="homeAvailableBooks">0</div>
                <div>Available Books</div>
            </div>
            <div class="stat-card-home">
                <i class="fas fa-exchange-alt"></i>
                <div class="stat-number-home" id="homeBorrowedBooks">0</div>
                <div>Borrowed Books</div>
            </div>
        </div>
        
        <div class="quick-actions">
            <div class="action-card" onclick="navigateToPage('library')">
                <i class="fas fa-plus-circle"></i>
                <h3>Add New Book</h3>
                <p>Add books to your library collection</p>
            </div>
            <div class="action-card" onclick="navigateToPage('library')">
                <i class="fas fa-hand-holding-heart"></i>
                <h3>Borrow / Return</h3>
                <p>Manage book borrowings and returns</p>
            </div>
            <div class="action-card" onclick="navigateToPage('library')">
                <i class="fas fa-search"></i>
                <h3>Search Books</h3>
                <p>Find books by title, author or ISBN</p>
            </div>
        </div>
        
        <div class="recent-books">
            <h2><i class="fas fa-clock"></i> Recently Added Books</h2>
            <div class="recent-books-list" id="recentBooksList">
                <p style="color:#64748b;">Loading...</p>
            </div>
        </div>
    `;
}

function renderAboutPage() {
    return `
        <div class="about-section">
            <h2><i class="fas fa-info-circle"></i> About LibrisFlow Pro</h2>
            <p>LibrisFlow Pro is a cutting-edge Library Management System designed to modernize and simplify library operations. Built with modern web technologies, it provides an intuitive interface for librarians and patrons alike.</p>
            <p>Our mission is to make library management accessible, efficient, and enjoyable. Whether you're managing a small community library or a large academic institution, LibrisFlow Pro scales to meet your needs.</p>
            <div class="stats-showcase">
                <div class="stat-item">
                    <div class="number">500+</div>
                    <p>Active Libraries</p>
                </div>
                <div class="stat-item">
                    <div class="number">10K+</div>
                    <p>Books Managed</p>
                </div>
                <div class="stat-item">
                    <div class="number">24/7</div>
                    <p>Support Available</p>
                </div>
            </div>
            <h2><i class="fas fa-code"></i> Technologies Used</h2>
            <p>HTML5, CSS3, JavaScript (ES6+), LocalStorage for persistent data, Font Awesome icons, and responsive design principles.</p>
            <br>
            <h2><i class="fas fa-users"></i> Our Team</h2>
            <p>Dedicated developers and library science experts working together to create the best library management experience.</p>
        </div>
    `;
}

function renderLibraryPage() {
    return `
        <div class="library-section">
            <div class="stats-grid" id="statsDashboard">
                <div class="stat-card">
                    <div class="stat-number" id="totalBooks">0</div>
                    <div>Total Books</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="availableBooks">0</div>
                    <div>Available</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="borrowedBooks">0</div>
                    <div>Borrowed</div>
                </div>
            </div>
            
            <div class="add-card">
                <h3><i class="fas fa-plus-circle"></i> Add New Book</h3>
                <div class="form-row">
                    <div class="input-field">
                        <input type="text" id="titleInput" placeholder="Book Title *">
                    </div>
                    <div class="input-field">
                        <input type="text" id="authorInput" placeholder="Author *">
                    </div>
                    <div class="input-field">
                        <input type="text" id="isbnInput" placeholder="ISBN">
                    </div>
                    <div>
                        <button class="btn-primary" id="addBookBtn"><i class="fas fa-save"></i> Add Book</button>
                    </div>
                </div>
            </div>
            
            <div class="controls-bar">
                <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input type="text" id="searchInput" placeholder="Search books...">
                </div>
                <select id="filterSelect">
                    <option value="all">All Books</option>
                    <option value="available">Available</option>
                    <option value="borrowed">Borrowed</option>
                </select>
                <button class="btn-primary" id="resetDemoBtn" style="background:#64748b;"><i class="fas fa-undo-alt"></i> Reset Demo</button>
            </div>
            
            <div class="books-table-wrapper">
                <table>
                    <thead>
                        <tr><th>Title</th><th>Author</th><th>ISBN</th><th>Status</th><th>Actions</th></tr>
                    </thead>
                    <tbody id="booksTableBody">
                        <tr><td colspan="5" style="text-align:center;">Loading library...<\/td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ========== NAVIGATION ==========
window.navigateToPage = function(page) {
    document.querySelectorAll('.nav-link-custom').forEach(link => {
        if (link.getAttribute('data-page') === page) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    const contentDiv = document.getElementById('pageContent');
    if (page === 'home') {
        contentDiv.innerHTML = renderHomePage();
        setTimeout(() => updateHomePageStats(), 50);
    } else if (page === 'about') {
        contentDiv.innerHTML = renderAboutPage();
    } else if (page === 'library') {
        contentDiv.innerHTML = renderLibraryPage();
        setTimeout(() => {
            if (window.libraryUI) {
                window.libraryUI.initElements();
                window.libraryUI.bindEvents();
                window.libraryUI.render();
            }
        }, 50);
    }
    
    const navMenu = document.getElementById('navMenu');
    if (navMenu) navMenu.classList.remove('active');
};

function updateHomePageStats() {
    if (!window.libraryCore) return;
    const books = window.libraryCore.getAll();
    const total = books.length;
    const available = books.filter(b => b.status === 'available').length;
    const borrowed = total - available;
    
    const totalEl = document.getElementById('homeTotalBooks');
    const availEl = document.getElementById('homeAvailableBooks');
    const borrowEl = document.getElementById('homeBorrowedBooks');
    
    if (totalEl) totalEl.innerText = total;
    if (availEl) availEl.innerText = available;
    if (borrowEl) borrowEl.innerText = borrowed;
    
    const recentList = document.getElementById('recentBooksList');
    if (recentList) {
        const recentBooks = [...books].reverse().slice(0, 5);
        if (recentBooks.length === 0) {
            recentList.innerHTML = '<p style="color:#64748b; text-align:center;">No books in library yet. Add some books!</p>';
        } else {
            recentList.innerHTML = recentBooks.map(book => `
                <div class="recent-book-item">
                    <div>
                        <strong>${escapeHtml(book.title)}</strong><br>
                        <small>${escapeHtml(book.author)}</small>
                    </div>
                    <span class="book-status ${book.status === 'available' ? 'status-avail' : 'status-borrow'}">
                        ${book.status === 'available' ? '✓ Available' : '📖 Borrowed'}
                    </span>
                </div>
            `).join('');
        }
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

function closeMobileSearch() {
    document.getElementById('mobileSearchBar').classList.remove('active');
}

// ========== LIBRARY CORE CLASS ==========
class LibraryCore {
    constructor(userEmail) {
        this.userEmail = userEmail;
        this.books = [];
        this.loadDataForUser(userEmail);
    }
    
    getStorageKey() {
        return `librisflow_books_${this.userEmail}`;
    }
    
    loadDataForUser(email) {
        this.userEmail = email;
        const key = this.getStorageKey();
        const saved = localStorage.getItem(key);
        
        if (saved && JSON.parse(saved).length > 0) {
            this.books = JSON.parse(saved);
        } else {
            this.books = [
                { id: this.generateId(), title: "The Psychology of Money", author: "Morgan Housel", isbn: "978-0857197689", status: "available", addedAt: new Date().toISOString() },
                { id: this.generateId(), title: "Thinking, Fast and Slow", author: "Daniel Kahneman", isbn: "978-0374533557", status: "borrowed", addedAt: new Date().toISOString() },
                { id: this.generateId(), title: "Sapiens", author: "Yuval Noah Harari", isbn: "978-0062316097", status: "available", addedAt: new Date().toISOString() },
                { id: this.generateId(), title: "The Alchemist", author: "Paulo Coelho", isbn: "978-0062502174", status: "available", addedAt: new Date().toISOString() },
                { id: this.generateId(), title: "Educated", author: "Tara Westover", isbn: "978-0399590504", status: "borrowed", addedAt: new Date().toISOString() }
            ];
            this.persist();
        }
    }
    
    generateId() {
        return 'book_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
    }
    
    persist() {
        localStorage.setItem(this.getStorageKey(), JSON.stringify(this.books));
    }
    
    getAll() {
        return [...this.books];
    }
    
    addBook({ title, author, isbn }) {
        if (!title.trim() || !author.trim()) {
            return { success: false, message: "Title and Author are required!" };
        }
        
        const newBook = {
            id: this.generateId(),
            title: title.trim(),
            author: author.trim(),
            isbn: isbn && isbn.trim() ? isbn.trim() : "N/A",
            status: "available",
            addedAt: new Date().toISOString()
        };
        
        this.books.unshift(newBook);
        this.persist();
        addNotification(`📚 "${title.trim()}" added to library`);
        return { success: true, book: newBook };
    }
    
    borrowBook(id) {
        const book = this.books.find(b => b.id === id);
        if (!book) return { success: false, message: "Book not found" };
        if (book.status === "borrowed") return { success: false, message: "Already borrowed" };
        
        book.status = "borrowed";
        this.persist();
        addNotification(`📖 "${book.title}" has been borrowed`);
        return { success: true, book };
    }
    
    returnBook(id) {
        const book = this.books.find(b => b.id === id);
        if (!book) return { success: false, message: "Book not found" };
        if (book.status === "available") return { success: false, message: "Already available" };
        
        book.status = "available";
        this.persist();
        addNotification(`🔄 "${book.title}" has been returned`);
        return { success: true, book };
    }
    
    deleteBook(id) {
        const index = this.books.findIndex(b => b.id === id);
        if (index === -1) return { success: false, message: "Book not found" };
        
        const deleted = this.books[index];
        this.books.splice(index, 1);
        this.persist();
        addNotification(`🗑️ "${deleted.title}" removed from library`);
        return { success: true, book: deleted };
    }
    
    resetToDemo() {
        this.books = [
            { id: this.generateId(), title: "The Psychology of Money", author: "Morgan Housel", isbn: "978-0857197689", status: "available", addedAt: new Date().toISOString() },
            { id: this.generateId(), title: "Thinking, Fast and Slow", author: "Daniel Kahneman", isbn: "978-0374533557", status: "borrowed", addedAt: new Date().toISOString() },
            { id: this.generateId(), title: "Sapiens", author: "Yuval Noah Harari", isbn: "978-0062316097", status: "available", addedAt: new Date().toISOString() },
            { id: this.generateId(), title: "The Alchemist", author: "Paulo Coelho", isbn: "978-0062502174", status: "available", addedAt: new Date().toISOString() },
            { id: this.generateId(), title: "Educated", author: "Tara Westover", isbn: "978-0399590504", status: "borrowed", addedAt: new Date().toISOString() }
        ];
        this.persist();
        addNotification("Demo library data restored");
        return true;
    }
}

// ========== LIBRARY UI CLASS ==========
class LibraryUI {
    constructor(core) {
        this.core = core;
        this.filterValue = "all";
        this.searchTerm = "";
        this.initElements();
        this.bindEvents();
        this.render();
    }
    
    initElements() {
        this.tableBody = document.getElementById('booksTableBody');
        this.totalSpan = document.getElementById('totalBooks');
        this.availableSpan = document.getElementById('availableBooks');
        this.borrowedSpan = document.getElementById('borrowedBooks');
        this.searchInput = document.getElementById('searchInput');
        this.filterSelect = document.getElementById('filterSelect');
        this.addBtn = document.getElementById('addBookBtn');
        this.resetBtn = document.getElementById('resetDemoBtn');
        this.titleInp = document.getElementById('titleInput');
        this.authorInp = document.getElementById('authorInput');
        this.isbnInp = document.getElementById('isbnInput');
    }
    
    bindEvents() {
        if (this.addBtn) {
            this.addBtn.addEventListener('click', () => this.handleAdd());
        }
        
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.toLowerCase();
                this.render();
            });
        }
        
        if (this.filterSelect) {
            this.filterSelect.addEventListener('change', (e) => {
                this.filterValue = e.target.value;
                this.render();
            });
        }
        
        if (this.resetBtn) {
            this.resetBtn.addEventListener('click', () => {
                if (confirm('Reset to demo collection? All current books will be lost.')) {
                    this.core.resetToDemo();
                    showToast('Demo library restored!', '#667eea');
                    this.render();
                }
            });
        }
    }
    
    getFilteredBooks() {
        let books = this.core.getAll();
        
        if (this.filterValue !== 'all') {
            books = books.filter(b => b.status === this.filterValue);
        }
        
        if (this.searchTerm) {
            books = books.filter(b => 
                b.title.toLowerCase().includes(this.searchTerm) ||
                b.author.toLowerCase().includes(this.searchTerm) ||
                b.isbn.toLowerCase().includes(this.searchTerm)
            );
        }
        
        return books;
    }
    
    updateStats() {
        const all = this.core.getAll();
        const total = all.length;
        const available = all.filter(b => b.status === 'available').length;
        const borrowed = total - available;
        
        if (this.totalSpan) this.totalSpan.innerText = total;
        if (this.availableSpan) this.availableSpan.innerText = available;
        if (this.borrowedSpan) this.borrowedSpan.innerText = borrowed;
        
        if (typeof updateHomePageStats === 'function') {
            updateHomePageStats();
        }
    }
    
    render() {
        const filtered = this.getFilteredBooks();
        this.updateStats();
        
        if (!this.tableBody) return;
        
        if (filtered.length === 0) {
            this.tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:2rem;">No books found. Add your first book!<\/td><\/tr>`;
            return;
        }
        
        let html = '';
        filtered.forEach(book => {
            const statusClass = book.status === 'available' ? 'badge-available' : 'badge-borrowed';
            html += `
                <tr>
                    <td><strong>${escapeHtml(book.title)}</strong></td>
                    <td>${escapeHtml(book.author)}</td>
                    <td><code>${escapeHtml(book.isbn)}</code></td>
                    <td><span class="badge ${statusClass}">${book.status === 'available' ? '✓ Available' : '📖 Borrowed'}</span></td>
                    <td class="action-group">
                        ${book.status === 'available' ? 
                            `<button class="action-btn borrow" data-action="borrow" data-id="${book.id}"><i class="fas fa-hand-holding-heart"></i> Borrow</button>` : 
                            `<button class="action-btn return" data-action="return" data-id="${book.id}"><i class="fas fa-undo-alt"></i> Return</button>`
                        }
                        <button class="action-btn delete" data-action="delete" data-id="${book.id}"><i class="fas fa-trash-alt"></i> Delete</button>
                    </td>
                <\/tr>
            `;
        });
        
        this.tableBody.innerHTML = html;
        
        document.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.getAttribute('data-action');
                const id = btn.getAttribute('data-id');
                
                if (action === 'borrow') this.handleBorrow(id);
                else if (action === 'return') this.handleReturn(id);
                else if (action === 'delete') this.handleDelete(id);
            });
        });
    }
    
    handleBorrow(id) {
        const result = this.core.borrowBook(id);
        if (result.success) {
            showToast(`📖 "${result.book.title}" borrowed!`, '#667eea');
            this.render();
        } else {
            showToast(result.message, '#ef4444');
        }
    }
    
    handleReturn(id) {
        const result = this.core.returnBook(id);
        if (result.success) {
            showToast(`🔄 "${result.book.title}" returned!`, '#10b981');
            this.render();
        } else {
            showToast(result.message, '#ef4444');
        }
    }
    
    handleDelete(id) {
        const book = this.core.getAll().find(b => b.id === id);
        if (book && confirm(`Delete "${book.title}" permanently?`)) {
            const result = this.core.deleteBook(id);
            if (result.success) {
                showToast(`🗑️ "${result.book.title}" removed`, '#64748b');
                this.render();
            }
        }
    }
    
    handleAdd() {
        const title = this.titleInp?.value;
        const author = this.authorInp?.value;
        const isbn = this.isbnInp?.value;
        
        const result = this.core.addBook({ title, author, isbn });
        
        if (result.success) {
            showToast(`✨ "${result.book.title}" added to library!`, '#667eea');
            if (this.titleInp) this.titleInp.value = '';
            if (this.authorInp) this.authorInp.value = '';
            if (this.isbnInp) this.isbnInp.value = '';
            this.render();
        } else {
            showToast(result.message, '#ef4444');
        }
    }
}

// ========== EVENT LISTENERS ==========
document.addEventListener('click', function(e) {
    const userDropdown = document.getElementById('userDropdown');
    const notifBtn = document.getElementById('notificationBtn');
    
    if (userDropdown && !userDropdown.contains(e.target)) {
        userDropdown.classList.remove('active');
    }
    if (notifBtn && !notifBtn.contains(e.target)) {
        notifBtn.classList.remove('active');
    }
});

document.addEventListener('DOMContentLoaded', function() {
    // Navbar toggle for mobile
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }
    
    // User dropdown toggle
    const userProfile = document.querySelector('.user-profile');
    if (userProfile) {
        userProfile.addEventListener('click', function(e) {
            e.stopPropagation();
            document.getElementById('userDropdown').classList.toggle('active');
        });
    }
    
    // Notification toggle
    const notifBtn = document.getElementById('notificationBtn');
    if (notifBtn) {
        notifBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            notifBtn.classList.toggle('active');
        });
    }
    
    // Search toggle for mobile
    const searchToggleBtn = document.getElementById('searchToggleBtn');
    const mobileSearchBar = document.getElementById('mobileSearchBar');
    const mobileSearchInput = document.getElementById('mobileSearchInput');
    
    if (searchToggleBtn) {
        searchToggleBtn.addEventListener('click', () => {
            mobileSearchBar.classList.toggle('active');
            if (mobileSearchBar.classList.contains('active')) {
                mobileSearchInput.focus();
            }
        });
    }
    
    if (mobileSearchInput) {
        mobileSearchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            if (window.libraryUI) {
                window.libraryUI.searchTerm = searchTerm;
                window.libraryUI.render();
            }
        });
    }
    
    // Modal close on outside click
    const modal = document.getElementById('profileModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeProfileModal();
            }
        });
    }
});

// ========== INITIALIZE APPLICATION ==========
initUsers();

if (isLoggedIn()) {
    const userEmail = getCurrentUser();
    window.libraryCore = new LibraryCore(userEmail);
    window.libraryUI = new LibraryUI(window.libraryCore);
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    updateUserUI(userEmail);
    navigateToPage('home');
} else {
    document.getElementById('authContainer').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('loginEmail').value = 'admin@librisflow.com';
    document.getElementById('loginPassword').value = '';
}