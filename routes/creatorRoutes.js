const express = require("express");
const CreatorApplication = require("../models/CreatorApplication");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

router.post("/apply", auth, async (req, res) => {
  try {

    // Find the logged-in user
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    // Only normal users can apply
    if (user.role !== "user") {
      return res.status(400).json({
        message: "Only normal users can apply to become creators"
      });
    }

    // Check if this user already has a pending application
    const existingApplication =
      await CreatorApplication.findOne({
        userId: user._id,
        status: "pending"
      });

    if (existingApplication) {
      return res.status(400).json({
        message: "You already have a pending creator application"
      });
    }

    // Create the application
    const application =
      new CreatorApplication({
        userId: user._id,
        status: "pending"
      });

    await application.save();

    res.status(201).json({
      message: "Creator application submitted successfully",
      application
    });

  } catch (error) {

    console.error(
      "CREATOR APPLICATION ERROR:",
      error
    );

    res.status(500).json({
      message: "Failed to submit creator application"
    });
  }
});

module.exports = router;
