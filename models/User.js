const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true
  },

  role: {
    type: String,
    enum: ["admin", "user", "creator"],
    default: "user"
  },

  age: Number,

  avatar: String,

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports =
  mongoose.models.User ||
  mongoose.model("User", userSchema);