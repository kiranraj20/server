import { fetchWithAuth } from './utils.js';

export async function loadOrders() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="container-fluid">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2>Orders</h2>
            </div>
            <div class="card">
                <div class="card-body">
                    <div id="ordersTable">
                        <div class="text-center">
                            <div class="spinner-border" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    await fetchOrders();
}

async function fetchOrders() {
    try {
        const response = await fetchWithAuth('/api/admin/orders');
        const orders = await response.json();
        
        const ordersTable = document.getElementById('ordersTable');
        if (orders.length === 0) {
            ordersTable.innerHTML = '<p class="text-center">No orders found</p>';
            return;
        }

        ordersTable.innerHTML = `
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Order #</th>
                            <th>Customer</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${orders.map(order => `
                            <tr>
                                <td>${order.orderNumber}</td>
                                <td>${order.customer.name}</td>
                                <td>$${order.totalAmount.toFixed(2)}</td>
                                <td>
                                    <span class="badge bg-${getStatusColor(order.status)}">
                                        ${order.status}
                                    </span>
                                </td>
                                <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                                <td>
                                    <button class="btn btn-sm btn-info" onclick="viewOrder('${order._id}')">
                                        <i class="bi bi-eye"></i>
                                    </button>
                                    <button class="btn btn-sm btn-primary" onclick="updateOrderStatus('${order._id}')">
                                        <i class="bi bi-arrow-clockwise"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        console.error('Error fetching orders:', error);
        document.getElementById('ordersTable').innerHTML = 
            '<p class="text-center text-danger">Error loading orders</p>';
    }
}

function getStatusColor(status) {
    const colors = {
        'pending': 'warning',
        'processing': 'info',
        'shipped': 'primary',
        'delivered': 'success',
        'cancelled': 'danger'
    };
    return colors[status] || 'secondary';
}

// Make functions globally available
window.viewOrder = viewOrder;
window.updateOrderStatus = updateOrderStatus;

function viewOrder(id) {
    // Implement view order details
}

function updateOrderStatus(id) {
    // Implement update order status
} 