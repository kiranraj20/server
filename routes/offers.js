import express from 'express';
const router = express.Router();
import Offer from '../models/Offer';
import Product from '../models/Product';
import Category from '../models/Category';

// Get all active offers
router.get('/', async (req, res) => {
  try {
    const offers = await Offer.find({ isActive: true })
      .populate({
        path: 'targetId',
        refPath: 'applicableTo'
      });
    res.json(offers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get offers by product
router.get('/product/:productId', async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Find offers for this product and its category
    const offers = await Offer.find({
      $or: [
        { applicableTo: 'product', targetId: product._id },
        { applicableTo: 'category', targetId: product.category }
      ],
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    }).populate({
      path: 'targetId',
      refPath: 'applicableTo'
    });

    res.json(offers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get offers by category
router.get('/category/:categoryId', async (req, res) => {
  try {
    const offers = await Offer.find({
      applicableTo: 'category',
      targetId: req.params.categoryId,
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    }).populate('targetId');
    res.json(offers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create new offer
router.post('/', async (req, res) => {
  const offer = new Offer({
    title: req.body.title,
    description: req.body.description,
    discountType: req.body.discountType,
    discountValue: req.body.discountValue,
    applicableTo: req.body.applicableTo,
    targetId: req.body.targetId,
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    minimumPurchase: req.body.minimumPurchase,
    maxUsageLimit: req.body.maxUsageLimit
  });

  try {
    // Validate if target exists
    const Model = req.body.applicableTo === 'product' ? Product : Category;
    const target = await Model.findById(req.body.targetId);
    if (!target) {
      return res.status(404).json({ 
        message: `${req.body.applicableTo} not found` 
      });
    }

    const newOffer = await offer.save();
    res.status(201).json(newOffer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update offer
router.patch('/:id', async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    const allowedUpdates = [
      'title', 'description', 'discountValue', 'isActive',
      'startDate', 'endDate', 'minimumPurchase', 'maxUsageLimit'
    ];

    allowedUpdates.forEach(update => {
      if (req.body[update] != null) {
        offer[update] = req.body[update];
      }
    });

    const updatedOffer = await offer.save();
    res.json(updatedOffer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete offer
router.delete('/:id', async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }
    await offer.deleteOne();
    res.json({ message: 'Offer deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 