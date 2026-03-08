// Infrastructure Filtered View JavaScript
// This file is used for laboratory, classroom, computer lab, and office pages

const API_BASE = '/api';
let authToken = localStorage.getItem('token');
let userRole = localStorage.getItem('role');
let facilities = [];
let filterType = ''; // Will be set by each page

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

function displayUserInfo() {
    const roleElement = document.getElementById('userRole');
    if (roleElement && userRole) {
        roleElement.textContent = userRole;
    }
}

function showAdminElements() {
    const isAdmin = (userRole === 'Admin');
    
    if (isAdmin) {
        const addButtons = document.querySelectorAll('.btn-add');
        addButtons.forEach(button => {
            button.style.display = 'inline-block';
        });
        
        const actionsHeaders = document.querySelectorAll('th.admin-only');
        actionsHeaders.forEach(header => {
            header.style.display = 'table-cell';
        });
    }
}

async function loadFacilities() {
    try {
        const storedFacilities = localStorage.getItem('facilities');
        
        if (storedFacilities) {
            facilities = JSON.parse(storedFacilities);
        } else {
            facilities = getDefaultFacilities();
            saveFacilitiesToStorage();
        }
        
        renderFilteredFacilities();
    } catch (error) {
        console.error('Error loading facilities:', error);
    }
}

function getDefaultFacilities() {
    return [
        { id: '1', name: 'Library', area: 10, capacity: 30, condition: 'Good', computers: 0, notes: '', type: 'library' },
        { id: '2', name: 'Laboratory', area: 62, capacity: 40, condition: 'Good', computers: 0, notes: '', type: 'laboratory' },
        { id: '3', name: 'Learning Class', area: 56, capacity: 45, condition: 'Good', computers: 0, notes: '', type: 'classroom' },
        { id: '4', name: 'Pedagogue Center', area: 72, capacity: 50, condition: 'Good', computers: 0, notes: '', type: 'special' },
        { id: '5', name: 'Vice Office', area: 16, capacity: 5, condition: 'Good', computers: 1, notes: '', type: 'office' },
        { id: '6', name: 'Secretary Office', type: 'office', area: 20, capacity: 3, condition: 'Good', computers: 1, notes: '' },
        { id: '7', name: 'Staff Room', area: 52, capacity: 20, condition: 'Good', computers: 0, notes: '', type: 'staff' },
        { id: '8', name: 'IT Library', area: 48, capacity: 30, condition: 'Good', computers: 26, notes: '26 computers available', type: 'computer-lab' }
    ];
}

function saveFacilitiesToStorage() {
    localStorage.setItem('facilities', JSON.stringify(facilities));
}

function renderFilteredFacilities() {
    const content = document.getElementById('filteredContent');
    
    // Filter facilities based on type
    let filtered = facilities.filter(f => {
        if (filterType === 'laboratory') {
            return f.name.toLowerCase().includes('lab') && !f.name.toLowerCase().includes('computer') || f.type === 'laboratory';
        } else if (filterType === 'classroom') {
            return f.name.toLowerCase().includes('class') || f.type === 'classroom';
        } else if (filterType === 'computer') {
            return f.name.toLowerCase().includes('computer') || f.name.toLowerCase().includes('it') || f.type === 'computer-lab';
        } else if (filterType === 'office') {
            return f.name.toLowerCase().includes('office') || f.name.toLowerCase().includes('staff') || f.type === 'office' || f.type === 'staff';
        }
        return false;
    });
    
    if (filtered.length === 0) {
        content.innerHTML = `
            <p style="text-align: center; padding: 2rem; color: #999;">
                No ${filterType} facilities found
            </p>
        `;
        return;
    }
    
    content.innerHTML = filtered.map(facility => {
        const compliance = checkCompliance(facility);
        const rating = calculateRating(facility, compliance);
        return `
            <div style="background: white; padding: 1.5rem; border-radius: 10px; margin-bottom: 1rem; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h4 style="color: #667eea; margin: 0;">${facility.name}</h4>
                    <div style="text-align: right;">
                        <div style="font-size: 1.5rem; color: ${rating.color}; font-weight: bold;">${rating.stars}</div>
                        <div style="font-size: 0.9rem; color: ${rating.color}; font-weight: 600;">${rating.grade} - ${rating.label}</div>
                        <div style="font-size: 0.85rem; color: #666;">${rating.score}/100</div>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                    <div>
                        <strong>Area:</strong> ${facility.area} ካሬ
                    </div>
                    <div>
                        <strong>Capacity:</strong> ${facility.capacity || 'N/A'} ${filterType === 'classroom' ? 'students' : 'people'}
                    </div>
                    <div>
                        <strong>Condition:</strong> <span style="color: ${getConditionColor(facility.condition)}">${facility.condition}</span>
                    </div>
                    <div>
                        <strong>Computers:</strong> ${facility.computers || 0}
                    </div>
                </div>
                <div style="margin-top: 1rem; padding: 1rem; background: ${compliance.compliant ? '#d4edda' : '#f8d7da'}; border-radius: 5px;">
                    <strong>Standards Compliance:</strong>
                    <p style="margin: 0.5rem 0 0 0; color: ${compliance.compliant ? '#155724' : '#721c24'}">
                        ${compliance.compliant ? '✓ Meets all standards' : compliance.issues.join('. ')}
                    </p>
                </div>
                ${facility.notes ? `<div style="margin-top: 1rem;"><strong>Notes:</strong> ${facility.notes}</div>` : ''}
            </div>
        `;
    }).join('');
}

function checkCompliance(facility) {
    const standards = getStandards();
    const issues = [];
    let compliant = true;

    const standard = standards[facility.type] || standards['general'];
    
    if (facility.area < standard.minArea) {
        issues.push(`Area too small (${facility.area} ካሬ < ${standard.minArea} ካሬ required)`);
        compliant = false;
    }
    
    if (facility.capacity && facility.capacity < standard.minCapacity) {
        issues.push(`Capacity below standard (${facility.capacity} < ${standard.minCapacity} required)`);
        compliant = false;
    }
    
    if (facility.condition === 'Poor' || facility.condition === 'Critical') {
        issues.push(`Condition needs improvement (${facility.condition})`);
        compliant = false;
    }

    return { compliant, issues };
}

function calculateRating(facility, compliance) {
    let score = 0;
    const standards = getStandards();
    const standard = standards[facility.type] || standards['general'];
    
    // Area score (40 points max)
    const areaRatio = facility.area / standard.minArea;
    if (areaRatio >= 1) {
        score += 40;
    } else {
        score += Math.floor(40 * areaRatio);
    }
    
    // Capacity score (20 points max)
    if (facility.capacity) {
        const capacityRatio = facility.capacity / standard.minCapacity;
        if (capacityRatio >= 1) {
            score += 20;
        } else {
            score += Math.floor(20 * capacityRatio);
        }
    } else {
        score += 10; // Partial credit if capacity not specified
    }
    
    // Condition score (30 points max)
    const conditionScores = {
        'Excellent': 30,
        'Good': 25,
        'Fair': 15,
        'Poor': 5,
        'Critical': 0
    };
    score += conditionScores[facility.condition] || 15;
    
    // Equipment score (10 points max) - for computer labs and offices
    if (facility.type === 'computer-lab' || facility.type === 'office') {
        if (facility.computers > 0) {
            score += 10;
        }
    } else {
        score += 10; // Full credit for non-computer facilities
    }
    
    // Determine grade and label
    let grade, label, color, stars;
    
    if (score >= 90) {
        grade = 'A+';
        label = 'Excellent';
        color = '#28a745';
        stars = '⭐⭐⭐⭐⭐';
    } else if (score >= 80) {
        grade = 'A';
        label = 'Very Good';
        color = '#5cb85c';
        stars = '⭐⭐⭐⭐';
    } else if (score >= 70) {
        grade = 'B';
        label = 'Good';
        color = '#5bc0de';
        stars = '⭐⭐⭐';
    } else if (score >= 60) {
        grade = 'C';
        label = 'Satisfactory';
        color = '#f0ad4e';
        stars = '⭐⭐';
    } else if (score >= 50) {
        grade = 'D';
        label = 'Needs Improvement';
        color = '#ff9800';
        stars = '⭐';
    } else {
        grade = 'F';
        label = 'Poor';
        color = '#dc3545';
        stars = '☆';
    }
    
    return { score, grade, label, color, stars };
}

function getStandards() {
    return {
        'library': { minArea: 100, minCapacity: 50 },
        'laboratory': { minArea: 60, minCapacity: 30 },
        'classroom': { minArea: 50, minCapacity: 40 },
        'computer-lab': { minArea: 60, minCapacity: 30 },
        'office': { minArea: 15, minCapacity: 2 },
        'staff': { minArea: 40, minCapacity: 15 },
        'general': { minArea: 20, minCapacity: 10 }
    };
}

function getConditionColor(condition) {
    const colors = {
        'Excellent': '#28a745',
        'Good': '#28a745',
        'Fair': '#ffc107',
        'Poor': '#dc3545',
        'Critical': '#dc3545'
    };
    return colors[condition] || '#666';
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    window.location.href = '/index.html';
}

window.logout = logout;
