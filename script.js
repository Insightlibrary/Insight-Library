let menubtn = document.getElementById("menu-btn");

let sidebar = document.getElementById("sidebar");

function toggle(x) {
  sidebar.classList.toggle("active");
  x.classList.toggle("change");

}
// ================================
// SEARCH CONTENT
// ================================

const searchInput = document.getElementById("searchInput");
const resultsDiv = document.getElementById("results");

let allContents = [];


// Load contents for search
async function loadSearchContents() {

  try {

    const response = await fetch(
      "https://insight-library.onrender.com/api/contents"
    );

    if (!response.ok) {
      throw new Error("Failed to load contents");
    }

    allContents = await response.json();

  } catch (error) {

    console.error("Search content error:", error);

  }

}


loadSearchContents();


// Search when user types
searchInput.addEventListener("input", () => {

  const query = searchInput.value
    .trim()
    .toLowerCase();


  // Clear results when search is empty
  if (query.length === 0) {

    resultsDiv.innerHTML = "";

    return;

  }


  // Find matching contents
  const matchingContents = allContents.filter(content => {

    const title = content.title
      ? content.title.toLowerCase()
      : "";

    const description = content.description
      ? content.description.toLowerCase()
      : "";


    return (
      title.includes(query) ||
      description.includes(query)
    );

  });


  // No results
  if (matchingContents.length === 0) {

    resultsDiv.innerHTML = `
      <div class="result-item">
        <p>No content found.</p>
      </div>
    `;

    return;

  }


  // Display search results
  resultsDiv.innerHTML = matchingContents.map(content => {

    return `
      <div class="result-item">

        <a href="content.html?id=${content._id}">
          ${content.title}
        </a>

      </div>
    `;

  }).join("");

});

// LOAD CONTENT FROM BACKEND
async function loadContents() {
  try {
    const token = localStorage.getItem("token");

    // Get all available contents
    const contentsResponse = await fetch(
      "https://insight-library.onrender.com/api/contents"
    );

    if (!contentsResponse.ok) {
      throw new Error("Failed to load contents");
    }

    const contents = await contentsResponse.json();

    // Get user's successful purchases
    let purchasedContentIds = [];

    if (token) {
      const purchasesResponse = await fetch(
        "https://insight-library.onrender.com/api/payments/my-purchases",
        {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        }
      );

      if (purchasesResponse.ok) {
        const purchases = await purchasesResponse.json();

        purchasedContentIds = purchases.map(
          purchase => purchase.contentId
        );
      }
    }

    const contentList = document.getElementById("content-list");

    contentList.innerHTML = contents.map(content => {

      const alreadyPurchased =
        purchasedContentIds.includes(content._id);

      let button;

if (content.contentType === "free") {

  button = `
    <button onclick="downloadFreeContent('${content._id}')">
      Download Free
    </button>
  `;

} else if (alreadyPurchased) {

  button = `
    <button onclick="downloadContent('${content._id}')">
      Download Content
    </button>
  `;

} else {

  button = `
    <button onclick="buyContent('${content._id}')">
      Buy Now
    </button>
  `;

}

      return `
        <div class="content-card">

          <h2>${content.title}</h2>

          <p>${content.description}</p>

          <p>
            Price: ₦${content.price.toLocaleString()}
          </p>

          ${button}

        </div>
      `;

    }).join("");

  } catch (error) {

    console.error(error);

    const contentList = document.getElementById("content-list");

    contentList.innerHTML =
      "<p>Unable to load contents.</p>";
  }
}

loadContents();

// BUY CONTENT

async function buyContent(contentId) {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
  localStorage.setItem("pendingContentId", contentId);
  window.location.href = "login.html";
  return;
}
localStorage.setItem("pendingContentId", contentId);

    const response = await fetch(
      "https://insight-library.onrender.com/api/payments/initialize",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },

        body: JSON.stringify({
          contentId: contentId
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Payment could not be initialized.");
      return;
    }

    // Send customer to Paystack Checkout
    window.location.href =
      data.payment.data.authorization_url;

  } catch (error) {
    console.error("Payment error:", error);

    alert("Something went wrong while starting payment.");
  }
}
// DOWNLOAD PURCHASED CONTENT
async function downloadContent(contentId) {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please log in again.");
      window.location.href = "login.html";
      return;
    }

    const response = await fetch(
      `https://insight-library.onrender.com/api/payments/download/${contentId}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      const data = await response.json();

      throw new Error(
        data.message || "Download failed."
      );
    }

    // Receive the PDF from the backend
    const blob = await response.blob();

    // Create a temporary URL for the PDF
    const downloadUrl = URL.createObjectURL(blob);

    // Create a temporary download link
    const link = document.createElement("a");

    link.href = downloadUrl;
    link.download = "Insight-Library-content.pdf";

    document.body.appendChild(link);

    link.click();

    link.remove();

    // Remove the temporary URL
    URL.revokeObjectURL(downloadUrl);

  } catch (error) {

    console.error("Download error:", error);

    alert(
      error.message || "Download failed."
    );
  }
}

// ================================
// ACCOUNT / LOGGED-IN USER
// ================================

const accountButton =
  document.getElementById("account-btn");

const accountGreeting =
  document.getElementById("account-greeting");

async function loadLoggedInUser() {

  const token =
    localStorage.getItem("token");

  // User is not logged in
  if (!token) {

    accountGreeting.textContent =
      "Hi";

    return;
  }

  try {

    const response = await fetch(
      "https://insight-library.onrender.com/api/v1/auth/me",
      {
        headers: {
          "Authorization":
            `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {

      accountGreeting.textContent =
        "Hi";

      return;
    }

    const user =
      await response.json();

    const firstName =
  user.name.trim().split(" ")[0];

accountGreeting.textContent =
  `Hi, ${firstName}`;

accountMenuName.textContent =
  user.name;

  } catch (error) {

    console.error(
      "Account loading error:",
      error
    );

    accountGreeting.textContent =
      "Hi";
  }

}

loadLoggedInUser();

// ================================
// ACCOUNT MENU
// ================================

const accountMenu =
  document.getElementById("account-menu");

const accountMenuName =
  document.getElementById("account-menu-name");

const logoutButton =
  document.getElementById("logout-btn");


// OPEN / CLOSE ACCOUNT MENU

accountButton.addEventListener("click", () => {

  accountMenu.classList.toggle("active");

});


// CLOSE MENU WHEN CLICKING OUTSIDE

document.addEventListener("click", (event) => {

  if (
    !accountButton.contains(event.target) &&
    !accountMenu.contains(event.target)
  ) {

    accountMenu.classList.remove("active");

  }

});

// ================================
// SIGN OUT
// ================================

logoutButton.addEventListener("click", () => {

  // Remove the login token
  localStorage.removeItem("token");

  // Remove any pending purchase
  localStorage.removeItem("pendingContentId");

  // Close the account menu
  accountMenu.classList.remove("active");

  // Return to the homepage
  window.location.href = "index.html";

});







