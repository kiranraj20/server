import { fetchWithAuth } from './utils.js';

// Make functions globally available for onclick handlers
window.showCreateProductForm = showCreateProductForm;
window.createProduct = createProduct;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.updateProduct = updateProduct;

// Add a function to fetch categories
async function fetchCategoryOptions() {
    try {
        const response = await fetchWithAuth('/api/admin/categories');
        const categories = await response.json();
        return categories
            .filter(category => category.active) // Only show active categories
            .map(category => `
                <option value="${category.name}">${category.name}</option>
            `).join('');
    } catch (error) {
        console.error('Error fetching categories:', error);
        return '<option value="">Error loading categories</option>';
    }
}

export async function loadProducts() {
    const mainContent = document.getElementById('main-content');
    
    // Fetch categories first
    const categoryOptions = await fetchCategoryOptions();
    
    mainContent.innerHTML = `
        <div class="container-fluid">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2>Products</h2>
                <button class="btn btn-primary" onclick="showCreateProductForm()">
                    <i class="bi bi-plus-lg"></i> Add Product
                </button>
            </div>
            <div class="card">
                <div class="card-body">
                    <div id="productsTable">
                        <div class="text-center">
                            <div class="spinner-border" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Create Product Modal -->
        <div class="modal fade" id="createProductModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Create New Product</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="createProductForm">
                            <div class="mb-3">
                                <label class="form-label">Name</label>
                                <input type="text" class="form-control" name="name" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Description</label>
                                <textarea class="form-control" name="description" rows="3" required></textarea>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Price</label>
                                <input type="number" class="form-control" name="price" step="0.01" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Stock</label>
                                <input type="number" class="form-control" name="stock" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Category</label>
                                <select class="form-control" name="category" required>
                                    <option value="">Select Category</option>
                                    ${categoryOptions}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Size</label>
                                <select class="form-control" name="size" required>
                                    <option value="">Select Size</option>
                                    <option value="small">Small</option>
                                    <option value="medium">Medium</option>
                                    <option value="large">Large</option>
                                    <option value="huge">Huge (GajaMala)</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Image URL</label>
                                <input type="url" class="form-control" name="image_url">
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary" onclick="createProduct()">Create Product</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Edit Product Modal -->
        <div class="modal fade" id="editProductModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Edit Product</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="editProductForm">
                            <input type="hidden" name="productId">
                            <div class="mb-3">
                                <label class="form-label">Name</label>
                                <input type="text" class="form-control" name="name" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Description</label>
                                <textarea class="form-control" name="description" rows="3" required></textarea>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Price</label>
                                <input type="number" class="form-control" name="price" step="0.01" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Stock</label>
                                <input type="number" class="form-control" name="stock" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Category</label>
                                <select class="form-control" name="category" required>
                                    <option value="">Select Category</option>
                                    ${categoryOptions}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Size</label>
                                <select class="form-control" name="size" required>
                                    <option value="">Select Size</option>
                                    <option value="small">Small</option>
                                    <option value="medium">Medium</option>
                                    <option value="large">Large</option>
                                    <option value="huge">Huge (GajaMala)</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Image URL</label>
                                <input type="url" class="form-control" name="image_url">
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary" onclick="updateProduct()">Update Product</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    await fetchProducts();
}

async function fetchProducts() {
    try {
        const response = await fetchWithAuth('/api/admin/products');
        const products = await response.json();
        
        const productsTable = document.getElementById('productsTable');
        if (products.length === 0) {
            productsTable.innerHTML = '<p class="text-center">No products found</p>';
            return;
        }

        productsTable.innerHTML = `
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Image</th>
                            <th>Name</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Category</th>
                            <th>Size</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${products.map(product => `
                            <tr>
                                <td>
                                    <img src="${product.image_url || '/admin/images/no-image.jpg'}" 
                                         alt="${product.name}" 
                                         style="width: 50px; height: 50px; object-fit: cover;">
                                </td>
                                <td>${product.name}</td>
                                <td>₹${product.price.toFixed(2)}</td>
                                <td>${product.stock}</td>
                                <td>${product.category}</td>
                                <td>${product.size.charAt(0).toUpperCase() + product.size.slice(1)}</td>
                                <td>
                                    <button class="btn btn-sm btn-primary" onclick="editProduct('${product._id.toString()}')">
                                        <i class="bi bi-pencil"></i>
                                    </button>
                                    <button class="btn btn-sm btn-danger" onclick="deleteProduct('${product._id.toString()}')">
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
        console.error('Error fetching products:', error);
        document.getElementById('productsTable').innerHTML = 
            '<p class="text-center text-danger">Error loading products</p>';
    }
}

function showCreateProductForm() {
    const modal = new bootstrap.Modal(document.getElementById('createProductModal'));
    modal.show();
}

async function createProduct() {
    const form = document.getElementById('createProductForm');
    const formData = new FormData(form);
    const productData = Object.fromEntries(formData.entries());

    // Convert price and stock to numbers
    productData.price = parseFloat(productData.price);
    productData.stock = parseInt(productData.stock);

    try {
        const response = await fetchWithAuth('/api/admin/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(productData)
        });

        if (response.ok) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('createProductModal'));
            modal.hide();
            form.reset();
            await fetchProducts(); // Refresh products list
            alert('Product created successfully');
        } else {
            const data = await response.json();
            throw new Error(data.message || 'Error creating product');
        }
    } catch (error) {
        console.error('Error creating product:', error);
        alert(error.message || 'Error creating product');
    }
}

async function editProduct(productId) {
    try {
        console.log('Editing product with ID:', productId);
        
        if (!productId) {
            throw new Error('Product ID is missing');
        }

        const response = await fetchWithAuth(`/api/admin/products/${productId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch product: ${response.status}`);
        }
        
        const product = await response.json();
        console.log('Fetched product:', product);
        
        // Refresh category options when editing
        const categoryOptions = await fetchCategoryOptions();
        const categorySelect = document.querySelector('#editProductForm select[name="category"]');
        categorySelect.innerHTML = `
            <option value="">Select Category</option>
            ${categoryOptions}
        `;
        
        const form = document.getElementById('editProductForm');
        form.productId.value = product._id;
        form.name.value = product.name;
        form.description.value = product.description;
        form.price.value = product.price;
        form.stock.value = product.stock;
        form.category.value = product.category;
        form.size.value = product.size;
        form.image_url.value = product.image_url || '';

        const modal = new bootstrap.Modal(document.getElementById('editProductModal'));
        modal.show();
    } catch (error) {
        console.error('Error fetching product details:', error);
        alert('Error loading product details: ' + error.message);
    }
}

async function updateProduct() {
    const form = document.getElementById('editProductForm');
    const productId = form.productId.value;
    const formData = new FormData(form);
    const productData = Object.fromEntries(formData.entries());

    // Convert price and stock to numbers
    productData.price = parseFloat(productData.price);
    productData.stock = parseInt(productData.stock);

    try {
        const response = await fetchWithAuth(`/api/admin/products/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(productData)
        });

        if (response.ok) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('editProductModal'));
            modal.hide();
            await fetchProducts(); // Refresh products list
            alert('Product updated successfully');
        } else {
            const data = await response.json();
            throw new Error(data.message || 'Error updating product');
        }
    } catch (error) {
        console.error('Error updating product:', error);
        alert(error.message || 'Error updating product');
    }
}

async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) {
        return;
    }

    try {
        const response = await fetchWithAuth(`/api/admin/products/${productId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            await fetchProducts(); // Refresh products list
            alert('Product deleted successfully');
        } else {
            const data = await response.json();
            throw new Error(data.message || 'Error deleting product');
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        alert(error.message || 'Error deleting product');
    }
} 