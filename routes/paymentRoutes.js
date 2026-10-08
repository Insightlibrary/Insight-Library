const express = require("express");
const axios = require("axios");
const mongoose = require("mongoose");
const getExchangeRate =
  require("../config/exchangeRates");
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
const supportedBuyerCurrencies = [
  "NGN",
  "USD",
  "GBP",
  "EUR",
  "CAD",
  "AUD",
  "ZAR"
];

const paystackCurrencies = [
  "NGN",
  "USD"
];

router.post("/initialize", auth, async (req, res) => {
  try {
    const {
  contentId,
  buyerCurrency
} = req.body;

const userId = req.user.id;
if (
  !buyerCurrency ||
  !supportedBuyerCurrencies.includes(
    buyerCurrency
  )
) {
  return res.status(400).json({
    message:
      "This buyer currency is not supported"
  });
}

if (
  !paystackCurrencies.includes(
    buyerCurrency
  )
) {
  return res.status(400).json({
    message:
      "This currency is not currently available for Paystack checkout"
  });
}

const User = mongoose.model("User");

const user = await User.findById(userId);

if (!user) {
  return res.status(404).json({
    message: "User not found"
  });
}
    // Check required information
    if (!contentId) {
  return res.status(400).json({
    message: "contentId is required"
  });
}

    // Find the selected content in MongoDB
    const content = await Content.findById(contentId);

    if (!content) {
      return res.status(404).json({
        message: "Content not found"
      });
    }
    
    if (content.contentType === "free") {
  return res.status(400).json({
    message: "Free content does not require payment"
  });
}

    // Convert naira to kobo for Paystack
    const originalPrice =
  Number(content.price);

const originalCurrency =
  content.priceCurrency || "NGN";
  
  let transactionAmount =
  originalPrice;

let exchangeRate = 1;

if (
  originalCurrency !== buyerCurrency
) {

  exchangeRate =
    await getExchangeRate(
      originalCurrency,
      buyerCurrency
    );

  transactionAmount =
    originalPrice *
    exchangeRate;

}

if (
  !Number.isFinite(transactionAmount) ||
  transactionAmount <= 0
) {

  return res.status(400).json({
    message:
      "Invalid transaction amount"
  });

}
const paystackAmount =
  Math.round(
    transactionAmount * 100
  );
  transactionAmount =
  paystackAmount / 100;
  
  const paystackMinimums = {
  NGN: 50,
  USD: 2
};

if (
  transactionAmount <
  paystackMinimums[buyerCurrency]
) {
  return res.status(400).json({
    message:
      `The minimum Paystack payment in ${buyerCurrency} is ${paystackMinimums[buyerCurrency]}`
  });
}

    // Initialize Paystack payment
const response = await axios.post(
  "https://api.paystack.co/transaction/initialize",
  {
    email: user.email,
    amount: paystackAmount,
    currency: buyerCurrency,
    callback_url: "https://insightlibrary.github.io/Insight-Library/payment-success.html"
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

  userId:
    userId,

  contentId:
    content._id,

  // Original/source price
  amount:
    originalPrice,

  currency:
    originalCurrency,

  sourceAmount:
    originalPrice,

  sourceCurrency:
    originalCurrency,

  // Actual amount sent to Paystack
  transactionAmount:
    transactionAmount,

  transactionCurrency:
    buyerCurrency,

  exchangeRate:
    exchangeRate,

  paystackReference:
    response.data.data.reference,

  status:
    "pending"

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
    
    if (transaction.reference !== reference) {
  return res.status(400).json({
    message:
      "Payment reference mismatch"
  });
}

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
if (
  transaction.amount !==
  Math.round(
    purchase.transactionAmount * 100
  )
) {
  return res.status(400).json({
    message:
      "Payment amount mismatch"
  });
}

if (
  transaction.currency !==
  purchase.transactionCurrency
) {
  return res.status(400).json({
    message:
      "Payment currency mismatch"
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
      status: transaction.status,
      contentId: purchase.contentId
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
  Key: content.fileUrl,
  ResponseContentType: "application/pdf",
  ResponseContentDisposition: 'attachment; filename="Insight-Library-content.pdf"'
});

  // Get the PDF directly from Backblaze
const file = await s3.send(command);

// Tell the browser this is a downloadable PDF
res.setHeader(
  "Content-Type",
  "application/pdf"
);

res.setHeader(
  "Content-Disposition",
  'attachment; filename="Insight-Library-content.pdf"'
);

// Send the PDF to the user
file.Body.pipe(res);

  } catch (error) {
    console.error("DOWNLOAD ERROR:", error);

    res.status(500).json({
      message: "Download failed"
    });
  }
});

// FREE CONTENT DOWNLOAD
router.get("/download-free/:contentId", async (req, res) => {
  try {
    const { contentId } = req.params;

    // Find the content
    const content = await Content.findOne({
      _id: contentId,
      contentType: "free",
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } }
      ]
    });

    if (!content) {
      return res.status(404).json({
        message: "Free content not found"
      });
    }

    // Get the file directly from Backblaze B2
    const command = new GetObjectCommand({
      Bucket: process.env.B2_BUCKET_NAME,
      Key: content.fileUrl
    });

    const file = await s3.send(command);

    // Get the original filename from the B2 file path
    const fileName =
      content.fileUrl.split("/").pop() ||
      "Insight-Library-content";

    // Tell the browser to download the file
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileName}"`
    );

    // Preserve the file's content type when B2 provides it
    if (file.ContentType) {
      res.setHeader(
        "Content-Type",
        file.ContentType
      );
    }

    // Send the file to the user
    file.Body.pipe(res);

  } catch (error) {
    console.error(
      "FREE DOWNLOAD ERROR:",
      error
    );

    res.status(500).json({
      message: "Free download failed"
    });
  }
});

// GET USER'S SUCCESSFUL PURCHASES
router.get("/my-purchases", auth, async (req, res) => {
  try {
    const purchases = await Purchase.find({
      userId: req.user.id,
      status: "successful"
    }).select("contentId");

    res.json(purchases);

  } catch (error) {
    console.error("MY PURCHASES ERROR:", error);

    res.status(500).json({
      message: "Failed to get purchases"
    });
  }
});
module.exports = router;
