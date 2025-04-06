// Initialize the database connection
document.addEventListener('DOMContentLoaded', () => {
    Database.connect();
    loadDashboardStats();
    setupNavigation();
    setupEventListeners();
});

// Navigation
function setupNavigation() {
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = link.getAttribute('data-page');
            showPage(targetPage);
            updateActiveNav(link);
        });
    });
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
}

function updateActiveNav(activeLink) {
    document.querySelectorAll('nav a').forEach(link => {
        link.classList.remove('active');
    });
    activeLink.classList.add('active');
}

// Dashboard
async function loadDashboardStats() {
    const books = await Database.getBooks();
    const members = await Database.getMembers();
    const transactions = await Database.getTransactions();
    const borrowedBooks = transactions.filter(t => t.status === 'Borrowed').length;

    document.getElementById('total-books').textContent = books.length;
    document.getElementById('total-members').textContent = members.length;
    document.getElementById('books-borrowed').textContent = borrowedBooks;
}

// Event Listeners
function setupEventListeners() {
    // Books
    document.getElementById('add-book-btn').addEventListener('click', showAddBookModal);
    document.getElementById('book-search').addEventListener('input', handleBookSearch);

    // Members
    document.getElementById('add-member-btn').addEventListener('click', showAddMemberModal);
    document.getElementById('member-search').addEventListener('input', handleMemberSearch);

    // Transactions
    document.getElementById('new-transaction-btn').addEventListener('click', showNewTransactionModal);
    document.getElementById('transaction-search').addEventListener('input', handleTransactionSearch);

    // Modal
    document.querySelector('.modal .close').addEventListener('click', closeModal);
}

// Modal Functions
function showModal(content) {
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = content;
    modal.style.display = 'block';
}

function closeModal() {
    const modal = document.getElementById('modal');
    modal.style.display = 'none';
}

// Books Functions
function showAddBookModal() {
    const content = `
        <h2>Add New Book</h2>
        <form id="add-book-form">
            <div class="form-group">
                <label for="title">Title</label>
                <input type="text" id="title" required>
            </div>
            <div class="form-group">
                <label for="author">Author</label>
                <input type="text" id="author" required>
            </div>
            <div class="form-group">
                <label for="category">Category</label>
                <input type="text" id="category" required>
            </div>
            <div class="form-actions">
                <button type="button" onclick="closeModal()">Cancel</button>
                <button type="submit">Add Book</button>
            </div>
        </form>
    `;
    showModal(content);

    document.getElementById('add-book-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const book = {
            title: document.getElementById('title').value,
            author: document.getElementById('author').value,
            category: document.getElementById('category').value,
            status: 'Available'
        };
        await Database.addBook(book);
        closeModal();
        loadBooks();
        loadDashboardStats();
    });
}

async function loadBooks() {
    const books = await Database.getBooks();
    const tbody = document.querySelector('#books-table tbody');
    tbody.innerHTML = books.map(book => `
        <tr>
            <td>${book.id}</td>
            <td>${book.title}</td>
            <td>${book.author}</td>
            <td>${book.category}</td>
            <td>${book.status}</td>
            <td>
                <button onclick="editBook(${book.id})">Edit</button>
                <button onclick="deleteBook(${book.id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

async function handleBookSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const books = await Database.getBooks();
    const filteredBooks = books.filter(book => 
        book.title.toLowerCase().includes(searchTerm) ||
        book.author.toLowerCase().includes(searchTerm) ||
        book.category.toLowerCase().includes(searchTerm)
    );
    
    const tbody = document.querySelector('#books-table tbody');
    tbody.innerHTML = filteredBooks.map(book => `
        <tr>
            <td>${book.id}</td>
            <td>${book.title}</td>
            <td>${book.author}</td>
            <td>${book.category}</td>
            <td>${book.status}</td>
            <td>
                <button onclick="editBook(${book.id})">Edit</button>
                <button onclick="deleteBook(${book.id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

// Members Functions
function showAddMemberModal() {
    const content = `
        <h2>Add New Member</h2>
        <form id="add-member-form">
            <div class="form-group">
                <label for="name">Name</label>
                <input type="text" id="name" required>
            </div>
            <div class="form-group">
                <label for="email">Email</label>
                <input type="email" id="email" required>
            </div>
            <div class="form-group">
                <label for="phone">Phone</label>
                <input type="tel" id="phone" required>
            </div>
            <div class="form-actions">
                <button type="button" onclick="closeModal()">Cancel</button>
                <button type="submit">Add Member</button>
            </div>
        </form>
    `;
    showModal(content);

    document.getElementById('add-member-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const member = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value
        };
        await Database.addMember(member);
        closeModal();
        loadMembers();
        loadDashboardStats();
    });
}

async function loadMembers() {
    const members = await Database.getMembers();
    const tbody = document.querySelector('#members-table tbody');
    tbody.innerHTML = members.map(member => `
        <tr>
            <td>${member.id}</td>
            <td>${member.name}</td>
            <td>${member.email}</td>
            <td>${member.phone}</td>
            <td>
                <button onclick="editMember(${member.id})">Edit</button>
                <button onclick="deleteMember(${member.id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

// Transactions Functions
async function showNewTransactionModal() {
    const books = await Database.getBooks();
    const members = await Database.getMembers();
    
    const content = `
        <h2>New Transaction</h2>
        <form id="new-transaction-form">
            <div class="form-group">
                <label for="book">Book</label>
                <select id="book" required>
                    <option value="">Select a book</option>
                    ${books
                        .filter(book => book.status === 'Available')
                        .map(book => `<option value="${book.id}">${book.title}</option>`)
                        .join('')}
                </select>
            </div>
            <div class="form-group">
                <label for="member">Member</label>
                <select id="member" required>
                    <option value="">Select a member</option>
                    ${members.map(member => `<option value="${member.id}">${member.name}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label for="dueDate">Due Date</label>
                <input type="date" id="dueDate" required>
            </div>
            <div class="form-actions">
                <button type="button" onclick="closeModal()">Cancel</button>
                <button type="submit">Create Transaction</button>
            </div>
        </form>
    `;
    showModal(content);

    document.getElementById('new-transaction-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const transaction = {
            bookId: document.getElementById('book').value,
            memberId: document.getElementById('member').value,
            dueDate: document.getElementById('dueDate').value
        };
        await Database.addTransaction(transaction);
        await Database.updateBook(parseInt(transaction.bookId), { status: 'Borrowed' });
        closeModal();
        loadTransactions();
        loadDashboardStats();
    });
}

async function loadTransactions() {
    const transactions = await Database.getTransactions();
    const books = await Database.getBooks();
    const members = await Database.getMembers();
    
    const tbody = document.querySelector('#transactions-table tbody');
    tbody.innerHTML = transactions.map(transaction => {
        const book = books.find(b => b.id === parseInt(transaction.bookId));
        const member = members.find(m => m.id === parseInt(transaction.memberId));
        
        return `
            <tr>
                <td>${transaction.id}</td>
                <td>${book ? book.title : 'N/A'}</td>
                <td>${member ? member.name : 'N/A'}</td>
                <td>${new Date(transaction.issueDate).toLocaleDateString()}</td>
                <td>${new Date(transaction.dueDate).toLocaleDateString()}</td>
                <td>${transaction.status}</td>
                <td>
                    ${transaction.status === 'Borrowed' ? 
                        `<button onclick="returnBook(${transaction.id}, ${transaction.bookId})">Return</button>` : 
                        ''}
                </td>
            </tr>
        `;
    }).join('');
}

async function returnBook(transactionId, bookId) {
    await Database.returnBook(transactionId);
    await Database.updateBook(bookId, { status: 'Available' });
    loadTransactions();
    loadDashboardStats();
}

// Initial load
loadBooks();
loadMembers();
loadTransactions(); 