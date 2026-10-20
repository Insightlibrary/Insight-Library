
const mongoose = require("mongoose");

const creatorSubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },

    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CreatorApplication",
      required: true
    },

    status: {
      type: String,
      enum: [
        "pending",
        "active",
        "past_due",
        "expired",
        "suspended"
      ],
      default: "pending",
      required: true
    },

    startedAt: {
      type: Date,
      default: null
    },

    expiresAt: {
      type: Date,
      default: null
    },

    gracePeriodEndsAt: {
      type: Date,
      default: null
    },

    autoRenewEnabled: {
      type: Boolean,
      default: false,
      required: true
    },

    autoRenewConsentAt: {
      type: Date,
      default: null
    },

    autoRenewConsentVersion: {
      type: String,
      default: ""
    },

    automaticAttempts: {
      type: Number,
      default: 0,
      min: 0,
      max: 3,
      validate: {
        validator: Number.isInteger,
        message: "Automatic attempts must be a whole number"
      }
    },

    lastAttemptAt: {
      type: Date,
      default: null
    },

    nextAttemptAt: {
      type: Date,
      default: null
    },

    lastPaymentReference: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

creatorSubscriptionSchema.index({
  status: 1,
  expiresAt: 1
});

creatorSubscriptionSchema.index({
  status: 1,
  nextAttemptAt: 1
});

module.exports =
  mongoose.models.CreatorSubscription ||
  mongoose.model(
    "CreatorSubscription",
    creatorSubscriptionSchema
  );
