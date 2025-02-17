import mongoose from 'mongoose';
import Schema from 'mongoose';

const offerSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  discountValue: {
    type: Number,
    required: true
  },
  applicableTo: {
    type: String,
    enum: ['product', 'category'],
    required: true
  },
  targetId: {
    // This can be either product_id or category_id
    type: Schema.Types.ObjectId,
    required: true,
    refPath: 'applicableTo'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  minimumPurchase: {
    type: Number,
    default: 0
  },
  maxUsageLimit: {
    type: Number,
    default: null
  },
  currentUsage: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

export default mongoose.model('Offer', offerSchema); 