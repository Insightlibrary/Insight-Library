const express = require("express");
const CreatorApplication = require("../models/CreatorApplication");
const User = require("../models/User");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

const router = express.Router();


// Get all pending creator applications
router.get("/applications", auth, admin, async (req, res) => {
  try {

    const applications =
      await CreatorApplication.find({
        status: "pending"
      })
      .populate(
        "userId",
        "name email role"
      )
      .sort({
        createdAt: -1
      });

    res.json(applications);

  } catch (error) {

    console.error(
      "GET CREATOR APPLICATIONS ERROR:",
      error
    );

    res.status(500).json({
      message:
        "Failed to get creator applications"
    });
  }
});


// Approve a creator application
router.patch(
  "/applications/:id/approve",
  auth,
  admin,
  async (req, res) => {

    try {

      const application =
        await CreatorApplication.findById(
          req.params.id
        );

      if (!application) {
        return res.status(404).json({
          message:
            "Creator application not found"
        });
      }

      if (
        application.status !==
        "pending"
      ) {
        return res.status(400).json({
          message:
            "This application has already been reviewed"
        });
      }

      const user =
        await User.findById(
          application.userId
        );

      if (!user) {
        return res.status(404).json({
          message:
            "Applicant user not found"
        });
      }

      // Change the user's role
      user.role = "creator";

      await user.save();

      // Update the application
      application.status = "approved";
      application.reviewedBy =
        req.user.id;
      application.reviewedAt =
        new Date();

      await application.save();

      res.json({
        message:
          "Creator application approved successfully",
        application
      });

    } catch (error) {

      console.error(
        "APPROVE CREATOR ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Failed to approve creator application"
      });
    }
  }
);


// Reject a creator application
router.patch(
  "/applications/:id/reject",
  auth,
  admin,
  async (req, res) => {

    try {

      const application =
        await CreatorApplication.findById(
          req.params.id
        );

      if (!application) {
        return res.status(404).json({
          message:
            "Creator application not found"
        });
      }

      if (
        application.status !==
        "pending"
      ) {
        return res.status(400).json({
          message:
            "This application has already been reviewed"
        });
      }

      application.status =
        "rejected";

      application.rejectionReason =
        req.body.rejectionReason ||
        "";

      application.reviewedBy =
        req.user.id;

      application.reviewedAt =
        new Date();

      await application.save();

      res.json({
        message:
          "Creator application rejected",
        application
      });

    } catch (error) {

      console.error(
        "REJECT CREATOR ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Failed to reject creator application"
      });
    }
  }
);


module.exports = router;
