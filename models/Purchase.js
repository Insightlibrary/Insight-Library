const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Content",
    required: true
  },

  // Original content price
  amount: {
    type: Number,
    required: true
  },

  // Original content currency
  currency: {
    type: String,
    default: "NGN",
    required: true
  },

  // Original/source price and currency
  sourceAmount: {
    type: Number
  },

  sourceCurrency: {
    type: String
  },

  // Actual amount sent to Paystack
  transactionAmount: {
    type: Number
  },

  // Actual currency sent to Paystack
  transactionCurrency: {
    type: String
  },

  // Exchange rate used if conversion was necessary
  exchangeRate: {
    type: Number
  },

  paystackReference: {
    type: String,
    required: true,
    unique: true
  },

  status: {
    type: String,
    enum: ["pending", "successful", "failed"],
    default: "pending"
  },

  paidAt: {
    type: Date
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports =
  mongoose.models.Purchase ||
  mongoose.model("Purchase", purchaseSchema);
