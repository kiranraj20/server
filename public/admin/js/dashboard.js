import { loadProducts } from './modules/products.js';
import { loadCategories } from './modules/categories.js';
import { loadOrders } from './modules/orders.js';
import { loadUsers } from './modules/users.js';
import { fetchWithAuth } from './modules/utils.js';

document.addEventListener('DOMContentLoaded', async function() {
    try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            window.location.href = '/admin/setup';
            return;
        }

        const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
        updateAdminUI(adminInfo);
        
        // Set initial active state to dashboard
        document.querySelector('#sidebar a[data-section="dashboard"]')?.classList.add('active');
        await loadDashboardContent();
        
        // Handle sidebar navigation
        document.querySelectorAll('#sidebar a').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const section = this.dataset.section;
                if (section) {
                    loadSection(section);
                }
            });
        });
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        window.location.href = '/api/admin/setup';
    }
});

async function loadDashboardContent() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="row">
            <div class="col-lg-3 col-6">
                <div class="card stats-card primary">
                    <div class="card-body">
                        <h5>Total Products</h5>
                        <h3 id="totalProducts">Loading...</h3>
                    </div>
                </div>
            </div>
            <div class="col-lg-3 col-6">
                <div class="card stats-card success">
                    <div class="card-body">
                        <h5>Total Orders</h5>
                        <h3 id="totalOrders">Loading...</h3>
                    </div>
                </div>
            </div>
            <div class="col-lg-3 col-6">
                <div class="card stats-card warning">
                    <div class="card-body">
                        <h5>Total Users</h5>
                        <h3 id="totalUsers">Loading...</h3>
                    </div>
                </div>
            </div>
            <div class="col-lg-3 col-6">
                <div class="card stats-card danger">
                    <div class="card-body">
                        <h5>Total Revenue</h5>
                        <h3 id="totalRevenue">Loading...</h3>
                    </div>
                </div>
            </div>
        </div>

        <div class="row mt-4">
            <div class="col-lg-8">
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title">Revenue Overview</h5>
                    </div>
                    <div class="card-body">
                        <canvas id="revenueChart" style="height: 300px;"></canvas>
                    </div>
                </div>
            </div>
            <div class="col-lg-4">
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title">Order Status</h5>
                    </div>
                    <div class="card-body">
                        <canvas id="orderStatusChart" style="height: 300px;"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <div class="row mt-4">
            <div class="col-lg-6">
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title">Top Products</h5>
                    </div>
                    <div class="card-body">
                        <canvas id="topProductsChart" style="height: 300px;"></canvas>
                    </div>
                </div>
            </div>
            <div class="col-lg-6">
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title">Category Distribution</h5>
                    </div>
                    <div class="card-body">
                        <canvas id="categoryChart" style="height: 300px;"></canvas>
                    </div>
                </div>
            </div>
        </div>
    `;

    await loadStatistics();
    await initializeCharts();
}

async function loadStatistics() {
    try {
        const response = await fetchWithAuth('/api/admin/statistics');
        const data = await response.json();
        
        document.getElementById('totalProducts').textContent = data.totalProducts || 0;
        document.getElementById('totalOrders').textContent = data.totalOrders || 0;
        document.getElementById('totalUsers').textContent = data.totalUsers || 0;
        document.getElementById('totalRevenue').textContent = `$${data.totalRevenue || 0}`;
    } catch (error) {
        console.error('Error loading statistics:', error);
        const elements = ['totalProducts', 'totalOrders', 'totalUsers', 'totalRevenue'];
        elements.forEach(id => {
            document.getElementById(id).textContent = 'Error';
        });
    }
}

async function initializeCharts() {
    try {
        const response = await fetchWithAuth('/api/admin/dashboard/charts');
        const data = await response.json();

        // Revenue Chart (Line chart)
        new Chart(document.getElementById('revenueChart'), {
            type: 'line',
            data: {
                labels: data.revenue.labels,
                datasets: [{
                    label: 'Revenue',
                    data: data.revenue.data,
                    borderColor: '#28a745',
                    tension: 0.1,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: value => '$' + value
                        }
                    }
                }
            }
        });

        // Order Status Chart (Doughnut chart)
        new Chart(document.getElementById('orderStatusChart'), {
            type: 'doughnut',
            data: {
                labels: data.orderStatus.labels,
                datasets: [{
                    data: data.orderStatus.data,
                    backgroundColor: [
                        '#ffc107', // pending
                        '#17a2b8', // processing
                        '#007bff', // shipped
                        '#28a745', // delivered
                        '#dc3545'  // cancelled
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });

        // Top Products Chart (Bar chart)
        new Chart(document.getElementById('topProductsChart'), {
            type: 'bar',
            data: {
                labels: data.topProducts.labels,
                datasets: [{
                    label: 'Sales',
                    data: data.topProducts.data,
                    backgroundColor: '#007bff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        // Category Distribution Chart (Pie chart)
        new Chart(document.getElementById('categoryChart'), {
            type: 'pie',
            data: {
                labels: data.categories.labels,
                datasets: [{
                    data: data.categories.data,
                    backgroundColor: [
                        '#007bff',
                        '#28a745',
                        '#ffc107',
                        '#dc3545',
                        '#17a2b8',
                        '#6610f2'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });

    } catch (error) {
        console.error('Error initializing charts:', error);
        // Show error message in each chart container
        ['revenueChart', 'orderStatusChart', 'topProductsChart', 'categoryChart'].forEach(id => {
            const canvas = document.getElementById(id);
            const ctx = canvas.getContext('2d');
            ctx.font = '14px Arial';
            ctx.fillStyle = '#dc3545';
            ctx.textAlign = 'center';
            ctx.fillText('Error loading chart data', canvas.width / 2, canvas.height / 2);
        });
    }
}

function loadSection(section) {
    // Remove active class from all sidebar links
    document.querySelectorAll('#sidebar a').forEach(link => {
        link.classList.remove('active');
    });

    // Add active class to current section
    const currentLink = document.querySelector(`#sidebar a[data-section="${section}"]`);
    if (currentLink) {
        currentLink.classList.add('active');
    }

    switch(section) {
        case 'products':
            loadProducts();
            break;
        case 'categories':
            loadCategories();
            break;
        case 'orders':
            loadOrders();
            break;
        case 'users':
            loadUsers();
            break;
        default:
            // Add active class to dashboard link for default case
            document.querySelector('#sidebar a[data-section="dashboard"]')?.classList.add('active');
            loadDashboardContent();
    }
}

function updateAdminUI(adminInfo) {
    const adminName = document.createElement('div');
    adminName.className = 'admin-info';
    adminName.innerHTML = `
        <div class="admin-name">${adminInfo.name || 'Admin'}</div>
        <div class="admin-email">${adminInfo.email || ''}</div>
    `;
    const header = document.querySelector('.sidebar-header');
    const existingInfo = header.querySelector('.admin-info');
    if (existingInfo) {
        existingInfo.remove();
    }
    header.appendChild(adminName);
}

// Make logout function globally available
window.logout = function() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
    window.location.href = '/api/admin/setup';
};