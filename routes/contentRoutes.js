const express = require("express");
const Content = require("../models/Content");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

const router = express.Router();


// GET ALL ACTIVE CONTENT
router.get("/", async (req, res) => {
  try {
    const contents = await Content.find({
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } }
      ]
    }).sort({ createdAt: -1 });

    res.json(contents);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to get contents"
    });
  }
});


// GET ONE ACTIVE CONTENT
router.get("/:id", async (req, res) => {
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

    res.json(content);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to get content"
    });
  }
});


// CREATE CONTENT
router.post("/", auth, admin, async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      fileUrl
    } = req.body;

    if (
      !title ||
      !description ||
      price === undefined ||
      !fileUrl
    ) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    const content = new Content({
      title,
      description,
      price,
      fileUrl,

      // The person creating the content becomes its owner
      ownerId: req.user.id
    });

    await content.save();

    res.status(201).json({
      message: "Content created successfully",
      content
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create content"
    });
  }
});


// UPDATE CONTENT FILE
router.patch("/:id/file", auth, admin, async (req, res) => {
  try {
    const {
      fileUrl
    } = req.body;

    if (!fileUrl) {
      return res.status(400).json({
        message: "fileUrl is required"
      });
    }

    const content = await Content.findOneAndUpdate(
      {
        _id: req.params.id,

        $or: [
          { isDeleted: false },
          { isDeleted: { $exists: false } }
        ]
      },

      {
        fileUrl
      },

      {
        new: true
      }
    );

    if (!content) {
      return res.status(404).json({
        message: "Content not found"
      });
    }

    res.json({
      message: "File updated successfully",
      content
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to update file"
    });
  }
});


module.exports = router;