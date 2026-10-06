const mongoose = require("mongoose");

const creatorApplicationSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
    required: true
  },

  rejectionReason: {
    type: String,
    default: ""
  },

  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  reviewedAt: {
    type: Date
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports =
  mongoose.models.CreatorApplication ||
  mongoose.model(
    "CreatorApplication",
    creatorApplicationSchema
  );
