const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  link: { type: String, required: true },
  isFeatured: { type: Boolean, default: false }
});

module.exports = mongoose.models.Post || mongoose.model("Post", postSchema);
