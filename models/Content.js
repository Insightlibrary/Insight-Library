const mongoose = require("mongoose");

const contentSchema = new mongoose.Schema({

  // =========================
  // BASIC CONTENT INFORMATION
  // =========================

  title: {
    type: String,
    required: true,
    trim: true
  },

  description: {
    type: String,
    required: true,
    trim: true
  },

contentType: {
  type: String,
  enum: ["free", "paid"],
  default: "paid",
  required: true
},

  price: {
    type: Number,
    required: true,
    min: 0
  },

priceCurrency: {
  type: String,
  enum: ["NGN", "USD", "GBP", "EUR", "CAD", "AUD", "ZAR"],
  default: "NGN",
  required: true
},

  // =========================
  // MAIN PAID FILE
  // =========================

  fileUrl: {
    type: String,
    required: true
  },


  // =========================
  // CONTENT PREVIEW
  // =========================

  previewEnabled: {
    type: Boolean,
    default: false
  },

  previewFileUrl: {
    type: String,
    default: ""
  },

  previewPages: {
    type: Number,
    default: 0,
    min: 0
  },


  // =========================
  // COVER PAGE
  // =========================

  coverImageUrl: {
    type: String,
    default: ""
  },


  // =========================
  // CREATOR
  // =========================

  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },


  // =========================
  // CREATOR SOCIAL LINKS
  // =========================

  socialLinks: {

    tiktok: {
      type: String,
      default: ""
    },

    facebook: {
      type: String,
      default: ""
    },

    youtube: {
      type: String,
      default: ""
    },

    other: {
      type: String,
      default: ""
    }

  },


  // =========================
  // SOFT DELETE
  // =========================

  isDeleted: {
    type: Boolean,
    default: false
  },

  deletedAt: {
    type: Date
  },


  // =========================
  // DATE CREATED
  // =========================

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports =
  mongoose.models.Content ||
  mongoose.model("Content", contentSchema);
