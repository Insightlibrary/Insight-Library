const express = require("express");

const Content = require("../models/Content");
const getExchangeRate = require("../config/exchangeRates");

const router = express.Router();


// ================================
// SUPPORTED BUYER CURRENCIES
// ================================

const supportedCurrencies = [
  "NGN",
  "USD",
  "GBP",
  "EUR",
  "CAD",
  "AUD",
  "ZAR"
];


// ================================
// CONVERT CONTENT PRICE
// ================================

router.get("/convert/:contentId", async (req, res) => {

  try {

    const { contentId } = req.params;

    const buyerCurrency =
      req.query.currency;


    // Check that buyer selected a currency
    if (!buyerCurrency) {

      return res.status(400).json({
        message:
          "Buyer currency is required"
      });

    }


    // Check that the currency is supported
    if (
      !supportedCurrencies.includes(
        buyerCurrency
      )
    ) {

      return res.status(400).json({
        message:
          "This buyer currency is not supported"
      });

    }


    // Find the content
    const content =
      await Content.findById(contentId);


    if (!content) {

      return res.status(404).json({
        message:
          "Content not found"
      });

    }


    // Free content does not need conversion
    if (
      content.contentType === "free"
    ) {

      return res.json({

        contentId: content._id,

        contentType: "free",

        originalPrice: 0,

        originalCurrency: "NGN",

        buyerCurrency: buyerCurrency,

        convertedPrice: 0

      });

    }


    // Get the creator's original price
    const originalPrice =
      Number(content.price);


    // Get the creator's original currency
    const originalCurrency =
      content.priceCurrency || "NGN";


    // If both currencies are the same,
    // no conversion is necessary.
    if (
      originalCurrency === buyerCurrency
    ) {

      return res.json({

        contentId: content._id,

        contentType: "paid",

        originalPrice:
          originalPrice,

        originalCurrency:
          originalCurrency,

        buyerCurrency:
          buyerCurrency,

        exchangeRate: 1,

        convertedPrice:
          originalPrice

      });

    }


    // Get the current exchange rate
    const exchangeRate =
      await getExchangeRate(
        originalCurrency,
        buyerCurrency
      );


    // Calculate the buyer's price
    const convertedPrice =
      originalPrice *
      exchangeRate;


    // Return the result
    res.json({

      contentId: content._id,

      contentType: "paid",

      originalPrice:
        originalPrice,

      originalCurrency:
        originalCurrency,

      buyerCurrency:
        buyerCurrency,

      exchangeRate:
        exchangeRate,

      convertedPrice:
        Math.round(
          convertedPrice * 100
        ) / 100

    });


  } catch (error) {

    console.error(
      "CURRENCY CONVERSION ERROR:",
      error.message
    );


    res.status(500).json({

      message:
        "Currency conversion failed"

    });

  }

});


module.exports = router;
