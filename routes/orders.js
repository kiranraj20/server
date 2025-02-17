import express from 'express';
const router = express.Router();
import Order from '../models/Order';
import OrderItem from '../models/OrderItem';

// Get all orders
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().populate('user_id');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single order with items
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user_id');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    const orderItems = await OrderItem.find({ order_id: order._id }).populate('product_id');
    res.json({ order, items: orderItems });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create order
router.post('/', async (req, res) => {
  const order = new Order({
    user_id: req.body.user_id,
    total_amount: req.body.total_amount,
    status: req.body.status,
    delivery_date: req.body.delivery_date
  });

  try {
    const newOrder = await order.save();
    
    // Create order items
    if (req.body.items && req.body.items.length > 0) {
      const orderItems = req.body.items.map(item => ({
        order_id: newOrder._id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price
      }));
      await OrderItem.insertMany(orderItems);
    }
    
    res.status(201).json(newOrder);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update order status
router.patch('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (req.body.status) {
      order.status = req.body.status;
    }

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router; 