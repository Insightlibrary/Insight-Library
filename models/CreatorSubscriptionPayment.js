const mongoose = require("mongoose");
const creatorSubscriptionPaymentSchema = new mongoose.Schema(
  {
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CreatorSubscription",
    required: true,
    
  },
  
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CreatorApplication",
    required: true
 },
  
  amount: {
    type: Number,
    min: 1,
    required: true
  },
  
  currency: {
    type: String,
    enum: ["NGN"],
    default: "NGN",
    required: true
  },
  
  paymentType: {
  type: String,
  enum: [
    "initial",
    "automatic_renewal",
    "manual_reactivation"
  ],
  required: true
  },
  
  status: {
    type: String,
  enum: [
    "pending",
    "successful",
    "failed"
  ],
  default: "pending",
  required: true
  },
  
  paymentReference: {
    type: String,
    required: true,
    unique: true
  },
  
  paystackTransactionId: {
  type: String,
  default: ""
  },
  
  attemptNumber: {
  type: Number,
  min: 1,
  max: 3,
  default: null,
  validate: {
    validator: value => value === null || Number.isInteger(value),
    message: "Attempt number must be a whole number"
  }
  },
  
  paidAt: {
  type: Date,
  default: null
  },
  
  subscriptionPeriodStart: {
  type: Date,
  default: null
  },
  
  subscriptionPeriodEnd: {
  type: Date,
  default: null
},
  
  failureReason: {
  type: String,
  default: ""
  }
  
  },
{
  timestamps: true
}
);

creatorSubscriptionPaymentSchema.index({
  subscriptionId: 1,
  createdAt: -1
});

creatorSubscriptionPaymentSchema.index({
  userId: 1,
  createdAt: -1
});

module.exports = mongoose.models.CreatorSubscriptionPayment || mongoose.model("CreatorSubscriptionPayment", creatorSubscriptionPaymentSchema);
