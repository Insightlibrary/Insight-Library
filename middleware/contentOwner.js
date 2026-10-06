const Content = require("../models/Content");

const contentOwner = async (req, res, next) => {
  try {
    const content = await Content.findOne({
      _id: req.params.id,
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } }
      ]
    });

    if (!content) {
      return res.status(404).json({
        message: "Content not found"
      });
    }

    // Super Admin can manage any content
    if (req.user.role === "admin") {
      req.content = content;
      return next();
    }

    // Creator can manage only their own content
    if (
      req.user.role === "creator" &&
      content.ownerId &&
      content.ownerId.toString() === req.user.id
    ) {
      req.content = content;
      return next();
    }

    return res.status(403).json({
      message: "You do not have permission to manage this content"
    });

  } catch (error) {
    console.error("CONTENT OWNER ERROR:", error);

    res.status(500).json({
      message: "Failed to check content ownership"
    });
  }
};

module.exports = contentOwner;