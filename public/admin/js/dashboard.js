import { loadProducts } from './modules/products.js';
import { loadCategories } from './modules/categories.js';
import { loadOrders } from './modules/orders.js';
import { loadUsers } from './modules/users.js';
import { fetchWithAuth } from './modules/utils.js';
import { auth, initializeFirebase } from './firebase-config.js';

console.log('Dashboard.js loaded');

// Initialize Firebase before setting up auth observer
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM Content Loaded');
    try {
        await initializeFirebase();
        // Check if main-content exists
        const mainContent = document.getElementById('main-content');
        if (!mainContent) {
            console.error('Main content container not found!');
            return;
        }
        console.log('Main content container found');
    } catch (error) {
        console.error('Failed to initialize Firebase:', error);
        window.location.href = '/admin/login';
    }
});

// Move your auth.onAuthStateChanged to after DOMContentLoaded
auth.onAuthStateChanged(async (user) => {
    try {
        console.log('Auth state changed:', user ? 'User logged in' : 'No user');
        if (user) {
            // User is signed in
            const idToken = await user.getIdToken();
            console.log('Got ID token, verifying admin status...');
            
            // Verify admin status
            const response = await fetch('/auth/verify-admin', {
                headers: {
                    'Authorization': `Bearer ${idToken}`
                }
            });

            if (response.ok) {
                const adminData = await response.json();
                console.log('Admin verified, updating UI...');
                updateAdminUI(adminData.admin);
                
                // Clear any existing active states first
                document.querySelectorAll('#sidebar a').forEach(link => {
                    link.classList.remove('active');
                });

                // Set dashboard as active and load admin name
                const dashboardLink = document.querySelector('#sidebar a[data-section="dashboard"]');
                if (dashboardLink) {
                    dashboardLink.classList.add('active');
                    await loadDashboardContent();
                } else {
                    console.error('Dashboard link not found in sidebar');
                }
                
                // Add sidebar navigation listeners
                document.querySelectorAll('#sidebar a').forEach(link => {
                    link.addEventListener('click', function(e) {
                        e.preventDefault();
                        console.log('Link clicked:', this.dataset.section);
                        const section = this.dataset.section;
                        if (section) {
                            loadSection(section);
                        }
                    });
                });
            } else {
                console.log('Not an admin, redirecting to setup...');
                window.location.href = '/admin/setup';
            }
        } else {
            console.log('No user signed in, redirecting to login...');
            window.location.href = '/admin/login';
        }
    } catch (error) {
        console.error('Error in auth state change handler:', error);
        window.location.href = '/admin/login';
    }
});

function showLoadingState() {
    const cards = ['totalProducts', 'totalOrders', 'totalUsers', 'totalRevenue'];
    cards.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = '<div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Loading...</span></div>';
        }
    });
}

async function loadDashboardContent() {
    try {
        console.log('Loading dashboard content...');
        const user = auth.currentUser;
        if (!user) {
            console.error('No user found');
            window.location.href = '/admin/login';
            return;
        }

        const mainContent = document.getElementById('main-content');
        if (!mainContent) {
            console.error('Main content element not found');
            return;
        }

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

        showLoadingState();
        await loadStatistics();
        await initializeCharts();
        console.log('Dashboard content loaded successfully');
    } catch (error) {
        console.error('Error in loadDashboardContent:', error);
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="alert alert-danger">
                    Error loading dashboard content. Please try refreshing the page.
                </div>
            `;
        }
    }
}

async function loadStatistics() {
    try {
        console.log('Fetching statistics...');
        const response = await fetchWithAuth('/admin/statistics');
        console.log('Statistics response:', response);
        const data = await response.json();
        console.log('Statistics data:', data);
        
        document.getElementById('totalProducts').textContent = data.totalProducts || 0;
        document.getElementById('totalOrders').textContent = data.totalOrders || 0;
        document.getElementById('totalUsers').textContent = data.totalUsers || 0;
        document.getElementById('totalRevenue').textContent = `$${data.totalRevenue || 0}`;
    } catch (error) {
        console.error('Error loading statistics:', error);
        // Show error message to user
        const elements = ['totalProducts', 'totalOrders', 'totalUsers', 'totalRevenue'];
        elements.forEach(id => {
            const element = document.getElementById(id);
            element.textContent = 'Error loading data';
            element.style.color = 'red';
        });
    }
}

async function initializeCharts() {
    try {
        console.log('Fetching chart data...');
        const response = await fetchWithAuth('/admin/dashboard/charts');
        console.log('Charts response:', response);
        const data = await response.json();
        console.log('Charts data:', data);

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

// Update the logout function
window.logout = async function() {
    try {
        await auth.signOut();
        window.location.href = '/admin/login';
    } catch (error) {
        console.error('Logout error:', error);
        alert('Error logging out');
    }
};