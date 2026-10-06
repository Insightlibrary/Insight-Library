const axios = require("axios");


// ExchangeRate-API base URL
const API_URL =
  "https://v6.exchangerate-api.com/v6";


async function getExchangeRate(
  fromCurrency,
  toCurrency
) {

  try {

    // Get API key from .env
    const apiKey =
      process.env.EXCHANGE_RATE_API_KEY;


    // Make sure the API key exists
    if (!apiKey) {

      throw new Error(
        "Exchange rate API key is missing"
      );

    }


    // Request latest exchange rates
    const response =
      await axios.get(
        `${API_URL}/${apiKey}/latest/${fromCurrency}`
      );


    // Check API response
    if (
      response.data.result !== "success"
    ) {

      throw new Error(
        "Exchange rate request failed"
      );

    }


    // Get the requested currency rate
    const rate =
      response.data.conversion_rates[
        toCurrency
      ];


    // Make sure the currency exists
    if (!rate) {

      throw new Error(
        `Exchange rate not available for ${toCurrency}`
      );

    }


    return rate;


  } catch (error) {

    console.error(
      "EXCHANGE RATE ERROR:",
      error.message
    );

    throw error;

  }

}


module.exports =
  getExchangeRate;
