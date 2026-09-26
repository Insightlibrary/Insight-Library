const express = require("express");
const Content = require("../models/Content");

const router = express.Router();

// GET all contents
router.get("/", async (req, res) => {
  try {
    const contents = await Content.find().sort({ createdAt: -1 });

    res.json(contents);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to get contents"
    });
  }
});

// GET one content
router.get("/:id", async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);

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

// CREATE new content
router.post("/", async (req, res) => {
  try {
    const { title, description, price, fileUrl } = req.body;

    if (!title || !description || price === undefined || !fileUrl) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    const content = new Content({
      title,
      description,
      price,
      fileUrl
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

// TEMPORARY: Update PDF filename
router.patch("/:id/file", async (req, res) => {
  try {
    const { fileUrl } = req.body;

    if (!fileUrl) {
      return res.status(400).json({
        message: "fileUrl is required"
      });
    }

    const content = await Content.findByIdAndUpdate(
      req.params.id,
      { fileUrl },
      { new: true }
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
