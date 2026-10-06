const express = require("express");
const CreatorApplication = require("../models/CreatorApplication");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();


// Submit Creator Application
router.post("/apply", auth, async (req, res) => {

  try {

    // Get the logged-in user
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }


    // Only normal users can apply
    if (user.role !== "user") {
      return res.status(400).json({
        message:
          "Only normal users can apply to become creators"
      });
    }


    // ---------------- GET APPLICATION DATA ----------------

    const {
      legalFirstName,
      middleName,
      legalLastName,
      publicCreatorName,
      phoneNumber,
      dateOfBirth,
      country,
      profilePictureUrl,

      isExistingCreator,
      contentType,
      creatorBio,

      socialLinks,

      payout,

      termsAccepted,
      termsVersion
    } = req.body;


    // ---------------- REQUIRED FIELD VALIDATION ----------------

    if (
      !legalFirstName ||
      !legalLastName ||
      !publicCreatorName ||
      !phoneNumber ||
      !dateOfBirth ||
      !country ||
      typeof isExistingCreator !== "boolean" ||
      !contentType ||
      !creatorBio
    ) {

      return res.status(400).json({
        message:
          "Please complete all required application fields"
      });

    }


    // ---------------- AGE VALIDATION ----------------

    const birthDate = new Date(dateOfBirth);

    if (isNaN(birthDate.getTime())) {

      return res.status(400).json({
        message: "Invalid date of birth"
      });

    }


    const today = new Date();

    let age =
      today.getFullYear() -
      birthDate.getFullYear();

    const monthDifference =
      today.getMonth() -
      birthDate.getMonth();

    if (
      monthDifference < 0 ||
      (
        monthDifference === 0 &&
        today.getDate() < birthDate.getDate()
      )
    ) {
      age--;
    }


    if (age < 18) {

      return res.status(400).json({
        message:
          "You must be at least 18 years old to become a creator"
      });

    }


    // ---------------- TERMS VALIDATION ----------------

    if (termsAccepted !== true) {

      return res.status(400).json({
        message:
          "You must accept the Insight-Library Creator Terms & Conditions"
      });

    }


    if (!termsVersion) {

      return res.status(400).json({
        message:
          "Creator Terms & Conditions version is required"
      });

    }


    // ---------------- PAYOUT VALIDATION ----------------

    if (!payout) {

      return res.status(400).json({
        message:
          "Payout information is required"
      });

    }


    if (
      !payout.bankCode ||
      !payout.bankName ||
      !payout.accountNumber ||
      !payout.accountName
    ) {

      return res.status(400).json({
        message:
          "Complete bank account information is required"
      });

    }


    if (payout.isVerified !== true) {

      return res.status(400).json({
        message:
          "Your bank account must be verified before submitting your application"
      });

    }


    // ---------------- CHECK EXISTING APPLICATION ----------------

    const existingApplication =
      await CreatorApplication.findOne({
        userId: user._id,
        status: "pending"
      });


    if (existingApplication) {

      return res.status(400).json({
        message:
          "You already have a pending creator application"
      });

    }


    // ---------------- CREATE APPLICATION ----------------

    const application =
      new CreatorApplication({

        userId: user._id,

        legalFirstName,
        middleName: middleName || "",
        legalLastName,
        publicCreatorName,

        phoneNumber,
        dateOfBirth,
        country,

        profilePictureUrl:
          profilePictureUrl || "",

        isExistingCreator,
        contentType,
        creatorBio,

        socialLinks: socialLinks || {},

        payout,

        termsAccepted: true,
        termsVersion,

        termsAcceptedAt: new Date(),

        status: "pending",

        activationStatus:
          "not_required"

      });


    await application.save();


    // ---------------- RESPONSE ----------------

    res.status(201).json({

      message:
        "Creator application submitted successfully",

      application: {

        _id: application._id,

        status: application.status,

        activationStatus:
          application.activationStatus,

        createdAt:
          application.createdAt

      }

    });


  } catch (error) {

    console.error(
      "CREATOR APPLICATION ERROR:",
      error
    );

    res.status(500).json({
      message:
        "Failed to submit creator application"
    });

  }

});


module.exports = router;
