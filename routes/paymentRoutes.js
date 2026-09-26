const express = require("express");
const axios = require("axios");
const mongoose = require("mongoose");
const {
  GetObjectCommand
} = require("@aws-sdk/client-s3");

const {
  getSignedUrl
} = require("@aws-sdk/s3-request-presigner");

const s3 = require("../config/b2");
const Content = require("../models/Content");
const Purchase = require("../models/Purchase");
const auth = require("../middleware/auth");
const router = express.Router();

router.post("/initialize", auth, async (req, res) => {
  try {
    const { contentId } = req.body;

const userId = req.user.id;

const User = mongoose.model("User");

const user = await User.findById(userId);

if (!user) {
  return res.status(404).json({
    message: "User not found"
  });
}
    // Check required information
    if (!email || !contentId) {
      return res.status(400).json({
        message: "Email and contentId are required"
      });
    }

    // Find the selected content in MongoDB
    const content = await Content.findById(contentId);

    if (!content) {
      return res.status(404).json({
        message: "Content not found"
      });
    }

    // Convert naira to kobo for Paystack
    const amountInKobo = content.price * 100;

    // Initialize Paystack payment
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: user.email,
        amount: amountInKobo
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

// Save the purchase as pending
const purchase = new Purchase({
  userId: userId,
  contentId: content._id,
  amount: content.price,
  paystackReference: response.data.data.reference,
  status: "pending"
});

await purchase.save();


    res.json({
      message: "Payment initialized successfully",
      content: {
        id: content._id,
        title: content.title,
        price: content.price
      },
      payment: response.data
    });

  } catch (error) {
    console.error(error.response?.data || error.message);

    res.status(500).json({
      message: "Payment initialization failed"
    });
  }
});


router.get("/verify/:reference", auth, async (req, res) => {
  try {
    const { reference } = req.params;

    // Ask Paystack to verify the transaction
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      }
    );

    // Check Paystack's response
    if (!response.data.status) {
      return res.status(400).json({
        message: "Payment verification failed"
      });
    }

    const transaction = response.data.data;

// Find the purchase in MongoDB
const purchase = await Purchase.findOne({
  paystackReference: reference,
  userId: req.user.id
});

if (!purchase) {
  return res.status(404).json({
    message: "Purchase not found"
  });
}
    // Check whether the payment was successful
    if (transaction.status !== "success") {
      return res.status(400).json({
        message: "Payment was not successful",
        status: transaction.status
      });
    }


// Check that the amount paid matches the purchase amount
if (transaction.amount !== purchase.amount * 100) {
  return res.status(400).json({
    message: "Payment amount does not match"
  });
}
// Mark the purchase as successful
purchase.status = "successful";
purchase.paidAt = new Date();

await purchase.save();


    res.json({
      message: "Payment verified successfully",
      reference: transaction.reference,
      amount: transaction.amount,
      status: transaction.status
    });

  } catch (error) {
    console.error(error.response?.data || error.message);

    res.status(500).json({
      message: "Payment verification failed"
    });
  }
});

// PROTECTED CONTENT DOWNLOAD
router.get("/download/:contentId", auth, async (req, res) => {
  try {
    const { contentId } = req.params;

    // Check that this user successfully purchased this content
    const purchase = await Purchase.findOne({
      userId: req.user.id,
      contentId: contentId,
      status: "successful"
    });

    if (!purchase) {
      return res.status(403).json({
        message: "You have not purchased this content"
      });
    }

    // Find the content
    const content = await Content.findById(contentId);

    if (!content) {
      return res.status(404).json({
        message: "Content not found"
      });
    }

    // Create a command for the private Backblaze file
    const command = new GetObjectCommand({
      Bucket: process.env.B2_BUCKET_NAME,
      Key: content.fileUrl
    });

    // Create a temporary download URL
    const downloadUrl = await getSignedUrl(s3, command, {
      expiresIn: 300
    });

    res.json({
      message: "Download link created",
      downloadUrl
    });

  } catch (error) {
    console.error("DOWNLOAD ERROR:", error);

    res.status(500).json({
      message: "Download failed"
    });
  }
});
module.exports = router;
