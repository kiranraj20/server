import { fetchWithAuth } from './utils.js';

// Make functions globally available for onclick handlers
window.showCreateCategoryForm = showCreateCategoryForm;
window.createCategory = createCategory;
window.editCategory = editCategory;
window.deleteCategory = deleteCategory;
window.updateCategory = updateCategory;

export async function loadCategories() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="container-fluid">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2>Categories</h2>
                <button class="btn btn-primary" onclick="showCreateCategoryForm()">
                    <i class="bi bi-plus-lg"></i> Add Category
                </button>
            </div>
            <div class="card">
                <div class="card-body">
                    <div id="categoriesTable">
                        <div class="text-center">
                            <div class="spinner-border" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Create Category Modal -->
        <div class="modal fade" id="createCategoryModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Create New Category</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="createCategoryForm">
                            <div class="mb-3">
                                <label class="form-label">Name</label>
                                <input type="text" class="form-control" name="name" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Description</label>
                                <textarea class="form-control" name="description" rows="3"></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary" onclick="createCategory()">Create Category</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Edit Category Modal -->
        <div class="modal fade" id="editCategoryModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Edit Category</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="editCategoryForm">
                            <input type="hidden" name="categoryId">
                            <div class="mb-3">
                                <label class="form-label">Name</label>
                                <input type="text" class="form-control" name="name" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Description</label>
                                <textarea class="form-control" name="description" rows="3"></textarea>
                            </div>
                            <div class="mb-3">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="active" id="editCategoryActive">
                                    <label class="form-check-label" for="editCategoryActive">
                                        Active
                                    </label>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary" onclick="updateCategory()">Update Category</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    await fetchCategories();
}

async function fetchCategories() {
    try {
        const response = await fetchWithAuth('/admin/categories');
        const categories = await response.json();
        
        const categoriesTable = document.getElementById('categoriesTable');
        if (categories.length === 0) {
            categoriesTable.innerHTML = '<p class="text-center">No categories found</p>';
            return;
        }

        categoriesTable.innerHTML = `
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Description</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${categories.map(category => `
                            <tr>
                                <td>${category.name}</td>
                                <td>${category.description || '-'}</td>
                                <td>
                                    <span class="badge bg-${category.active ? 'success' : 'danger'}">
                                        ${category.active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td>
                                    <button class="btn btn-sm btn-primary" onclick="editCategory('${category._id}')">
                                        <i class="bi bi-pencil"></i>
                                    </button>
                                    <button class="btn btn-sm btn-danger" onclick="deleteCategory('${category._id}')">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        console.error('Error fetching categories:', error);
        document.getElementById('categoriesTable').innerHTML = 
            '<p class="text-center text-danger">Error loading categories</p>';
    }
}

function showCreateCategoryForm() {
    const modal = new bootstrap.Modal(document.getElementById('createCategoryModal'));
    modal.show();
}

async function createCategory() {
    const form = document.getElementById('createCategoryForm');
    const formData = new FormData(form);
    const categoryData = Object.fromEntries(formData.entries());

    try {
        const response = await fetchWithAuth('/admin/categories', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(categoryData)
        });

        if (response.ok) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('createCategoryModal'));
            modal.hide();
            form.reset();
            await fetchCategories();
            alert('Category created successfully');
        } else {
            const data = await response.json();
            throw new Error(data.message || 'Error creating category');
        }
    } catch (error) {
        console.error('Error creating category:', error);
        alert(error.message || 'Error creating category');
    }
}

async function editCategory(categoryId) {
    try {
        const response = await fetchWithAuth(`/admin/categories/${categoryId}`);
        const category = await response.json();
        
        const form = document.getElementById('editCategoryForm');
        form.categoryId.value = category._id;
        form.name.value = category.name;
        form.description.value = category.description || '';
        form.active.checked = category.active;

        const modal = new bootstrap.Modal(document.getElementById('editCategoryModal'));
        modal.show();
    } catch (error) {
        console.error('Error fetching category details:', error);
        alert('Error loading category details');
    }
}

async function updateCategory() {
    const form = document.getElementById('editCategoryForm');
    const categoryId = form.categoryId.value;
    const formData = new FormData(form);
    const categoryData = Object.fromEntries(formData.entries());
    
    // Convert active to boolean
    categoryData.active = form.active.checked;

    try {
        const response = await fetchWithAuth(`/admin/categories/${categoryId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(categoryData)
        });

        if (response.ok) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('editCategoryModal'));
            modal.hide();
            await fetchCategories();
            alert('Category updated successfully');
        } else {
            const data = await response.json();
            throw new Error(data.message || 'Error updating category');
        }
    } catch (error) {
        console.error('Error updating category:', error);
        alert(error.message || 'Error updating category');
    }
}

async function deleteCategory(categoryId) {
    if (!confirm('Are you sure you want to delete this category? This may affect products using this category.')) {
        return;
    }

    try {
        const response = await fetchWithAuth(`/admin/categories/${categoryId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            await fetchCategories();
            alert('Category deleted successfully');
        } else {
            const data = await response.json();
            throw new Error(data.message || 'Error deleting category');
        }
    } catch (error) {
        console.error('Error deleting category:', error);
        alert(error.message || 'Error deleting category');
    }
} 