const express = require("express");
const mongoose = require("mongoose");

const Content = require("../models/Content");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

const router = express.Router();


// TEMPORARY CONTENT OWNERSHIP MIGRATION
router.post("/assign-existing-content", auth, admin, async (req, res) => {
  try {

    // Find the User model already registered by index.js
    const User = mongoose.model("User");


    // Find Super Admin
    const superAdmin = await User.findOne({
      email: "insightlibrary451@gmail.com",
      role: "admin"
    });


    // Stop if Super Admin cannot be found
    if (!superAdmin) {
      return res.status(404).json({
        message: "Super Admin account not found"
      });
    }


    // Find existing content that does not have an owner
    const result = await Content.updateMany(
      {
        $or: [
          { ownerId: { $exists: false } },
          { ownerId: null }
        ]
      },
      {
        $set: {
          ownerId: superAdmin._id
        }
      }
    );


    res.json({
      message: "Existing content ownership migration completed",

      superAdmin: {
        email: superAdmin.email,
        role: superAdmin.role
      },

      matched: result.matchedCount,
      modified: result.modifiedCount
    });


  } catch (error) {

    console.error(
      "CONTENT MIGRATION ERROR:",
      error
    );

    res.status(500).json({
      message: "Content migration failed",
      error: error.message
    });
  }
});


module.exports = router;