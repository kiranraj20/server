import { fetchWithAuth } from './utils.js';

export async function loadUsers() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="container-fluid">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2>Users</h2>
            </div>
            <div class="card">
                <div class="card-body">
                    <div id="usersTable">
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

    await fetchUsers();
}

async function fetchUsers() {
    try {
        const response = await fetchWithAuth('/api/admin/users');
        const users = await response.json();
        
        const usersTable = document.getElementById('usersTable');
        if (users.length === 0) {
            usersTable.innerHTML = '<p class="text-center">No users found</p>';
            return;
        }

        usersTable.innerHTML = `
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Joined</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map(user => `
                            <tr>
                                <td>${user.name}</td>
                                <td>${user.email}</td>
                                <td>${user.role}</td>
                                <td>
                                    <span class="badge bg-${user.active ? 'success' : 'danger'}">
                                        ${user.active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                                <td>
                                    <button class="btn btn-sm btn-info" onclick="viewUser('${user._id}')">
                                        <i class="bi bi-eye"></i>
                                    </button>
                                    <button class="btn btn-sm btn-${user.active ? 'warning' : 'success'}" 
                                            onclick="toggleUserStatus('${user._id}', ${!user.active})">
                                        <i class="bi bi-${user.active ? 'pause' : 'play'}"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        console.error('Error fetching users:', error);
        document.getElementById('usersTable').innerHTML = 
            '<p class="text-center text-danger">Error loading users</p>';
    }
}

// Make functions globally available
window.viewUser = viewUser;
window.toggleUserStatus = toggleUserStatus;

function viewUser(id) {
    // Implement view user details
}

async function toggleUserStatus(id, active) {
    try {
        const response = await fetchWithAuth('/api/admin/users/status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId: id, active })
        });

        if (response.ok) {
            await fetchUsers(); // Refresh users list
        } else {
            throw new Error('Failed to update user status');
        }
    } catch (error) {
        console.error('Error updating user status:', error);
        alert('Error updating user status');
    }
} 