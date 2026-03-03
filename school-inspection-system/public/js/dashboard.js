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
        window.location.href = '/login.html';
    })
    .catch(err => {
        console.error('Logout error:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        window.location.href = '/login.html';
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
        loadInfrastructure().catch(err => console.error('Infrastructure error:', err));
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

// Load infrastructure analysis
async function loadInfrastructure() {
    try {
        const filters = getFilters();
        const params = new URLSearchParams();
        if (filters.years) params.append('years', filters.years);

        const response = await fetch(`${API_BASE}/analysis/infrastructure?${params}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.status === 401) {
            handleUnauthorized();
            return;
        }

        if (!response.ok) throw new Error('Failed to load infrastructure');

        const data = await response.json();
        renderInfrastructure(data.infrastructure);

    } catch (error) {
        console.error('Error loading infrastructure:', error);
        document.getElementById('infrastructureContainer').innerHTML = 
            '<div class="error">Failed to load infrastructure analysis</div>';
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

// Render infrastructure analysis
function renderInfrastructure(infrastructure) {
    const container = document.getElementById('infrastructureContainer');
    
    if (!infrastructure || infrastructure.length === 0) {
        container.innerHTML = '<div class="info">No infrastructure data available</div>';
        return;
    }

    let html = '<div class="infrastructure-grid">';
    
    infrastructure.forEach(item => {
        const impactClass = item.impact === 'positive' ? 'positive' : item.impact === 'negative' ? 'negative' : 'neutral';
        
        html += `
            <div class="infrastructure-card ${impactClass}">
                <h4>${item.facility}</h4>
                <div class="facility-type">${item.type}</div>
                <div class="impact-indicator ${impactClass}">
                    ${item.impact === 'positive' ? '📈' : item.impact === 'negative' ? '📉' : '➡️'}
                    Impact: ${item.impactScore > 0 ? '+' : ''}${item.impactScore}%
                </div>
                <p class="description">${item.description}</p>
                <p class="recommendation"><strong>Recommendation:</strong> ${item.recommendation}</p>
            </div>
        `;
    });
    
    html += '</div>';
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
    if (userRole === 'Admin') {
        const adminSection = document.getElementById('adminSection');
        if (adminSection) {
            adminSection.style.display = 'block';
        }
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
    const statusDiv = document.getElementById('importStatus');
    
    if (!fileInput.files || fileInput.files.length === 0) {
        statusDiv.innerHTML = '<div class="error">Please select a file</div>';
        return;
    }
    
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);
    
    statusDiv.innerHTML = '<div class="loading">Uploading and importing data...</div>';
    
    try {
        const response = await fetch(`/students/import`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer `
            },
            body: formData
        });
        
        if (response.status === 401) {
            handleUnauthorized();
            return;
        }
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Import failed');
        }
        
        const data = await response.json();
        statusDiv.innerHTML = `<div class="success">Successfully imported  students!</div>`;
        
        // Reload dashboard data
        setTimeout(() => {
            closeImportDialog();
            loadDashboardData();
        }, 2000);
        
    } catch (error) {
        console.error('Import error:', error);
        statusDiv.innerHTML = `<div class="error">Import failed: </div>`;
    }
}

function showStudentManager() {
    alert('Student Manager: This feature allows you to view, edit, and delete individual student records. Coming soon!');
}

function showUserList() {
    alert('User Management: This feature allows you to view and manage user accounts. Coming soon!');
}

async function showAuditLogs() {
    try {
        const response = await fetch(`/audit/logs?page=1&limit=50`, {
            headers: {
                'Authorization': `Bearer `
            }
        });
        
        if (response.status === 401) {
            handleUnauthorized();
            return;
        }
        
        if (!response.ok) throw new Error('Failed to load audit logs');
        
        const data = await response.json();
        
        let logHtml = '<h3>Recent Audit Logs</h3><table style=\"width:100%; border-collapse: collapse;\">';
        logHtml += '<tr><th>Timestamp</th><th>User</th><th>Action</th><th>Resource</th></tr>';
        
        data.logs.forEach(log => {
            const date = new Date(log.timestamp).toLocaleString();
            logHtml += `<tr><td></td><td></td><td></td><td></td></tr>`;
        });
        
        logHtml += '</table>';
        
        const newWindow = window.open('', 'Audit Logs', 'width=800,height=600');
        newWindow.document.write(`<html><head><title>Audit Logs</title><style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { border: 1px solid #ddd; }
            th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #4CAF50; color: white; }
        </style></head><body></body></html>`);
        
    } catch (error) {
        console.error('Error loading audit logs:', error);
        alert('Failed to load audit logs');
    }
}

async function exportAuditLogs() {
    try {
        window.open(`/audit/logs/export?token=`, '_blank');
    } catch (error) {
        console.error('Error exporting audit logs:', error);
        alert('Failed to export audit logs');
    }
}

function showSystemStats() {
    alert('System Statistics: View detailed system usage metrics, user activity, and performance data. Coming soon!');
}
