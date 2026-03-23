// Dashboard JavaScript for Longitudinal Inspection System

const API_BASE = '/api';
let authToken = localStorage.getItem('token');
let userRole = localStorage.getItem('role');
let trendsChart = null;
let passRateChart = null;

// Check authentication
if (!authToken) {
    window.location.href = '/login.html';
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    displayUserInfo();
    loadDashboardData();
    setupYearFilterHandler();
    showAdminSection();
    
    // Scroll to admin section if hash is present
    if (window.location.hash === '#adminSection') {
        setTimeout(() => {
            const adminSection = document.getElementById('adminSection');
            if (adminSection) {
                adminSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 500); // Wait for content to load
    }
});

// Listen for messages from child windows (e.g., Student Manager)
window.addEventListener('message', (event) => {
    if (event.data && event.data.action === 'refreshDashboard') {
        console.log('Refreshing dashboard after student deletion...');
        loadDashboardData();
    }
});

// Display user information
function displayUserInfo() {
    const roleElement = document.getElementById('userRole');
    if (roleElement && userRole) {
        roleElement.textContent = `${userRole}`;
    }
}

// Setup year filter handler
function setupYearFilterHandler() {
    const yearsSelect = document.getElementById('filterYears');
    
    yearsSelect.addEventListener('change', function() {
        const selectedOptions = Array.from(this.selectedOptions);
        const selectedValues = selectedOptions.map(opt => opt.value);
        
        // If "all" is selected, deselect individual years
        if (selectedValues.includes('all') && selectedValues.length > 1) {
            // If "all" was just selected, deselect others
            const allOption = Array.from(this.options).find(opt => opt.value === 'all');
            if (allOption && selectedOptions[selectedOptions.length - 1].value === 'all') {
                // "all" was the last one selected, deselect others
                Array.from(this.options).forEach(opt => {
                    if (opt.value !== 'all') opt.selected = false;
                });
            } else {
                // Individual year was selected, deselect "all"
                const allOpt = Array.from(this.options).find(opt => opt.value === 'all');
                if (allOpt) allOpt.selected = false;
            }
        }
        
        // Ensure at least one option is selected
        if (Array.from(this.selectedOptions).length === 0) {
            const allOption = Array.from(this.options).find(opt => opt.value === 'all');
            if (allOption) allOption.selected = true;
        }
    });
}

// Logout function
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

// Load all dashboard data
async function loadDashboardData() {
    try {
        // Load trends first (most important)
        await loadTrends();
        
        // Load other data in background (non-blocking)
        loadRedFlags().catch(err => console.error('Red flags error:', err));
        loadSuggestions().catch(err => console.error('Suggestions error:', err));
        load2018Predictions().catch(err => console.error('Predictions error:', err));
        
        // Skip correlations for now (they're slow and not critical)
        // loadCorrelations().catch(err => console.error('Correlations error:', err));
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Apply filters
function applyFilters() {
    // Show loading indicator
    const trendsChart = document.getElementById('trendsChart');
    if (trendsChart) {
        trendsChart.innerHTML = '<div style="text-align: center; padding: 2rem;">Loading...</div>';
    }
    
    loadDashboardData();
}

// Get current filter values
function getFilters() {
    const grade = document.getElementById('filterGrade').value;
    const gender = document.getElementById('filterGender').value;
    const subject = document.getElementById('filterSubject').value;
    const semester = document.getElementById('filterSemester').value;
    const yearsSelect = document.getElementById('filterYears');
    const selectedYears = Array.from(yearsSelect.selectedOptions).map(opt => opt.value);
    
    // If "all" is selected, use all available years
    let years;
    if (selectedYears.includes('all')) {
        years = '2015,2016,2017';
    } else {
        years = selectedYears.join(',');
    }
    
    return {
        grade,
        gender,
        subject,
        semester,
        years
    };
}

// Load performance trends
async function loadTrends() {
    try {
        const filters = getFilters();
        const params = new URLSearchParams();
        
        if (filters.years) params.append('years', filters.years);
        if (filters.subject && filters.subject !== 'overall') params.append('subject', filters.subject);
        if (filters.grade) params.append('gradeLevel', filters.grade);
        if (filters.gender) params.append('gender', filters.gender);
        if (filters.semester) params.append('semester', filters.semester);

        const response = await fetch(`${API_BASE}/analysis/trends?${params}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.status === 401) {
            // Token expired or invalid, redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            window.location.href = '/login.html';
            return;
        }

        if (!response.ok) throw new Error('Failed to load trends');

        const data = await response.json();
        
        // Update statistics
        if (data.trends && data.trends.length > 0) {
            // If multiple years selected, sum up the totals
            if (data.trends.length > 1) {
                const totalStudents = data.trends.reduce((sum, trend) => sum + (trend.studentCount || 0), 0);
                const avgPerformance = (data.trends.reduce((sum, trend) => sum + (trend.averageMark || 0), 0) / data.trends.length).toFixed(2);
                const avgPassRate = (data.trends.reduce((sum, trend) => sum + (trend.passRate || 0), 0) / data.trends.length).toFixed(2);
                
                document.getElementById('totalStudents').textContent = totalStudents;
                document.getElementById('avgPerformance').textContent = `${avgPerformance}%`;
                document.getElementById('passRate').textContent = `${avgPassRate}%`;
            } else {
                // Single year, use that year's data
                const latestTrend = data.trends[0];
                document.getElementById('totalStudents').textContent = latestTrend.studentCount || '-';
                document.getElementById('avgPerformance').textContent = latestTrend.averageMark ? `${latestTrend.averageMark}%` : '-';
                document.getElementById('passRate').textContent = latestTrend.passRate ? `${latestTrend.passRate}%` : '-';
            }
        }

        // Render trends chart
        renderTrendsChart(data.trends);
        renderPassRateChart(data.trends);

    } catch (error) {
        console.error('Error loading trends:', error);
        showError('Failed to load performance trends');
    }
}

// Render trends chart
function renderTrendsChart(trends) {
    const ctx = document.getElementById('trendsChart');
    if (!ctx) return;

    const years = trends.map(t => t.year);
    const averages = trends.map(t => t.averageMark);

    if (trendsChart) {
        trendsChart.destroy();
    }

    trendsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: years,
            datasets: [{
                label: 'Average Performance',
                data: averages,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Average Mark (%)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Year'
                    }
                }
            }
        }
    });
}

// Render pass rate chart
function renderPassRateChart(trends) {
    const ctx = document.getElementById('passRateChart');
    if (!ctx) return;

    const years = trends.map(t => t.year);
    const passRates = trends.map(t => t.passRate);
    const failRates = trends.map(t => 100 - t.passRate);

    if (passRateChart) {
        passRateChart.destroy();
    }

    passRateChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: years,
            datasets: [
                {
                    label: 'Pass Rate',
                    data: passRates,
                    backgroundColor: '#28a745'
                },
                {
                    label: 'Fail Rate',
                    data: failRates,
                    backgroundColor: '#dc3545'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Percentage (%)'
                    }
                },
                x: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Year'
                    }
                }
            }
        }
    });
}

// Load red flags
async function loadRedFlags() {
    try {
        // Get current filters
        const filters = getFilters();
        const years = filters.years ? filters.years.split(',') : ['2015'];
        
        // Collect all red flags from all selected years
        let allFlaggedStudents = [];
        
        for (const year of years) {
            // Build query parameters with filters
            const params = new URLSearchParams();
            params.append('yearFrom', year);
            params.append('yearTo', year);
            params.append('threshold', '50');
            
            // Add filters if they exist
            if (filters.grade) params.append('gradeLevel', filters.grade);
            if (filters.gender) params.append('gender', filters.gender);
            if (filters.subject && filters.subject !== 'overall') params.append('subject', filters.subject);
            if (filters.semester) params.append('semester', filters.semester);
            
            const response = await fetch(`${API_BASE}/analysis/red-flags?${params}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 401) {
                // Token expired or invalid, redirect to login
                localStorage.removeItem('token');
                localStorage.removeItem('role');
                window.location.href = '/login.html';
                return;
            }

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Red flags error response:', errorText);
                throw new Error(`Failed to load red flags: ${response.status}`);
            }

            const data = await response.json();
            
            // Add year-specific red flags to the collection
            if (data.flaggedStudents && data.flaggedStudents.length > 0) {
                allFlaggedStudents = allFlaggedStudents.concat(data.flaggedStudents);
            }
        }
        
        // Update red flag count
        document.getElementById('redFlagCount').textContent = allFlaggedStudents.length;

        // Render red flags table
        renderRedFlagsTable(allFlaggedStudents);

    } catch (error) {
        console.error('Error loading red flags:', error);
        showError('Failed to load red flags');
    }
}

// Render red flags table
function renderRedFlagsTable(flaggedStudents) {
    const tbody = document.getElementById('redFlagsBody');
    if (!tbody) {
        console.error('Red flags tbody not found!');
        return;
    }

    console.log('Rendering red flags table with', flaggedStudents.length, 'students');

    if (flaggedStudents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #28a745;">No failing students found! 🎉</td></tr>';
        return;
    }

    tbody.innerHTML = flaggedStudents.map(student => {
        const failingCount = student.failingSubjectsCount || student.failingSubjects.length;
        const subjects = student.failingSubjects.slice(0, 3).map(s => `${s.subject} (${s.average}%)`).join(', ');
        const moreSubjects = student.failingSubjects.length > 3 ? ` +${student.failingSubjects.length - 3} more` : '';
        const avgClass = parseFloat(student.overallAverage) < 40 ? 'badge-danger' : 'badge-warning';
        
        return `
            <tr>
                <td>${student.studentId}</td>
                <td>${student.name}</td>
                <td>Grade ${student.gradeLevel} (${student.year})</td>
                <td><span class="badge ${avgClass}">${student.overallAverage}%</span></td>
                <td>
                    <strong style="color: #dc3545;">${failingCount} subject${failingCount !== 1 ? 's' : ''} below 50%</strong>
                    <br><small style="color: #666;">${subjects}${moreSubjects}</small>
                </td>
            </tr>
        `;
    }).join('');
    
    console.log('Red flags table rendered successfully');
}

// Load correlations
async function loadCorrelations() {
    try {
        const response = await fetch(`${API_BASE}/analysis/correlations`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) throw new Error('Failed to load correlations');

        const data = await response.json();
        
        renderCorrelations(data.correlations || []);

    } catch (error) {
        console.error('Error loading correlations:', error);
        document.getElementById('correlationsContainer').innerHTML = 
            '<div class="error">Failed to load correlations</div>';
    }
}

// Render correlations
function renderCorrelations(correlations) {
    const container = document.getElementById('correlationsContainer');
    if (!container) return;

    if (correlations.length === 0) {
        container.innerHTML = '<p style="color: #999;">No infrastructure correlations available yet.</p>';
        return;
    }

    container.innerHTML = correlations.map(corr => {
        const significanceClass = corr.pValue < 0.05 ? 'badge-success' : 'badge-info';
        const significanceText = corr.pValue < 0.05 ? 'Significant' : 'Not Significant';
        
        return `
            <div class="correlation-item">
                <div class="correlation-header">
                    ${corr.facilityName || corr.improvementId}
                    <span class="badge ${significanceClass}">${significanceText}</span>
                </div>
                <div class="correlation-stats">
                    <div><strong>Correlation:</strong> ${corr.correlation.toFixed(3)}</div>
                    <div><strong>P-value:</strong> ${corr.pValue.toFixed(4)}</div>
                    <div><strong>Students Affected:</strong> ${corr.affectedStudents}</div>
                    <div><strong>Before Avg:</strong> ${corr.beforeAverage.toFixed(1)}%</div>
                    <div><strong>After Avg:</strong> ${corr.afterAverage.toFixed(1)}%</div>
                    <div><strong>Improvement:</strong> ${corr.averageImprovement.toFixed(1)}%</div>
                </div>
            </div>
        `;
    }).join('');
}

// Load predictions
async function loadPredictions() {
    try {
        const response = await fetch(`${API_BASE}/analysis/predictions?targetYear=2018`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) throw new Error('Failed to load predictions');

        const data = await response.json();
        
        renderPredictions(data.predictions || []);

    } catch (error) {
        console.error('Error loading predictions:', error);
        document.getElementById('predictionsContainer').innerHTML = 
            '<div class="error">Failed to load predictions</div>';
    }
}

// Render predictions
function renderPredictions(predictions) {
    const container = document.getElementById('predictionsContainer');
    if (!container) return;

    if (predictions.length === 0) {
        container.innerHTML = '<p style="color: #999;">No predictions available yet.</p>';
        return;
    }

    container.innerHTML = predictions.map(pred => {
        const ci = pred.confidenceInterval;
        const ciText = ci ? `95% CI: [${ci.lower.toFixed(1)}, ${ci.upper.toFixed(1)}]` : '';
        
        return `
            <div class="prediction-item">
                <div class="prediction-subject">${pred.subject.toUpperCase()}</div>
                <div class="prediction-value">Predicted: ${pred.predictedValue.toFixed(1)}%</div>
                <div class="prediction-confidence">${ciText}</div>
                ${pred.r2 ? `<div class="prediction-confidence">R² = ${pred.r2.toFixed(3)}</div>` : ''}
            </div>
        `;
    }).join('');
}

// Generate report
async function generateReport() {
    try {
        const reportType = document.getElementById('reportType').value;
        const filters = getFilters();
        
        const statusDiv = document.getElementById('reportStatus');
        statusDiv.innerHTML = '<div class="loading">Generating report...</div>';

        const response = await fetch(`${API_BASE}/reports/generate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                reportType,
                filters: {
                    years: filters.years.split(',').map(y => parseInt(y)),
                    gradeLevel: filters.grade ? parseInt(filters.grade) : null,
                    gender: filters.gender || null,
                    subjects: filters.subject !== 'overall' ? [filters.subject] : null
                }
            })
        });

        if (!response.ok) throw new Error('Failed to generate report');

        const data = await response.json();
        
        // Poll for report status
        pollReportStatus(data.reportId, data.downloadToken);

    } catch (error) {
        console.error('Error generating report:', error);
        document.getElementById('reportStatus').innerHTML = 
            '<div class="error">Failed to generate report</div>';
    }
}

// Poll report status
async function pollReportStatus(reportId, downloadToken) {
    const statusDiv = document.getElementById('reportStatus');
    
    const checkStatus = async () => {
        try {
            const response = await fetch(`${API_BASE}/reports/${reportId}/status`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (!response.ok) throw new Error('Failed to check report status');

            const data = await response.json();

            if (data.status === 'ready') {
                statusDiv.innerHTML = `
                    <div class="badge badge-success">Report ready!</div>
                    <a href="${API_BASE}/reports/download/${downloadToken}" class="btn-download" style="margin-left: 1rem;">
                        Download PDF
                    </a>
                `;
            } else if (data.status === 'error') {
                statusDiv.innerHTML = '<div class="error">Report generation failed</div>';
            } else {
                // Still generating, check again in 2 seconds
                setTimeout(checkStatus, 2000);
            }
        } catch (error) {
            console.error('Error checking report status:', error);
            statusDiv.innerHTML = '<div class="error">Failed to check report status</div>';
        }
    };

    checkStatus();
}

// Show error message
function showError(message) {
    console.error(message);
    // Could add a toast notification here
}

// Handle token expiration
function handleUnauthorized() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = '/login.html';
}

// Load AI suggestions
async function loadSuggestions() {
    try {
        const filters = getFilters();
        const params = new URLSearchParams();
        if (filters.years) params.append('years', filters.years);

        const response = await fetch(`${API_BASE}/analysis/suggestions?${params}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.status === 401) {
            handleUnauthorized();
            return;
        }

        if (!response.ok) throw new Error('Failed to load suggestions');

        const data = await response.json();
        renderSuggestions(data.suggestions);

    } catch (error) {
        console.error('Error loading suggestions:', error);
        document.getElementById('suggestionsContainer').innerHTML = 
            '<div class="error">Failed to load insights</div>';
    }
}

// Render suggestions
function renderSuggestions(suggestions) {
    const container = document.getElementById('suggestionsContainer');
    
    if (!suggestions) {
        container.innerHTML = '<div class="error">No suggestions available</div>';
        return;
    }

    let html = `
        <div class="suggestion-summary ${suggestions.priority}">
            <h3>Priority: ${suggestions.priority.toUpperCase()}</h3>
            <p>${suggestions.summary}</p>
        </div>
    `;

    // Overall suggestions
    if (suggestions.overall && suggestions.overall.length > 0) {
        html += '<div class="suggestion-section"><h3>📊 Overall Performance</h3>';
        suggestions.overall.forEach(item => {
            html += `
                <div class="suggestion-item ${item.type}">
                    <h4>${item.title}</h4>
                    <p><strong>Analysis:</strong> ${item.description}</p>
                    <p><strong>Recommendation:</strong> ${item.recommendation}</p>
                </div>
            `;
        });
        html += '</div>';
    }

    // Subject suggestions
    if (suggestions.subjects && suggestions.subjects.length > 0) {
        html += '<div class="suggestion-section"><h3>📚 Subject-Specific</h3>';
        suggestions.subjects.forEach(item => {
            html += `
                <div class="suggestion-item ${item.type}">
                    <h4>${item.subject.toUpperCase()}</h4>
                    <p><strong>Analysis:</strong> ${item.description}</p>
                    <p><strong>Recommendation:</strong> ${item.recommendation}</p>
                </div>
            `;
        });
        html += '</div>';
    }

    // Grade suggestions
    if (suggestions.grades && suggestions.grades.length > 0) {
        html += '<div class="suggestion-section"><h3>🎓 Grade-Level</h3>';
        suggestions.grades.forEach(item => {
            html += `
                <div class="suggestion-item ${item.type}">
                    <h4>Grade ${item.grade}</h4>
                    <p><strong>Analysis:</strong> ${item.description}</p>
                    <p><strong>Recommendation:</strong> ${item.recommendation}</p>
                </div>
            `;
        });
        html += '</div>';
    }

    container.innerHTML = html;
}

// Load 2018 predictions
async function load2018Predictions() {
    try {
        const filters = getFilters();
        const params = new URLSearchParams();
        if (filters.years) params.append('years', filters.years);

        const response = await fetch(`${API_BASE}/analysis/predictions/2018?${params}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.status === 401) {
            handleUnauthorized();
            return;
        }

        if (!response.ok) throw new Error('Failed to load predictions');

        const data = await response.json();
        renderPredictions(data.predictions);

    } catch (error) {
        console.error('Error loading predictions:', error);
        document.getElementById('predictionsContainer').innerHTML = 
            '<div class="error">Failed to load predictions</div>';
    }
}

// Render predictions
function renderPredictions(predictions) {
    const container = document.getElementById('predictionsContainer');
    
    if (!predictions) {
        container.innerHTML = '<div class="error">No predictions available</div>';
        return;
    }

    let html = '';

    // Overall prediction
    if (predictions.overall) {
        const overall = predictions.overall;
        html += `
            <div class="prediction-card">
                <h3>Overall Performance Prediction for 2018</h3>
                <div class="prediction-value ${overall.trend}">
                    <span class="predicted">${overall.predicted}%</span>
                    <span class="trend-badge">${overall.trend}</span>
                </div>
                <div class="confidence-range">
                    Confidence Range: ${overall.confidence.lower}% - ${overall.confidence.upper}%
                </div>
                <div class="reliability">
                    Reliability: <span class="${overall.reliability}">${overall.reliability}</span>
                </div>
            </div>
        `;
    }

    // Recommendations
    if (predictions.recommendations && predictions.recommendations.length > 0) {
        html += '<div class="recommendations-section"><h3>📋 Recommendations</h3>';
        predictions.recommendations.forEach(rec => {
            html += `
                <div class="recommendation-item ${rec.type}">
                    <h4>${rec.title}</h4>
                    <p><strong>Analysis:</strong> ${rec.description}</p>
                    <p><strong>Action Required:</strong> ${rec.action}</p>
                </div>
            `;
        });
        html += '</div>';
    }

    // Subject predictions
    if (predictions.subjects && predictions.subjects.length > 0) {
        html += '<div class="subject-predictions"><h3>Subject Predictions for 2018</h3><div class="subjects-grid">';
        predictions.subjects.forEach(subject => {
            html += `
                <div class="subject-prediction-card ${subject.trend}">
                    <h4>${subject.name.toUpperCase()}</h4>
                    <div class="predicted-value">${subject.predicted}%</div>
                    <div class="trend-indicator ${subject.trend}">
                        ${subject.trend === 'improving' ? '📈' : subject.trend === 'declining' ? '📉' : '➡️'}
                        ${subject.change > 0 ? '+' : ''}${subject.change}%
                    </div>
                </div>
            `;
        });
        html += '</div></div>';
    }

    container.innerHTML = html;
}

// Add global error handler for 401 responses
window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && event.reason.status === 401) {
        handleUnauthorized();
    }
});

// Show admin section if user is admin
function showAdminSection() {
    console.log('Checking admin access. User role:', userRole);
    console.log('Role type:', typeof userRole);
    console.log('Comparison result (userRole === "Admin"):', userRole === 'Admin');
    
    if (userRole === 'Admin') {
        console.log('User is Admin, showing admin section');
        const adminSection = document.getElementById('adminSection');
        if (adminSection) {
            adminSection.style.display = 'block';
            console.log('Admin section displayed');
        } else {
            console.error('Admin section element not found');
        }
    } else {
        console.log('User is not Admin, role is:', userRole);
    }
}

// Import dialog functions
function showImportDialog() {
    document.getElementById('importDialog').style.display = 'block';
}

function closeImportDialog() {
    document.getElementById('importDialog').style.display = 'none';
    document.getElementById('importFile').value = '';
    document.getElementById('importStatus').innerHTML = '';
}

async function uploadStudentData() {
    const fileInput = document.getElementById('importFile');
    const yearInput = document.getElementById('importYear');
    const statusDiv = document.getElementById('importStatus');
    
    if (!fileInput.files || fileInput.files.length === 0) {
        statusDiv.innerHTML = '<div class="error">Please select a file</div>';
        return;
    }
    
    const file = fileInput.files[0];
    const year = yearInput.value;
    
    // Check file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        statusDiv.innerHTML = '<div class="error">Please select an Excel file (.xlsx or .xls)</div>';
        return;
    }
    
    if (!year) {
        statusDiv.innerHTML = '<div class="error">Please select a year</div>';
        return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('year', year);
    
    statusDiv.innerHTML = '<div class="loading">Connecting to server...</div>';
    
    // Wake up the server first (Render free tier spins down when idle)
    try {
        await fetch(`${API_BASE}/auth/me`, { headers: { 'Authorization': `Bearer ${authToken}` } });
    } catch(e) { /* ignore */ }
    
    statusDiv.innerHTML = '<div class="loading">Uploading and importing data... (this may take up to 60 seconds)</div>';
    
    try {
        let response;
        // Retry up to 3 times on 502 (server cold start)
        for (let attempt = 1; attempt <= 3; attempt++) {
            response = await fetch(`${API_BASE}/students/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authToken}` },
                body: formData
            });
            if (response.status !== 502) break;
            statusDiv.innerHTML = `<div class="loading">Server warming up, retrying... (attempt ${attempt}/3)</div>`;
            await new Promise(r => setTimeout(r, 5000));
        }
        
        if (response.status === 401) {
            handleUnauthorized();
            return;
        }
        
        if (!response.ok) {
            const text = await response.text();
            console.error('Upload response:', response.status, text);
            let msg = 'Import failed';
            try { msg = JSON.parse(text).message || msg; } catch(e) {}
            throw new Error(msg);
        }
        
        const data = await response.json();
        statusDiv.innerHTML = `
            <div class="success">
                <p><strong>✓ Import Successful!</strong></p>
                <p>File: ${data.filename}</p>
                <p>Year: ${data.year}</p>
                <p>Imported: ${data.imported} students</p>
                ${data.updated ? `<p>Updated: ${data.updated} students</p>` : ''}
                ${data.duplicates ? `<p>Duplicates skipped: ${data.duplicates}</p>` : ''}
                ${data.failed ? `<p>Failed: ${data.failed}</p>` : ''}
                <p style="margin-top: 10px; color: #667eea;">Dashboard will refresh in 3 seconds...</p>
            </div>
        `;
        
        // Reload dashboard data
        setTimeout(() => {
            closeImportDialog();
            loadDashboardData();
        }, 3000);
        
    } catch (error) {
        console.error('Import error:', error);
        statusDiv.innerHTML = `<div class="error">Import failed: ${error.message}<br><small>Check browser console for details</small></div>`;
    }
}

async function showStudentManager() {
    try {
        // Fetch all students without limit
        const response = await fetch(`${API_BASE}/students?limit=10000`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.status === 401) {
            handleUnauthorized();
            return;
        }
        
        if (!response.ok) throw new Error('Failed to load students');
        
        const data = await response.json();
        
        console.log('Loaded students:', data.students.length, 'Total in DB:', data.total);
        
        // Create a new window with student list
        const newWindow = window.open('', 'Student Manager', 'width=1200,height=600');
        newWindow.document.write(`
            <html>
            <head>
                <title>Student Manager</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
                    th { background-color: #667eea; color: white; position: sticky; top: 0; }
                    tr:hover { background-color: #f5f5f5; }
                    h2 { color: #667eea; }
                    .btn-delete {
                        background: #dc3545;
                        color: white;
                        border: none;
                        padding: 5px 10px;
                        border-radius: 3px;
                        cursor: pointer;
                        font-size: 12px;
                    }
                    .btn-delete:hover {
                        background: #c82333;
                    }
                    .filter-bar {
                        margin-bottom: 15px;
                        padding: 10px;
                        background: #f8f9fa;
                        border-radius: 5px;
                        display: flex;
                        gap: 10px;
                        flex-wrap: wrap;
                        align-items: center;
                    }
                    .filter-bar select, .filter-bar input {
                        padding: 5px 10px;
                        border: 1px solid #ddd;
                        border-radius: 3px;
                    }
                    .stats {
                        background: #e7f3ff;
                        padding: 10px;
                        border-radius: 5px;
                        margin-bottom: 10px;
                        color: #004085;
                    }
                </style>
            </head>
            <body>
                <h2>Student Records</h2>
                <div class="stats">
                    <strong>Total in Database:</strong> ${data.total} students | 
                    <strong>Showing:</strong> <span id="visibleCount">${data.students.length}</span> students
                </div>
                <div class="filter-bar">
                    <select id="filterYear" onchange="filterTable()">
                        <option value="">All Years</option>
                        <option value="2015">2015</option>
                        <option value="2016">2016</option>
                        <option value="2017">2017</option>
                        <option value="2018">2018</option>
                    </select>
                    <select id="filterGrade" onchange="filterTable()">
                        <option value="">All Grades</option>
                        <option value="9">Grade 9</option>
                        <option value="10">Grade 10</option>
                        <option value="11">Grade 11</option>
                        <option value="12">Grade 12</option>
                    </select>
                    <input type="text" id="searchName" placeholder="Search by name..." onkeyup="filterTable()" />
                    <button onclick="clearFilters()" style="padding: 5px 15px; background: #6c757d; color: white; border: none; border-radius: 3px; cursor: pointer;">Clear Filters</button>
                </div>
                <table id="studentTable">
                    <thead>
                        <tr>
                            <th>Student ID</th>
                            <th>Name</th>
                            <th>Grade</th>
                            <th>Year</th>
                            <th>Gender</th>
                            <th>Age</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.students.map(s => `
                            <tr data-id="${s._id}" data-year="${s.year}" data-grade="${s.gradeLevel}" data-name="${s.name.toLowerCase()}">
                                <td>${s.studentId}</td>
                                <td>${s.name}</td>
                                <td>${s.gradeLevel}</td>
                                <td>${s.year}</td>
                                <td>${s.gender || 'N/A'}</td>
                                <td>${s.age || 'N/A'}</td>
                                <td>
                                    <button class="btn-delete" onclick="deleteStudent('${s._id}', '${s.name.replace(/'/g, "\\'")}')">Delete</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <script>
                    const authToken = '${authToken}';
                    const API_BASE = '${API_BASE}';
                    
                    function filterTable() {
                        const yearFilter = document.getElementById('filterYear').value;
                        const gradeFilter = document.getElementById('filterGrade').value;
                        const searchName = document.getElementById('searchName').value.toLowerCase();
                        const rows = document.querySelectorAll('#studentTable tbody tr');
                        
                        let visibleCount = 0;
                        rows.forEach(row => {
                            const year = row.dataset.year;
                            const grade = row.dataset.grade;
                            const name = row.dataset.name;
                            
                            const yearMatch = !yearFilter || year === yearFilter;
                            const gradeMatch = !gradeFilter || grade === gradeFilter;
                            const nameMatch = !searchName || name.includes(searchName);
                            
                            if (yearMatch && gradeMatch && nameMatch) {
                                row.style.display = '';
                                visibleCount++;
                            } else {
                                row.style.display = 'none';
                            }
                        });
                        
                        document.getElementById('visibleCount').textContent = visibleCount;
                    }
                    
                    function clearFilters() {
                        document.getElementById('filterYear').value = '';
                        document.getElementById('filterGrade').value = '';
                        document.getElementById('searchName').value = '';
                        filterTable();
                    }
                    
                    async function deleteStudent(id, name) {
                        if (!confirm('Are you sure you want to delete student: ' + name + '?')) {
                            return;
                        }
                        
                        try {
                            const response = await fetch(API_BASE + '/students/' + id, {
                                method: 'DELETE',
                                headers: {
                                    'Authorization': 'Bearer ' + authToken
                                }
                            });
                            
                            if (!response.ok) {
                                const error = await response.json();
                                throw new Error(error.message || 'Delete failed');
                            }
                            
                            alert('Student deleted successfully');
                            
                            // Remove row from table
                            const row = document.querySelector('tr[data-id="' + id + '"]');
                            if (row) {
                                row.remove();
                            }
                            
                            // Update counts
                            const totalCount = document.querySelectorAll('#studentTable tbody tr').length;
                            document.querySelector('.stats').innerHTML = '<strong>Total in Database:</strong> ' + (totalCount) + ' students | <strong>Showing:</strong> <span id="visibleCount">' + totalCount + '</span> students';
                            filterTable();
                            
                            // Notify parent window to refresh dashboard
                            if (window.opener && !window.opener.closed) {
                                window.opener.postMessage({ action: 'refreshDashboard' }, '*');
                            }
                            
                        } catch (error) {
                            alert('Failed to delete student: ' + error.message);
                        }
                    }
                </script>
            </body>
            </html>
        `);
        
    } catch (error) {
        console.error('Error loading students:', error);
        alert('Failed to load student records: ' + error.message);
    }
}


async function showAuditLogs() {
    try {
        const response = await fetch(`${API_BASE}/audit/logs?page=1&limit=50`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.status === 401) {
            handleUnauthorized();
            return;
        }
        
        if (!response.ok) throw new Error('Failed to load audit logs');
        
        const data = await response.json();
        
        let logHtml = '<h3>Recent Audit Logs</h3><table style="width:100%; border-collapse: collapse;">';
        logHtml += '<tr><th>Timestamp</th><th>User</th><th>Action</th><th>Resource</th><th>IP Address</th></tr>';
        
        data.logs.forEach(log => {
            const date = new Date(log.timestamp).toLocaleString();
            logHtml += `<tr><td>${date}</td><td>${log.username} (${log.userRole})</td><td>${log.action}</td><td>${log.entityType}</td><td>${log.ipAddress || 'N/A'}</td></tr>`;
        });
        
        logHtml += '</table>';
        
        const newWindow = window.open('', 'Audit Logs', 'width=1000,height=600');
        newWindow.document.write(`<html><head><title>Audit Logs</title><style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { border: 1px solid #ddd; }
            th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #667eea; color: white; }
            tr:hover { background-color: #f5f5f5; }
            h3 { color: #667eea; }
        </style></head><body>${logHtml}</body></html>`);
        
    } catch (error) {
        console.error('Error loading audit logs:', error);
        alert('Failed to load audit logs: ' + error.message);
    }
}

async function exportAuditLogs() {
    try {
        window.open(`${API_BASE}/audit/logs/export?token=${authToken}`, '_blank');
    } catch (error) {
        console.error('Error exporting audit logs:', error);
        alert('Failed to export audit logs');
    }
}

async function showSystemStats() {
    try {
        const response = await fetch(`${API_BASE}/audit/stats`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.status === 401) {
            handleUnauthorized();
            return;
        }
        
        if (!response.ok) throw new Error('Failed to load system stats');
        
        const data = await response.json();
        
        let statsHtml = '<h3>System Statistics</h3>';
        statsHtml += '<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-top: 20px;">';
        
        // Audit log statistics
        statsHtml += `
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
                <h4 style="color: #667eea;">Audit Logs</h4>
                <p><strong>Total Logs:</strong> ${data.totalLogs || 0}</p>
                <p><strong>Most Common Action:</strong> ${data.actionStats && data.actionStats.length > 0 ? data.actionStats[0]._id : 'N/A'}</p>
                <p><strong>Most Active Entity:</strong> ${data.entityStats && data.entityStats.length > 0 ? data.entityStats[0]._id : 'N/A'}</p>
            </div>
        `;
        
        // Top users activity
        statsHtml += `
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
                <h4 style="color: #667eea;">Top Active Users</h4>
                ${data.topUsers && data.topUsers.length > 0 ? 
                    data.topUsers.slice(0, 5).map(user => 
                        `<p><strong>${user._id}:</strong> ${user.count} actions</p>`
                    ).join('') 
                    : '<p>No user activity data</p>'}
            </div>
        `;
        
        // Action breakdown
        if (data.actionStats && data.actionStats.length > 0) {
            statsHtml += `
                <div style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
                    <h4 style="color: #667eea;">Actions Breakdown</h4>
                    ${data.actionStats.slice(0, 5).map(action => 
                        `<p><strong>${action._id}:</strong> ${action.count}</p>`
                    ).join('')}
                </div>
            `;
        }
        
        // Entity breakdown
        if (data.entityStats && data.entityStats.length > 0) {
            statsHtml += `
                <div style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
                    <h4 style="color: #667eea;">Entity Types</h4>
                    ${data.entityStats.map(entity => 
                        `<p><strong>${entity._id}:</strong> ${entity.count}</p>`
                    ).join('')}
                </div>
            `;
        }
        
        statsHtml += '</div>';
        
        const newWindow = window.open('', 'System Statistics', 'width=800,height=600');
        newWindow.document.write(`<html><head><title>System Statistics</title><style>
            body { font-family: Arial, sans-serif; padding: 20px; background: #f5f7fa; }
            h3 { color: #667eea; margin-bottom: 20px; }
            h4 { margin-top: 0; color: #667eea; }
            p { margin: 10px 0; }
        </style></head><body>${statsHtml}</body></html>`);
        
    } catch (error) {
        console.error('Error loading system stats:', error);
        alert('Failed to load system statistics: ' + error.message);
    }
}
