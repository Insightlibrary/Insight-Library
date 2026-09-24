const express = require("express");
const axios = require("axios");
const mongoose = require("mongoose");
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

    // Check whether the payment was successful
    if (transaction.status !== "success") {
      return res.status(400).json({
        message: "Payment was not successful",
        status: transaction.status
      });
    }

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
module.exports = router;
