const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const Category = require('../models/Category');

// Protected API routes
router.get('/statistics', [auth, admin], async (req, res) => {
    try {
        const totalProducts = await Product.countDocuments();
        const totalOrders = await Order.countDocuments();
        const totalUsers = await User.countDocuments();
        const totalRevenue = await Order.aggregate([
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);

        res.json({
            totalProducts,
            totalOrders,
            totalUsers,
            totalRevenue: totalRevenue[0]?.total || 0
        });
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({ message: 'Error fetching statistics' });
    }
});

// Get all products
router.get('/products', [auth, admin], async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Error fetching products' });
    }
});

// Get single product
router.get('/products/:id', [auth, admin], async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ message: 'Error fetching product' });
    }
});

// Create new product
router.post('/products', [auth, admin], async (req, res) => {
    try {
        const { name, description, price, stock, category, size } = req.body;
        if (!name || !description || !price || !stock || !category || !size) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const product = new Product({
            name,
            description,
            price: parseFloat(price),
            stock: parseInt(stock),
            category,
            size,
            image_url: req.body.image_url || ''
        });

        await product.save();
        res.status(201).json({
            message: 'Product created successfully',
            product
        });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ 
            message: 'Error creating product',
            error: error.message 
        });
    }
});

// Update product
router.put('/products/:id', [auth, admin], async (req, res) => {
    try {
        const { name, description, price, stock, category, size, image_url } = req.body;
        
        if (!name || !description || !price || !stock || !category || !size) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            {
                name,
                description,
                price: parseFloat(price),
                stock: parseInt(stock),
                category,
                size,
                image_url: image_url || ''
            },
            { new: true }
        );

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.json({
            message: 'Product updated successfully',
            product
        });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Error updating product' });
    }
});

// Delete product
router.delete('/products/:id', [auth, admin], async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: 'Error deleting product' });
    }
});

// Categories Routes
router.get('/categories', [auth, admin], async (req, res) => {
    try {
        const categories = await Category.find().sort({ createdAt: -1 });
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Error fetching categories' });
    }
});

router.post('/categories', [auth, admin], async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'Category name is required' });
        }

        const category = new Category({
            name,
            description
        });

        await category.save();
        res.status(201).json({
            message: 'Category created successfully',
            category
        });
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ 
            message: 'Error creating category',
            error: error.message 
        });
    }
});

// Get single category
router.get('/categories/:id', [auth, admin], async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.json(category);
    } catch (error) {
        console.error('Error fetching category:', error);
        res.status(500).json({ message: 'Error fetching category' });
    }
});

// Update category
router.put('/categories/:id', [auth, admin], async (req, res) => {
    try {
        const { name, description, active } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'Category name is required' });
        }

        const category = await Category.findByIdAndUpdate(
            req.params.id,
            { name, description, active },
            { new: true }
        );

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        res.json({
            message: 'Category updated successfully',
            category
        });
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ message: 'Error updating category' });
    }
});

// Delete category
router.delete('/categories/:id', [auth, admin], async (req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ message: 'Error deleting category' });
    }
});

// Orders Routes
router.get('/orders', [auth, admin], async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('items.product')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Error fetching orders' });
    }
});

router.post('/orders/status', [auth, admin], async (req, res) => {
    try {
        const { orderId, status } = req.body;
        const order = await Order.findByIdAndUpdate(
            orderId,
            { status },
            { new: true }
        );
        res.json({
            message: 'Order status updated successfully',
            order
        });
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ message: 'Error updating order' });
    }
});

// Users Routes
router.get('/users', [auth, admin], async (req, res) => {
    try {
        const users = await User.find()
            .select('-password_hash')
            .sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Error fetching users' });
    }
});

router.post('/users/status', [auth, admin], async (req, res) => {
    try {
        const { userId, active } = req.body;
        const user = await User.findByIdAndUpdate(
            userId,
            { active },
            { new: true }
        ).select('-password_hash');
        res.json({
            message: 'User status updated successfully',
            user
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Error updating user' });
    }
});

router.get('/dashboard/charts', [auth, admin], async (req, res) => {
    try {
        // Get data for the last 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        // Revenue data
        const revenueData = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    total: { $sum: "$totalAmount" }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // Order status distribution
        const orderStatus = await Order.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Top selling products
        const topProducts = await Order.aggregate([
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.product",
                    totalSold: { $sum: "$items.quantity" }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "product"
                }
            }
        ]);

        // Category distribution
        const categories = await Product.aggregate([
            {
                $group: {
                    _id: "$category",
                    count: { $sum: 1 }
                }
            }
        ]);

        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        res.json({
            revenue: {
                labels: revenueData.map(item => months[item._id - 1]),
                data: revenueData.map(item => item.total)
            },
            orderStatus: {
                labels: orderStatus.map(item => item._id),
                data: orderStatus.map(item => item.count)
            },
            topProducts: {
                labels: topProducts.map(item => item.product[0]?.name || 'Unknown'),
                data: topProducts.map(item => item.totalSold)
            },
            categories: {
                labels: categories.map(item => item._id),
                data: categories.map(item => item.count)
            }
        });

    } catch (error) {
        console.error('Error fetching chart data:', error);
        res.status(500).json({ message: 'Error fetching chart data' });
    }
});

module.exports = router; 