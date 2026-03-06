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
        // Show Add Facility button
        const addButton = document.querySelector('.btn-add');
        if (addButton) {
            addButton.style.display = 'inline-block';
            console.log('Add button shown');
        }
        
        // Show Actions column header
        const actionsHeader = document.querySelector('th.admin-only');
        if (actionsHeader) {
            actionsHeader.style.display = 'table-cell';
            console.log('Actions header shown');
        }
    } else {
        // Hide admin elements
        const addButton = document.querySelector('.btn-add');
        if (addButton) {
            addButton.style.display = 'none';
        }
        
        const actionsHeader = document.querySelector('th.admin-only');
        if (actionsHeader) {
            actionsHeader.style.display = 'none';
        }
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
        
        filteredBooks = [...libraryBooks];
        
        // Populate category filter
        populateCategoryFilter(data.categories);
        
        // Render books
        renderBooks();
        
        // Update totals
        document.getElementById('totalBooks').textContent = data.totalBooks.toLocaleString();
        document.getElementById('totalCategories').textContent = data.totalCategories;
        
    } catch (error) {
        console.error('Error loading library books:', error);
        document.getElementById('booksBody').innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 2rem; color: #dc3545;">
                    Error loading library books
                </td>
            </tr>
        `;
    }
}

function populateCategoryFilter(categories) {
    const categoryFilter = document.getElementById('categoryFilter');
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.name;
        option.textContent = `${category.name} (${category.books.length})`;
        categoryFilter.appendChild(option);
    });
}

function renderBooks() {
    const booksBody = document.getElementById('booksBody');
    
    if (filteredBooks.length === 0) {
        booksBody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 2rem; color: #999;">
                    No books found
                </td>
            </tr>
        `;
        return;
    }
    
    booksBody.innerHTML = filteredBooks.map(book => `
        <tr>
            <td>${book.category}</td>
            <td>${book.title}</td>
            <td>${book.copies}</td>
            <td>${book.code || '-'}</td>
        </tr>
    `).join('');
}

function filterBooks() {
    const searchTerm = document.getElementById('bookSearch').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    
    filteredBooks = libraryBooks.filter(book => {
        const matchesSearch = book.title.toLowerCase().includes(searchTerm) || 
                            book.category.toLowerCase().includes(searchTerm) ||
                            book.code.toLowerCase().includes(searchTerm);
        const matchesCategory = !categoryFilter || book.category === categoryFilter;
        
        return matchesSearch && matchesCategory;
    });
    
    renderBooks();
}

// Add event listeners for search and filter
document.addEventListener('DOMContentLoaded', function() {
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
});
