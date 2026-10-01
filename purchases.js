// ================================
// MY PURCHASES
// ================================

const purchasesList =
  document.getElementById("purchases-list");


// ================================
// CHECK LOGIN
// ================================

const token =
  localStorage.getItem("token");


// User is not logged in

if (!token) {

  purchasesList.innerHTML = `

    <h2>
      You are not logged in
    </h2>

    <p>
      Please log in to view your purchases.
    </p>

    <a href="login.html">
      Login
    </a>

  `;

}


// User is logged in

else {

  loadPurchases();

}


// ================================
// LOAD PURCHASES
// ================================

async function loadPurchases() {

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

      throw new Error(
        "Unable to load purchases"
      );

    }


    const purchases =
      await response.json();


    // No purchases

    if (
      !Array.isArray(purchases) ||
      purchases.length === 0
    ) {

      purchasesList.innerHTML = `

        <h2>
          No purchases yet
        </h2>

        <p>
          You have not purchased any content yet.
        </p>

        <a href="index.html">
          Browse Content
        </a>

      `;

      return;

    }


    // ================================
    // LOAD CONTENT DETAILS
    // ================================

    const contentRequests =
      purchases.map(
        purchase =>
          fetch(
            `https://insight-library.onrender.com/api/contents/${purchase.contentId}`
          )
            .then(response => {

              if (!response.ok) {

                throw new Error(
                  "Content not found"
                );

              }

              return response.json();

            })
      );


    const contents =
      await Promise.all(contentRequests);


    // ================================
    // DISPLAY PURCHASES
    // ================================

    purchasesList.innerHTML =
      contents.map(content => `

        <div class="purchase-item">

          <h2>
            ${content.title}
          </h2>

          <p>
            ${content.description}
          </p>

          <p>
            ₦${content.price.toLocaleString()}
          </p>

          <button
            onclick="downloadPurchasedContent('${content._id}')"
          >
            Download Content
          </button>

        </div>

      `).join("");


  } catch (error) {

    console.error(
      "Purchases error:",
      error
    );


    purchasesList.innerHTML = `

      <h2>
        Unable to load purchases
      </h2>

      <p>
        Please try again.
      </p>

    `;

  }

}


// ================================
// DOWNLOAD PURCHASED CONTENT
// ================================

async function downloadPurchasedContent(contentId) {

  try {

    const response = await fetch(
      `https://insight-library.onrender.com/api/payments/download/${contentId}`,
      {
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
        "Download failed"
      );

    }


    // The backend returns the PDF itself

    const blob =
      await response.blob();


    // Create temporary download link

    const url =
      window.URL.createObjectURL(blob);


    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      "Insight-Library-content.pdf";


    document.body.appendChild(link);

    link.click();

    link.remove();


    window.URL.revokeObjectURL(url);


  } catch (error) {

    console.error(
      "Download error:",
      error
    );

    alert(
      "Download failed. Please try again."
    );

  }

}
