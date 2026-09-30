// ================================
// CONTENT PAGE
// ================================

const contentPage = document.getElementById("content-page");


// Get content ID from the URL

const urlParams = new URLSearchParams(
  window.location.search
);

const contentId = urlParams.get("id");


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

      throw new Error("Content not found");

    }


    currentContent = await response.json();


    // Check whether this user has purchased it

    const alreadyPurchased =
      await checkPurchase();


    displayContent(alreadyPurchased);


  } catch (error) {

    console.error(
      "Content loading error:",
      error
    );


    contentPage.innerHTML = `

      <h1>Unable to load content</h1>

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
          "Authorization": `Bearer ${token}`
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
        purchase.contentId === contentId
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

function displayContent(alreadyPurchased) {

  let button;


  if (alreadyPurchased) {

    button = `

      <button
        onclick="downloadContent('${contentId}')"
      >
        Download Content
      </button>

    `;

  } else {

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

      ₦${currentContent.price.toLocaleString()}

    </div>


    ${button}

  `;

}


// ================================
// BUY CONTENT
// ================================

async function buyContent(contentId) {

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


    const response = await fetch(
      "https://insight-library.onrender.com/api/payments/initialize",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          "Authorization":
            `Bearer ${token}`
        },

        body: JSON.stringify({
          contentId: contentId
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

async function downloadContent(contentId) {

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

      const data =
        await response.json();


      throw new Error(
        data.message ||
        "Download failed."
      );

    }


    const data =
      await response.json();


    // Backend returns the secure B2 link

    if (!data.downloadUrl) {

      throw new Error(
        "Download link was not received."
      );

    }


    // Open the secure download link

    window.location.href =
      data.downloadUrl;


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