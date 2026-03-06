// Infrastructure Inspection JavaScript

const API_BASE = '/api';
let authToken = localStorage.getItem('token');
let userRole = localStorage.getItem('role');
let facilities = [];

// Check authentication
if (!authToken) {
    window.location.href = '/login.html';
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
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
    if (userRole === 'Admin') {
        const adminElements = document.querySelectorAll('.admin-only');
        adminElements.forEach(el => {
            el.style.display = el.tagName === 'TH' || el.tagName === 'TD' ? 'table-cell' : 'block';
        });
    }
}

// Load facilities from API or localStorage
async function loadFacilities() {
    try {
        // First check localStorage
        const stored = localStorage.getItem('schoolFacilities');
        if (stored) {
            facilities = JSON.parse(stored);
            console.log('Loaded from localStorage:', facilities.length, 'facilities');
        } else {
            // Initialize with default data
            console.log('No data in localStorage, loading defaults');
            facilities = getDefaultFacilities();
            saveFacilitiesToStorage();
        }

        renderFacilities();
        updateStatistics();
        
        // Try to sync with API in background (optional)
        try {
            const response = await fetch(`${API_BASE}/infrastructure`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.facilities && data.facilities.length > 0) {
                    facilities = data.facilities;
                    saveFacilitiesToStorage();
                    renderFacilities();
                    updateStatistics();
                }
            }
        } catch (apiError) {
            console.log('API not available, using local data');
        }
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
        { id: '1', name: 'Library', area: 10, capacity: 30, condition: 'Good', computers: 0, notes: '' },
        { id: '2', name: 'Laboratory', area: 62, capacity: 40, condition: 'Good', computers: 0, notes: '' },
        { id: '3', name: 'Learning Class', area: 56, capacity: 45, condition: 'Good', computers: 0, notes: '' },
        { id: '4', name: 'Pedagogue Center', area: 72, capacity: 50, condition: 'Good', computers: 0, notes: '' },
        { id: '5', name: 'Vice Office', area: 16, capacity: 5, condition: 'Good', computers: 1, notes: '' },
        { id: '6', name: 'Secretary Office', area: 20, capacity: 3, condition: 'Good', computers: 2, notes: '' },
        { id: '7', name: 'Staff Room', area: 52, capacity: 20, condition: 'Good', computers: 0, notes: '' },
        { id: '8', name: 'IT Library', area: 48, capacity: 30, condition: 'Good', computers: 26, notes: '26 computers available' }
    ];
}

// Save facilities to localStorage
function saveFacilitiesToStorage() {
    localStorage.setItem('schoolFacilities', JSON.stringify(facilities));
}

// Render facilities table
function renderFacilities() {
    const tbody = document.getElementById('facilitiesBody');
    
    if (facilities.length === 0) {
        const colspan = userRole === 'Admin' ? '6' : '5';
        tbody.innerHTML = `
            <tr>
                <td colspan="${colspan}" style="text-align: center; padding: 2rem; color: #999;">
                    No facilities found. ${userRole === 'Admin' ? 'Click "Add Facility" to add one.' : ''}
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = facilities.map(facility => `
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
            ${userRole === 'Admin' ? `
                <td class="admin-only">
                    <button class="btn-edit" onclick="editFacility('${facility.id}')">Edit</button>
                    <button class="btn-delete" onclick="deleteFacility('${facility.id}')">Delete</button>
                </td>
            ` : ''}
        </tr>
    `).join('');
    
    console.log('Rendered', facilities.length, 'facilities');
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
    
    // Calculate average condition
    const conditionScores = {
        'Excellent': 5,
        'Good': 4,
        'Fair': 3,
        'Poor': 2,
        'Critical': 1
    };
    
    const avgScore = facilities.length > 0 
        ? facilities.reduce((sum, f) => sum + (conditionScores[f.condition] || 0), 0) / facilities.length
        : 0;
    
    const avgCondition = avgScore >= 4.5 ? 'Excellent' 
        : avgScore >= 3.5 ? 'Good'
        : avgScore >= 2.5 ? 'Fair'
        : avgScore >= 1.5 ? 'Poor'
        : 'Critical';

    document.getElementById('totalFacilities').textContent = totalFacilities;
    document.getElementById('totalArea').textContent = totalArea.toFixed(0);
    document.getElementById('totalComputers').textContent = totalComputers;
    document.getElementById('avgCondition').textContent = avgCondition;
}

// Show add modal
function showAddModal() {
    document.getElementById('modalTitle').textContent = 'Add Facility';
    document.getElementById('facilityForm').reset();
    document.getElementById('facilityId').value = '';
    document.getElementById('facilityModal').style.display = 'block';
}

// Edit facility
function editFacility(id) {
    const facility = facilities.find(f => f.id === id);
    if (!facility) return;

    document.getElementById('modalTitle').textContent = 'Edit Facility';
    document.getElementById('facilityId').value = facility.id;
    document.getElementById('facilityName').value = facility.name;
    document.getElementById('facilityArea').value = facility.area;
    document.getElementById('facilityCapacity').value = facility.capacity || '';
    document.getElementById('facilityCondition').value = facility.condition;
    document.getElementById('facilityComputers').value = facility.computers || 0;
    document.getElementById('facilityNotes').value = facility.notes || '';
    
    document.getElementById('facilityModal').style.display = 'block';
}

// Delete facility
function deleteFacility(id) {
    const facility = facilities.find(f => f.id === id);
    if (!facility) return;

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
