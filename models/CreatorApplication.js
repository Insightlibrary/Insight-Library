const mongoose = require("mongoose");

const creatorApplicationSchema = new mongoose.Schema({

  // The user who submitted the application
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  // ---------------- PERSONAL INFORMATION ----------------

  legalFirstName: {
    type: String,
    required: true,
    trim: true
  },

  middleName: {
    type: String,
    trim: true,
    default: ""
  },

  legalLastName: {
    type: String,
    required: true,
    trim: true
  },

  publicCreatorName: {
    type: String,
    required: true,
    trim: true
  },

  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },

  dateOfBirth: {
    type: Date,
    required: true
  },

  country: {
    type: String,
    required: true,
    trim: true
  },

  profilePictureUrl: {
    type: String,
    default: ""
  },

  // ---------------- CREATOR EXPERIENCE ----------------

  isExistingCreator: {
    type: Boolean,
    required: true
  },

  contentType: {
    type: String,
    required: true,
    trim: true
  },

  creatorBio: {
    type: String,
    required: true,
    trim: true
  },

  // ---------------- SOCIAL LINKS ----------------

  socialLinks: {

    tiktok: {
      type: String,
      default: "",
      trim: true
    },

    facebook: {
      type: String,
      default: "",
      trim: true
    },

    youtube: {
      type: String,
      default: "",
      trim: true
    },

    instagram: {
      type: String,
      default: "",
      trim: true
    },

    website: {
      type: String,
      default: "",
      trim: true
    },

    other: {
      type: String,
      default: "",
      trim: true
    }

  },

  // ---------------- PAYOUT INFORMATION ----------------

  payout: {

    bankCode: {
      type: String,
      default: ""
    },

    bankName: {
      type: String,
      default: ""
    },

    accountNumber: {
      type: String,
      default: ""
    },

    accountName: {
      type: String,
      default: ""
    },

    isVerified: {
      type: Boolean,
      default: false
    },

    verifiedAt: {
      type: Date
    }

  },

  // ---------------- TERMS & CONDITIONS ----------------

  termsAccepted: {
    type: Boolean,
    required: true
  },

  termsVersion: {
    type: String,
    required: true
  },

  termsAcceptedAt: {
    type: Date,
    default: Date.now
  },

  // ---------------- APPLICATION STATUS ----------------

  status: {
    type: String,
    enum: [
      "pending",
      "approved",
      "rejected"
    ],
    default: "pending",
    required: true
  },

  rejectionReason: {
    type: String,
    default: ""
  },

  // ---------------- ADMIN REVIEW ----------------

  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  reviewedAt: {
    type: Date
  },

  // ---------------- CREATOR ACTIVATION ----------------

  activationStatus: {
    type: String,
    enum: [
      "not_required",
      "payment_pending",
      "active",
      "suspended"
    ],
    default: "not_required"
  },

  subscriptionStartedAt: {
    type: Date
  },

  subscriptionExpiresAt: {
    type: Date
  },

  // ---------------- TIMESTAMPS ----------------

  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }

});


// Automatically update updatedAt whenever the document is saved
creatorApplicationSchema.pre("save", function(next) {

  this.updatedAt = new Date();

  next();

});


module.exports =
  mongoose.models.CreatorApplication ||
  mongoose.model(
    "CreatorApplication",
    creatorApplicationSchema
  );
