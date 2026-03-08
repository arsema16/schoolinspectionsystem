// Infrastructure Inspection JavaScript

const API_BASE = '/api';
let authToken = localStorage.getItem('token');
let userRole = localStorage.getItem('role');
let facilities = [];

// Check authentication
if (!authToken) {
    window.location.href = '/login.html';
}

// Debug logging
console.log('=== Infrastructure Page Loaded ===');
console.log('Auth Token:', authToken ? 'Present' : 'Missing');
console.log('User Role:', userRole);
console.log('Role Type:', typeof userRole);

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    console.log('Page loaded, user role:', userRole);
    displayUserInfo();
    showAdminElements();
    loadFacilities();
    
    // Set up book search and filter listeners
    const bookSearch = document.getElementById('bookSearch');
    const categoryFilter = document.getElementById('categoryFilter');
    
    if (bookSearch) {
        bookSearch.addEventListener('input', filterBooks);
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterBooks);
    }
    
    // Load library books
    loadLibraryBooks();
    
    // Initialize overview section
    setTimeout(() => {
        loadOverviewDetails();
    }, 500);
});

// Display user information
function displayUserInfo() {
    const roleElement = document.getElementById('userRole');
    if (roleElement && userRole) {
        roleElement.textContent = userRole;
    }
}

// Show admin-only elements
function showAdminElements() {
    const isAdmin = (userRole === 'Admin');
    console.log('=== Show Admin Elements ===');
    console.log('Is Admin:', isAdmin);
    
    if (isAdmin) {
        // Show all Add buttons
        const addButtons = document.querySelectorAll('.btn-add');
        addButtons.forEach(button => {
            button.style.display = 'inline-block';
        });
        console.log('Add buttons shown:', addButtons.length);
        
        // Show all Actions column headers
        const actionsHeaders = document.querySelectorAll('th.admin-only');
        actionsHeaders.forEach(header => {
            header.style.display = 'table-cell';
        });
        console.log('Actions headers shown:', actionsHeaders.length);
    } else {
        // Hide admin elements
        const addButtons = document.querySelectorAll('.btn-add');
        addButtons.forEach(button => {
            button.style.display = 'none';
        });
        
        const actionsHeaders = document.querySelectorAll('th.admin-only');
        actionsHeaders.forEach(header => {
            header.style.display = 'none';
        });
    }
}

// Load facilities from API or localStorage
async function loadFacilities() {
    console.log('Loading facilities...');
    
    try {
        // First check localStorage
        const stored = localStorage.getItem('schoolFacilities');
        console.log('localStorage data:', stored);
        
        if (stored) {
            try {
                facilities = JSON.parse(stored);
                console.log('Loaded from localStorage:', facilities.length, 'facilities');
            } catch (parseError) {
                console.error('Error parsing localStorage:', parseError);
                facilities = getDefaultFacilities();
                saveFacilitiesToStorage();
            }
        } else {
            // Initialize with default data
            console.log('No data in localStorage, loading defaults');
            facilities = getDefaultFacilities();
            saveFacilitiesToStorage();
            console.log('Saved default facilities:', facilities.length);
        }

        console.log('Facilities array:', facilities);
        renderFacilities();
        updateStatistics();
        
    } catch (error) {
        console.error('Error loading facilities:', error);
        // Fallback to default data
        facilities = getDefaultFacilities();
        saveFacilitiesToStorage();
        renderFacilities();
        updateStatistics();
    }
}

// Get default facilities data
function getDefaultFacilities() {
    return [
        { id: '1', name: 'Library', area: 10, capacity: 30, condition: 'Good', computers: 0, notes: '', type: 'library' },
        { id: '2', name: 'Laboratory', area: 62, capacity: 40, condition: 'Good', computers: 0, notes: '', type: 'laboratory' },
        { id: '3', name: 'Learning Class', area: 56, capacity: 45, condition: 'Good', computers: 0, notes: '', type: 'classroom' },
        { id: '4', name: 'Pedagogue Center', area: 72, capacity: 50, condition: 'Good', computers: 0, notes: '', type: 'special' },
        { id: '5', name: 'Vice Office', area: 16, capacity: 5, condition: 'Good', computers: 1, notes: '', type: 'office' },
        { id: '6', name: 'Secretary Office', area: 20, capacity: 3, condition: 'Good', computers: 1, notes: '', type: 'office' },
        { id: '7', name: 'Staff Room', area: 52, capacity: 20, condition: 'Good', computers: 0, notes: '', type: 'staff' },
        { id: '8', name: 'IT Library', area: 48, capacity: 30, condition: 'Good', computers: 26, notes: '26 computers available', type: 'computer-lab' }
    ];
}

// Educational standards for facilities (Ethiopian Ministry of Education standards)
function getStandards() {
    return {
        classroom: {
            minArea: 49, // 7m x 7m = 49 sqm minimum
            maxStudents: 40, // Maximum 40 students per class
            areaPerStudent: 1.2, // 1.2 sqm per student minimum
            description: 'Standard classroom'
        },
        laboratory: {
            minArea: 84, // 12m x 7m = 84 sqm minimum
            maxStudents: 40,
            areaPerStudent: 2.1, // 2.1 sqm per student in lab
            description: 'Science laboratory'
        },
        library: {
            minArea: 100, // Minimum 100 sqm for school library
            seatsPerStudent: 0.1, // 10% of total students should have seats
            description: 'School library'
        },
        'computer-lab': {
            minArea: 84, // Same as laboratory
            maxStudents: 40,
            computersPerStudent: 0.5, // 1 computer per 2 students minimum
            description: 'Computer laboratory'
        },
        office: {
            minArea: 12, // Minimum 12 sqm for office
            description: 'Administrative office'
        },
        staff: {
            minArea: 40, // Minimum 40 sqm for staff room
            description: 'Staff/Teachers room'
        },
        special: {
            minArea: 49, // Same as classroom
            description: 'Special purpose room'
        }
    };
}

// Save facilities to localStorage
function saveFacilitiesToStorage() {
    localStorage.setItem('schoolFacilities', JSON.stringify(facilities));
}

// Check if facility meets standards
function checkCompliance(facility) {
    // Ensure facility has a type, assign default based on name if missing
    if (!facility.type) {
        const name = facility.name.toLowerCase();
        if (name.includes('library') && name.includes('it')) {
            facility.type = 'computer-lab';
        } else if (name.includes('library')) {
            facility.type = 'library';
        } else if (name.includes('lab')) {
            facility.type = 'laboratory';
        } else if (name.includes('class')) {
            facility.type = 'classroom';
        } else if (name.includes('office')) {
            facility.type = 'office';
        } else if (name.includes('staff')) {
            facility.type = 'staff';
        } else {
            facility.type = 'special';
        }
    }

    const standards = getStandards();
    const standard = standards[facility.type] || standards.special;
    const issues = [];
    let compliant = true;

    // Check area
    if (standard.minArea && facility.area < standard.minArea) {
        issues.push(`Area too small (${facility.area} ካሬ < ${standard.minArea} ካሬ required)`);
        compliant = false;
    }

    // Check capacity vs area
    if (standard.areaPerStudent && facility.capacity) {
        const requiredArea = facility.capacity * standard.areaPerStudent;
        if (facility.area < requiredArea) {
            issues.push(`Overcrowded (needs ${requiredArea.toFixed(0)} ካሬ for ${facility.capacity} students)`);
            compliant = false;
        }
    }

    // Check max students
    if (standard.maxStudents && facility.capacity > standard.maxStudents) {
        issues.push(`Too many students (${facility.capacity} > ${standard.maxStudents} max)`);
        compliant = false;
    }

    // Check computers for computer lab
    if (facility.type === 'computer-lab' && standard.computersPerStudent && facility.capacity) {
        const requiredComputers = Math.ceil(facility.capacity * standard.computersPerStudent);
        if (facility.computers < requiredComputers) {
            issues.push(`Not enough computers (${facility.computers} < ${requiredComputers} needed)`);
            compliant = false;
        }
    }

    return { compliant, issues, standard };
}

// Render facilities table
function renderFacilities() {
    const tbody = document.getElementById('facilitiesBody');
    
    // Check if element exists (not all pages have this element)
    if (!tbody) {
        console.log('facilitiesBody element not found - skipping render');
        return;
    }
    
    const isAdmin = (userRole === 'Admin');
    
    console.log('=== Rendering Facilities ===');
    console.log('Facilities count:', facilities.length);
    console.log('Is Admin:', isAdmin);
    
    if (facilities.length === 0) {
        const colspan = isAdmin ? '7' : '6';
        tbody.innerHTML = `
            <tr>
                <td colspan="${colspan}" style="text-align: center; padding: 2rem; color: #999;">
                    No facilities found. ${isAdmin ? 'Click "Add Facility" to add one.' : ''}
                </td>
            </tr>
        `;
        return;
    }

    const rows = facilities.map(facility => {
        const compliance = checkCompliance(facility);
        
        let complianceHTML = '';
        if (compliance.compliant) {
            complianceHTML = `
                <div style="color: #28a745;">
                    <strong>✓ Meets Standards</strong>
                </div>
            `;
        } else {
            complianceHTML = `
                <div style="color: #dc3545;">
                    <strong>✗ Below Standards</strong><br>
                    <small style="color: #666;">
                        ${compliance.issues.map(issue => `• ${issue}`).join('<br>')}
                    </small>
                </div>
            `;
        }

        let row = `
        <tr>
            <td><strong>${facility.name}</strong></td>
            <td>${facility.area} ካሬ</td>
            <td>${facility.capacity || '-'}</td>
            <td>
                <span style="
                    padding: 4px 12px;
                    border-radius: 12px;
                    font-size: 0.85rem;
                    background: ${getConditionColor(facility.condition)};
                    color: white;
                ">
                    ${facility.condition}
                </span>
            </td>
            <td>${facility.computers || 0}</td>
            <td style="min-width: 200px;">${complianceHTML}</td>`;
        
        if (isAdmin) {
            row += `
            <td style="white-space: nowrap;">
                <button class="btn-edit" onclick="editFacility('${facility.id}')">Edit</button>
                <button class="btn-delete" onclick="deleteFacility('${facility.id}')">Delete</button>
            </td>`;
        }
        
        row += `</tr>`;
        return row;
    });
    
    tbody.innerHTML = rows.join('');
    
    console.log('Rendered', facilities.length, 'facilities');
    console.log('Admin buttons included:', isAdmin);
}

// Get condition color
function getConditionColor(condition) {
    const colors = {
        'Excellent': '#28a745',
        'Good': '#17a2b8',
        'Fair': '#ffc107',
        'Poor': '#fd7e14',
        'Critical': '#dc3545'
    };
    return colors[condition] || '#6c757d';
}

// Update statistics
function updateStatistics() {
    const totalFacilities = facilities.length;
    const totalArea = facilities.reduce((sum, f) => sum + (parseFloat(f.area) || 0), 0);
    const totalComputers = facilities.reduce((sum, f) => sum + (parseInt(f.computers) || 0), 0);
    
    // Calculate compliance
    let compliantCount = 0;
    facilities.forEach(facility => {
        const compliance = checkCompliance(facility);
        if (compliance.compliant) compliantCount++;
    });

    document.getElementById('totalFacilities').textContent = totalFacilities;
    document.getElementById('totalArea').textContent = totalArea.toFixed(0);
    document.getElementById('totalComputers').textContent = totalComputers;
    document.getElementById('compliantCount').textContent = `${compliantCount}/${totalFacilities}`;
    
    // Color code compliance
    const complianceElement = document.getElementById('compliantCount');
    if (compliantCount === totalFacilities) {
        complianceElement.style.color = '#28a745'; // Green - all compliant
    } else if (compliantCount >= totalFacilities / 2) {
        complianceElement.style.color = '#ffc107'; // Yellow - half compliant
    } else {
        complianceElement.style.color = '#dc3545'; // Red - mostly non-compliant
    }
}

// Show add modal
function showAddModal() {
    document.getElementById('modalTitle').textContent = 'Add Facility';
    document.getElementById('facilityForm').reset();
    document.getElementById('facilityId').value = '';
    document.getElementById('facilityModal').style.display = 'block';
}

// Edit facility - make it globally accessible
window.editFacility = function(id) {
    console.log('Edit facility called for ID:', id);
    const facility = facilities.find(f => f.id === id);
    if (!facility) {
        console.error('Facility not found:', id);
        return;
    }

    console.log('Editing facility:', facility);
    document.getElementById('modalTitle').textContent = 'Edit Facility';
    document.getElementById('facilityId').value = facility.id;
    document.getElementById('facilityName').value = facility.name;
    document.getElementById('facilityType').value = facility.type || 'special';
    document.getElementById('facilityArea').value = facility.area;
    document.getElementById('facilityCapacity').value = facility.capacity || '';
    document.getElementById('facilityCondition').value = facility.condition;
    document.getElementById('facilityComputers').value = facility.computers || 0;
    document.getElementById('facilityNotes').value = facility.notes || '';
    
    document.getElementById('facilityModal').style.display = 'block';
}

// Delete facility - make it globally accessible
window.deleteFacility = function(id) {
    console.log('Delete facility called for ID:', id);
    const facility = facilities.find(f => f.id === id);
    if (!facility) {
        console.error('Facility not found:', id);
        return;
    }

    if (!confirm(`Are you sure you want to delete "${facility.name}"?`)) {
        return;
    }

    facilities = facilities.filter(f => f.id !== id);
    saveFacilitiesToStorage();
    renderFacilities();
    updateStatistics();
    
    alert('Facility deleted successfully');
}

// Save facility
function saveFacility(event) {
    event.preventDefault();

    const id = document.getElementById('facilityId').value;
    const facilityData = {
        id: id || Date.now().toString(),
        name: document.getElementById('facilityName').value,
        type: document.getElementById('facilityType').value,
        area: parseFloat(document.getElementById('facilityArea').value),
        capacity: parseInt(document.getElementById('facilityCapacity').value) || null,
        condition: document.getElementById('facilityCondition').value,
        computers: parseInt(document.getElementById('facilityComputers').value) || 0,
        notes: document.getElementById('facilityNotes').value
    };

    if (id) {
        // Update existing
        const index = facilities.findIndex(f => f.id === id);
        if (index !== -1) {
            facilities[index] = facilityData;
        }
    } else {
        // Add new
        facilities.push(facilityData);
    }

    saveFacilitiesToStorage();
    renderFacilities();
    updateStatistics();
    closeModal();
    
    alert('Facility saved successfully');
}

// Close modal
function closeModal() {
    document.getElementById('facilityModal').style.display = 'none';
}

// Logout
function logout() {
    fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('username');
        localStorage.removeItem('selectedInspectionArea');
        window.location.href = '/';
    })
    .catch(err => {
        console.error('Logout error:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('username');
        localStorage.removeItem('selectedInspectionArea');
        window.location.href = '/';
    });
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('facilityModal');
    if (event.target === modal) {
        closeModal();
    }
}


// Library Books Management
let libraryBooks = [];
let filteredBooks = [];

async function loadLibraryBooks() {
    try {
        // Try to load from localStorage first
        const storedBooks = localStorage.getItem('libraryBooks');
        
        if (storedBooks) {
            libraryBooks = JSON.parse(storedBooks);
            console.log('Loaded books from localStorage:', libraryBooks.length);
        } else {
            // Load from JSON file
            const response = await fetch('/data/library-books.json');
            const data = await response.json();
            
            // Flatten the books data with category information
            libraryBooks = [];
            data.categories.forEach(category => {
                category.books.forEach(book => {
                    libraryBooks.push({
                        category: category.name,
                        title: book.title,
                        copies: book.copies,
                        code: book.code
                    });
                });
            });
            
            // Save to localStorage
            saveBooksToStorage();
        }
        
        filteredBooks = [...libraryBooks];
        
        // Populate category filter
        populateCategoryFilter();
        
        // Render books
        renderBooks();
        
        // Update totals
        updateBookTotals();
        
    } catch (error) {
        console.error('Error loading library books:', error);
        document.getElementById('booksBody').innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 2rem; color: #dc3545;">
                    Error loading library books
                </td>
            </tr>
        `;
    }
}

function saveBooksToStorage() {
    localStorage.setItem('libraryBooks', JSON.stringify(libraryBooks));
}

function populateCategoryFilter() {
    const categoryFilter = document.getElementById('categoryFilter');
    
    // Check if element exists (not all pages have this element)
    if (!categoryFilter) {
        console.log('categoryFilter element not found - skipping populate');
        return;
    }
    
    const categories = [...new Set(libraryBooks.map(book => book.category))].sort();
    
    // Clear existing options except "All Categories"
    categoryFilter.innerHTML = '<option value="">All Categories</option>';
    
    categories.forEach(category => {
        const count = libraryBooks.filter(b => b.category === category).length;
        const option = document.createElement('option');
        option.value = category;
        option.textContent = `${category} (${count})`;
        categoryFilter.appendChild(option);
    });
}

function updateBookTotals() {
    const totalBooksEl = document.getElementById('totalBooks');
    const totalCategoriesEl = document.getElementById('totalCategories');
    
    // Check if elements exist (not all pages have these elements)
    if (!totalBooksEl || !totalCategoriesEl) {
        console.log('Book total elements not found - skipping update');
        return;
    }
    
    const totalBooks = libraryBooks.reduce((sum, book) => sum + parseInt(book.copies), 0);
    const totalCategories = [...new Set(libraryBooks.map(book => book.category))].length;
    
    totalBooksEl.textContent = totalBooks.toLocaleString();
    totalCategoriesEl.textContent = totalCategories;
}

function renderBooks() {
    const booksBody = document.getElementById('booksBody');
    
    // Check if element exists (not all pages have this element)
    if (!booksBody) {
        console.log('booksBody element not found - skipping render');
        return;
    }
    
    const isAdmin = userRole === 'Admin'; // Use the global userRole variable
    
    console.log('=== Rendering Books ===');
    console.log('Is Admin:', isAdmin);
    console.log('User Role:', userRole);
    console.log('Filtered Books:', filteredBooks.length);
    
    if (filteredBooks.length === 0) {
        booksBody.innerHTML = `
            <tr>
                <td colspan="${isAdmin ? '5' : '4'}" style="text-align: center; padding: 2rem; color: #999;">
                    No books found
                </td>
            </tr>
        `;
        return;
    }
    
    booksBody.innerHTML = filteredBooks.map((book, index) => {
        const actualIndex = libraryBooks.findIndex(b => 
            b.category === book.category && 
            b.title === book.title && 
            b.code === book.code
        );
        
        const actionsColumn = isAdmin ? `
            <td>
                <button class="btn-edit" onclick="editBook(${actualIndex})">Edit</button>
                <button class="btn-delete" onclick="deleteBook(${actualIndex})">Delete</button>
            </td>
        ` : '';
        
        return `
            <tr>
                <td>${book.category}</td>
                <td>${book.title}</td>
                <td>${book.copies}</td>
                <td>${book.code || '-'}</td>
                ${actionsColumn}
            </tr>
        `;
    }).join('');
    
    console.log('Books rendered with actions:', isAdmin);
}

function filterBooks() {
    const bookSearchEl = document.getElementById('bookSearch');
    const categoryFilterEl = document.getElementById('categoryFilter');
    
    // Check if elements exist
    if (!bookSearchEl || !categoryFilterEl) {
        console.log('Filter elements not found - skipping filter');
        return;
    }
    
    const searchTerm = bookSearchEl.value.toLowerCase();
    const categoryFilter = categoryFilterEl.value;
    
    filteredBooks = libraryBooks.filter(book => {
        const matchesSearch = book.title.toLowerCase().includes(searchTerm) || 
                            book.category.toLowerCase().includes(searchTerm) ||
                            book.code.toLowerCase().includes(searchTerm);
        const matchesCategory = !categoryFilter || book.category === categoryFilter;
        
        return matchesSearch && matchesCategory;
    });
    
    renderBooks();
}

function showAddBookModal() {
    document.getElementById('bookModalTitle').textContent = 'Add Book';
    document.getElementById('bookForm').reset();
    document.getElementById('bookIndex').value = '';
    document.getElementById('bookModal').style.display = 'block';
}

function editBook(index) {
    const book = libraryBooks[index];
    
    document.getElementById('bookModalTitle').textContent = 'Edit Book';
    document.getElementById('bookIndex').value = index;
    document.getElementById('bookCategory').value = book.category;
    document.getElementById('bookTitle').value = book.title;
    document.getElementById('bookCopies').value = book.copies;
    document.getElementById('bookCode').value = book.code;
    
    document.getElementById('bookModal').style.display = 'block';
}

function deleteBook(index) {
    const book = libraryBooks[index];
    
    if (confirm(`Are you sure you want to delete "${book.title}"?`)) {
        libraryBooks.splice(index, 1);
        saveBooksToStorage();
        populateCategoryFilter();
        updateBookTotals();
        filterBooks();
        alert('Book deleted successfully!');
    }
}

function saveBook(event) {
    event.preventDefault();
    
    const index = document.getElementById('bookIndex').value;
    const book = {
        category: document.getElementById('bookCategory').value,
        title: document.getElementById('bookTitle').value,
        copies: parseInt(document.getElementById('bookCopies').value),
        code: document.getElementById('bookCode').value
    };
    
    if (index === '') {
        // Add new book
        libraryBooks.push(book);
        alert('Book added successfully!');
    } else {
        // Update existing book
        libraryBooks[parseInt(index)] = book;
        alert('Book updated successfully!');
    }
    
    saveBooksToStorage();
    populateCategoryFilter();
    updateBookTotals();
    filterBooks();
    closeBookModal();
}

function closeBookModal() {
    document.getElementById('bookModal').style.display = 'none';
}

// Make functions globally accessible
window.showAddBookModal = showAddBookModal;
window.editBook = editBook;
window.deleteBook = deleteBook;
window.saveBook = saveBook;
window.closeBookModal = closeBookModal;


// Facility Type Navigation
function showFacilityType(type) {
    console.log('showFacilityType called with:', type);
    
    // Hide all sections
    document.querySelectorAll('.facility-section').forEach(section => {
        section.classList.remove('active-section');
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.facility-type-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected section
    const section = document.getElementById(`section-${type}`);
    const button = document.getElementById(`btn-${type}`);
    
    console.log('Section found:', section);
    console.log('Button found:', button);
    
    if (section) {
        section.classList.add('active-section');
    }
    
    if (button) {
        button.classList.add('active');
    }
    
    // Load specific content based on type
    if (type === 'laboratory') {
        loadLaboratoryDetails();
    } else if (type === 'classroom') {
        loadClassroomDetails();
    } else if (type === 'computer') {
        loadComputerLabDetails();
    } else if (type === 'office') {
        loadOfficeDetails();
    } else if (type === 'overview') {
        loadOverviewDetails();
    }
}

function loadOverviewDetails() {
    const tbody = document.getElementById('overviewFacilitiesBody');
    
    if (facilities.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem; color: #999;">
                    No facilities found
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = facilities.map(facility => {
        const compliance = checkCompliance(facility);
        const facilityType = facility.type || 'General';
        
        return `
            <tr>
                <td>${facility.name}</td>
                <td>${facilityType}</td>
                <td>${facility.area}</td>
                <td>${facility.capacity || '-'}</td>
                <td style="color: ${getConditionColor(facility.condition)}">${facility.condition}</td>
                <td style="color: ${compliance.compliant ? '#28a745' : '#dc3545'}">
                    ${compliance.compliant ? '✓ Compliant' : compliance.issues.join(', ')}
                </td>
            </tr>
        `;
    }).join('');
}

function loadLaboratoryDetails() {
    const labs = facilities.filter(f => 
        f.name.toLowerCase().includes('lab') || 
        f.type === 'laboratory'
    );
    
    const content = document.getElementById('laboratoryContent');
    
    if (labs.length === 0) {
        content.innerHTML = `
            <p style="text-align: center; padding: 2rem; color: #999;">
                No laboratory facilities found
            </p>
        `;
        return;
    }
    
    content.innerHTML = labs.map(lab => {
        const compliance = checkCompliance(lab);
        return `
            <div style="background: white; padding: 1.5rem; border-radius: 10px; margin-bottom: 1rem; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                <h4 style="color: #667eea; margin-bottom: 1rem;">${lab.name}</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                    <div>
                        <strong>Area:</strong> ${lab.area} ካሬ
                    </div>
                    <div>
                        <strong>Capacity:</strong> ${lab.capacity || 'N/A'} people
                    </div>
                    <div>
                        <strong>Condition:</strong> <span style="color: ${getConditionColor(lab.condition)}">${lab.condition}</span>
                    </div>
                    <div>
                        <strong>Computers:</strong> ${lab.computers || 0}
                    </div>
                </div>
                <div style="margin-top: 1rem; padding: 1rem; background: ${compliance.compliant ? '#d4edda' : '#f8d7da'}; border-radius: 5px;">
                    <strong>Standards Compliance:</strong>
                    <p style="margin: 0.5rem 0 0 0; color: ${compliance.compliant ? '#155724' : '#721c24'}">
                        ${compliance.compliant ? '✓ Meets all standards' : compliance.issues.join('. ')}
                    </p>
                </div>
                ${lab.notes ? `<div style="margin-top: 1rem;"><strong>Notes:</strong> ${lab.notes}</div>` : ''}
            </div>
        `;
    }).join('');
}

function loadClassroomDetails() {
    const classrooms = facilities.filter(f => 
        f.name.toLowerCase().includes('class') || 
        f.type === 'classroom'
    );
    
    const content = document.getElementById('classroomContent');
    
    if (classrooms.length === 0) {
        content.innerHTML = `
            <p style="text-align: center; padding: 2rem; color: #999;">
                No classroom facilities found
            </p>
        `;
        return;
    }
    
    content.innerHTML = classrooms.map(classroom => {
        const compliance = checkCompliance(classroom);
        return `
            <div style="background: white; padding: 1.5rem; border-radius: 10px; margin-bottom: 1rem; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                <h4 style="color: #667eea; margin-bottom: 1rem;">${classroom.name}</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                    <div>
                        <strong>Area:</strong> ${classroom.area} ካሬ
                    </div>
                    <div>
                        <strong>Capacity:</strong> ${classroom.capacity || 'N/A'} students
                    </div>
                    <div>
                        <strong>Condition:</strong> <span style="color: ${getConditionColor(classroom.condition)}">${classroom.condition}</span>
                    </div>
                </div>
                <div style="margin-top: 1rem; padding: 1rem; background: ${compliance.compliant ? '#d4edda' : '#f8d7da'}; border-radius: 5px;">
                    <strong>Standards Compliance:</strong>
                    <p style="margin: 0.5rem 0 0 0; color: ${compliance.compliant ? '#155724' : '#721c24'}">
                        ${compliance.compliant ? '✓ Meets all standards' : compliance.issues.join('. ')}
                    </p>
                </div>
                ${classroom.notes ? `<div style="margin-top: 1rem;"><strong>Notes:</strong> ${classroom.notes}</div>` : ''}
            </div>
        `;
    }).join('');
}

function loadComputerLabDetails() {
    const computerLabs = facilities.filter(f => 
        f.name.toLowerCase().includes('computer') || 
        f.name.toLowerCase().includes('it') ||
        f.type === 'computer-lab'
    );
    
    const content = document.getElementById('computerContent');
    
    if (computerLabs.length === 0) {
        content.innerHTML = `
            <p style="text-align: center; padding: 2rem; color: #999;">
                No computer lab facilities found
            </p>
        `;
        return;
    }
    
    content.innerHTML = computerLabs.map(lab => {
        const compliance = checkCompliance(lab);
        return `
            <div style="background: white; padding: 1.5rem; border-radius: 10px; margin-bottom: 1rem; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                <h4 style="color: #667eea; margin-bottom: 1rem;">${lab.name}</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                    <div>
                        <strong>Area:</strong> ${lab.area} ካሬ
                    </div>
                    <div>
                        <strong>Capacity:</strong> ${lab.capacity || 'N/A'} people
                    </div>
                    <div>
                        <strong>Condition:</strong> <span style="color: ${getConditionColor(lab.condition)}">${lab.condition}</span>
                    </div>
                    <div>
                        <strong>Computers:</strong> ${lab.computers || 0}
                    </div>
                </div>
                <div style="margin-top: 1rem; padding: 1rem; background: ${compliance.compliant ? '#d4edda' : '#f8d7da'}; border-radius: 5px;">
                    <strong>Standards Compliance:</strong>
                    <p style="margin: 0.5rem 0 0 0; color: ${compliance.compliant ? '#155724' : '#721c24'}">
                        ${compliance.compliant ? '✓ Meets all standards' : compliance.issues.join('. ')}
                    </p>
                </div>
                ${lab.notes ? `<div style="margin-top: 1rem;"><strong>Notes:</strong> ${lab.notes}</div>` : ''}
            </div>
        `;
    }).join('');
}

function loadOfficeDetails() {
    const offices = facilities.filter(f => 
        f.name.toLowerCase().includes('office') || 
        f.name.toLowerCase().includes('staff') ||
        f.type === 'office' ||
        f.type === 'staff'
    );
    
    const content = document.getElementById('officeContent');
    
    if (offices.length === 0) {
        content.innerHTML = `
            <p style="text-align: center; padding: 2rem; color: #999;">
                No office facilities found
            </p>
        `;
        return;
    }
    
    content.innerHTML = offices.map(office => {
        const compliance = checkCompliance(office);
        return `
            <div style="background: white; padding: 1.5rem; border-radius: 10px; margin-bottom: 1rem; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                <h4 style="color: #667eea; margin-bottom: 1rem;">${office.name}</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                    <div>
                        <strong>Area:</strong> ${office.area} ካሬ
                    </div>
                    <div>
                        <strong>Capacity:</strong> ${office.capacity || 'N/A'} people
                    </div>
                    <div>
                        <strong>Condition:</strong> <span style="color: ${getConditionColor(office.condition)}">${office.condition}</span>
                    </div>
                    <div>
                        <strong>Computers:</strong> ${office.computers || 0}
                    </div>
                </div>
                <div style="margin-top: 1rem; padding: 1rem; background: ${compliance.compliant ? '#d4edda' : '#f8d7da'}; border-radius: 5px;">
                    <strong>Standards Compliance:</strong>
                    <p style="margin: 0.5rem 0 0 0; color: ${compliance.compliant ? '#155724' : '#721c24'}">
                        ${compliance.compliant ? '✓ Meets all standards' : compliance.issues.join('. ')}
                    </p>
                </div>
                ${office.notes ? `<div style="margin-top: 1rem;"><strong>Notes:</strong> ${office.notes}</div>` : ''}
            </div>
        `;
    }).join('');
}

// Make function globally accessible
window.showFacilityType = showFacilityType;
