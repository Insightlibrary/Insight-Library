// ================================
// CONTENT PAGE
// ================================

const contentPage =
  document.getElementById("content-page");


// ================================
// GET CONTENT ID FROM URL
// ================================

const urlParams =
  new URLSearchParams(
    window.location.search
  );

const contentId =
  urlParams.get("id");


// Store the content loaded from MongoDB

let currentContent = null;


// ================================
// START
// ================================

if (!contentId) {

  contentPage.innerHTML = `

    <h1>Content not found</h1>

    <p>
      No content ID was provided.
    </p>

    <a href="index.html">
      Back to Home
    </a>

  `;

} else {

  loadContent();

}


// ================================
// LOAD EXACT CONTENT
// ================================

async function loadContent() {

  try {

    const response = await fetch(
      `https://insight-library.onrender.com/api/contents/${contentId}`
    );


    if (!response.ok) {

      throw new Error(
        "Content not found"
      );

    }


    currentContent =
      await response.json();


    // Check whether this user
    // has already purchased it

    const alreadyPurchased =
      await checkPurchase();


    displayContent(
      alreadyPurchased
    );


  } catch (error) {

    console.error(
      "Content loading error:",
      error
    );


    contentPage.innerHTML = `

      <h1>
        Unable to load content
      </h1>

      <p>
        We could not find this content.
      </p>

      <a href="index.html">
        Back to Home
      </a>

    `;

  }

}


// ================================
// CHECK PURCHASE
// ================================

async function checkPurchase() {

  const token =
    localStorage.getItem("token");


  // User isn't logged in

  if (!token) {

    return false;

  }


  try {

    const response = await fetch(
      "https://insight-library.onrender.com/api/payments/my-purchases",
      {
        headers: {
          "Authorization":
            `Bearer ${token}`
        }
      }
    );


    if (!response.ok) {

      return false;

    }


    const purchases =
      await response.json();


    return purchases.some(
      purchase =>
        purchase.contentId ===
        contentId
    );


  } catch (error) {

    console.error(
      "Purchase check error:",
      error
    );


    return false;

  }

}


// ================================
// DISPLAY CONTENT
// ================================

// ================================
// DISPLAY CONTENT
// ================================

function displayContent(
  alreadyPurchased
) {

  let button;


  // FREE CONTENT

  if (currentContent.contentType === "free") {

    button = `

      <button
        onclick="downloadFreeContent('${contentId}')"
      >
        Download Free
      </button>

    `;

  }

  // USER ALREADY PURCHASED PAID CONTENT

  else if (alreadyPurchased) {

    button = `

      <button
        onclick="downloadContent('${contentId}')"
      >
        Download Content
      </button>

    `;

  }

  // PAID CONTENT NOT PURCHASED

  else {

    button = `

      <button
        onclick="buyContent('${contentId}')"
      >
        Buy Now
      </button>

    `;

  }


  contentPage.innerHTML = `

    <h1>
      ${currentContent.title}
    </h1>


    <p class="content-description">
      ${currentContent.description}
    </p>


    <div class="content-price">

      ${
        currentContent.contentType === "free"
          ? "Free"
          : `${
              currentContent.priceCurrency === "USD"
                ? "$"
                : currentContent.priceCurrency === "GBP"
                ? "£"
                : currentContent.priceCurrency === "EUR"
                ? "€"
                : currentContent.priceCurrency === "CAD"
                ? "CA$"
                : currentContent.priceCurrency === "AUD"
                ? "A$"
                : currentContent.priceCurrency === "ZAR"
                ? "R"
                : "₦"
            }${currentContent.price.toLocaleString()}`
      }

    </div>


    <p class="content-note">

      ${
        currentContent.contentType === "free"
          ? "Free digital download"
          : "Secure digital purchase • Instant access after payment"
      }

    </p>


    ${button}

  `;

}

// ================================
// BUY CONTENT
// ================================

async function buyContent(
  contentId
) {

  try {

    const token =
      localStorage.getItem("token");


    // User must login first

    if (!token) {

      localStorage.setItem(
        "pendingContentId",
        contentId
      );

      window.location.href =
        "login.html";


      return;

    }


    localStorage.setItem(
      "pendingContentId",
      contentId
    );

const buyerCurrency =
  localStorage.getItem("buyerCurrency") || "NGN";

    const response = await fetch(
      "https://insight-library.onrender.com/api/payments/initialize",
      {
        method: "POST",

        headers: {

          "Content-Type":
            "application/json",

          "Authorization":
            `Bearer ${token}`

        },

        body: JSON.stringify({

          contentId:
            contentId,
            
          buyerCurrency:
            buyerCurrency
        })

      }
    );


    const data =
      await response.json();


    if (!response.ok) {

      alert(
        data.message ||
        "Payment could not be initialized."
      );


      return;

    }


    // Send user to Paystack

    window.location.href =
      data.payment.data.authorization_url;


  } catch (error) {

    console.error(
      "Payment error:",
      error
    );


    alert(
      "Something went wrong while starting payment."
    );

  }

}


// ================================
// DOWNLOAD CONTENT
// ================================

async function downloadContent(
  contentId
) {

  try {

    const token =
      localStorage.getItem("token");


    if (!token) {

      alert(
        "Please log in again."
      );


      window.location.href =
        "login.html";


      return;

    }


    const response = await fetch(
      `https://insight-library.onrender.com/api/payments/download/${contentId}`,
      {
        method: "GET",

        headers: {

          "Authorization":
            `Bearer ${token}`

        }

      }
    );


    if (!response.ok) {

      const errorText =
        await response.text();


      console.error(
        "Download response:",
        response.status,
        errorText
      );


      throw new Error(
        `Download failed (${response.status})`
      );

    }


    // Receive the PDF
    // from the backend

    const blob =
      await response.blob();


    // Create temporary URL

    const downloadUrl =
      URL.createObjectURL(blob);


    // Create download link

    const link =
      document.createElement("a");


    link.href =
      downloadUrl;


    link.download =
      "Insight-Library-content.pdf";


    document.body.appendChild(
      link
    );


    link.click();


    link.remove();


    // Clean up temporary URL

    setTimeout(() => {

      URL.revokeObjectURL(
        downloadUrl
      );

    }, 1000);


  } catch (error) {

    console.error(
      "Download error:",
      error
    );


    alert(
      error.message ||
      "Download failed."
    );

  }

}

// ================================
// DOWNLOAD FREE CONTENT
// ================================

async function downloadFreeContent(
  contentId
) {

  try {

    const response = await fetch(
      `https://insight-library.onrender.com/api/payments/download-free/${contentId}`
    );


    if (!response.ok) {

      const errorText =
        await response.text();

      throw new Error(
        errorText ||
        "Free download failed."
      );

    }


    // Receive the file
    const blob =
      await response.blob();


    // Create temporary URL
    const downloadUrl =
      URL.createObjectURL(blob);


    // Create download link
    const link =
      document.createElement("a");


    link.href =
      downloadUrl;


    // Get filename from server
    const contentDisposition =
      response.headers.get(
        "Content-Disposition"
      );


    let fileName =
      "Insight-Library-content";


    if (contentDisposition) {

      const match =
        contentDisposition.match(
          /filename="([^"]+)"/
        );


      if (match && match[1]) {

        fileName =
          match[1];

      }

    }


    link.download =
      fileName;


    document.body.appendChild(
      link
    );


    link.click();


    link.remove();


    // Clean up
    setTimeout(() => {

      URL.revokeObjectURL(
        downloadUrl
      );

    }, 1000);


  } catch (error) {

    console.error(
      "Free download error:",
      error
    );


    alert(
      error.message ||
      "Free download failed."
    );

  }

}
