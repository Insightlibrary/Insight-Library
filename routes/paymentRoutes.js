const express = require("express");
const axios = require("axios");
const Content = require("../models/Content");

const router = express.Router();

router.post("/initialize", async (req, res) => {
  try {
    const { email, contentId } = req.body;

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
        email: email,
        amount: amountInKobo
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

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

module.exports = router;
