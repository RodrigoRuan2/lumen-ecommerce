import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: Number,
      }
    ],
    totalPrice: {
      type: Number,
      required: true,
    },
    shippingAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    status: {
      type: String,
      enum: ['pendente', 'processando', 'enviado', 'entregue', 'cancelado'],
      default: 'pendente',
    },
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'debit_card', 'pix', 'boleto'],
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    trackingNumber: String,
  },
  { timestamps: true }
);

export default mongoose.model('Order', orderSchema);
