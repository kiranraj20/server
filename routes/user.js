import express from 'express';
const router = express.Router();
import auth from '../middleware/user-auth.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Review from '../models/Review.js';
import User from '../models/User.js';

// Public Routes (No Authentication Required)

// Get all products
router.get('/products', async (req, res) => {
    try {
        const products = await Product.find({ stock: { $gt: 1 } })
            .sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Error fetching products' });
    }
});

// Get single product
router.get('/products/:id', async (req, res) => {
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

// Get all categories
router.get('/categories', async (req, res) => {
    try {
        const categories = await Category.find({ active: true })
            .sort({ name: 1 });
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Error fetching categories' });
    }
});

// Get products by category
router.get('/categories/:category/products', async (req, res) => {
    try {
        const products = await Product.find({
            category: req.params.category,
            stock: { $gt: 1 }
        }).sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        console.error('Error fetching category products:', error);
        res.status(500).json({ message: 'Error fetching category products' });
    }
});

// Get product reviews
router.get('/products/:id/reviews', async (req, res) => {
    try {
        const reviews = await Review.find({ product_id: req.params.id })
            .populate('user_id', 'name')
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ message: 'Error fetching reviews' });
    }
});

// Protected Routes (Authentication Required)

// Add product review
router.post('/reviews', auth, async (req, res) => {
    try {
        const { productId, rating, comment } = req.body;

        const review = new Review({
            user_id: req.user.id,
            product_id: productId,
            rating,
            comment
        });

        await review.save();

        res.status(201).json({
            message: 'Review added successfully',
            review
        });
    } catch (error) {
        console.error('Error adding review:', error);
        res.status(500).json({ message: 'Error adding review' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password_hash');
        console.log('first',req)
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router; 