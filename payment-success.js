const message = document.getElementById("message");
const downloadBtn = document.getElementById("downloadBtn");

async function verifyPayment() {
  try {
    // Get the user's login token
    const token = localStorage.getItem("token");

    if (!token) {
      message.textContent = "Please log in again.";
      return;
    }

    // Get the Paystack reference from the URL
    const params = new URLSearchParams(window.location.search);
    const reference = params.get("reference");

    if (!reference) {
      message.textContent = "Payment reference not found.";
      return;
    }

    // Send the reference to our backend
    const response = await fetch(
      `https://insight-library.onrender.com/api/payments/verify/${reference}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      message.textContent =
        data.message || "Payment verification failed.";
      return;
    }

    // Payment was successfully verified
    message.textContent =
      "Payment verified successfully! You can now download your content.";

    // Get the content that was being purchased
    const contentId = localStorage.getItem("pendingContentId");

    if (!contentId) {
      message.textContent =
        "Payment verified, but the content information was not found.";
      return;
    }

    // Show the download button
    downloadBtn.style.display = "block";

    // Download when the user clicks the button
    downloadBtn.onclick = async function () {
      try {
        downloadBtn.disabled = true;
        downloadBtn.textContent = "Preparing download...";

        const response = await fetch(
          `https://insight-library.onrender.com/api/payments/download/${contentId}`,
          {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${token}`
            }
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Download failed.");
        }

        // Open the temporary Backblaze download link
        window.location.href = data.downloadUrl;

        downloadBtn.disabled = false;
        downloadBtn.textContent = "Download Again";

      } catch (error) {
        console.error("Download error:", error);

        alert(error.message || "Download failed.");

        downloadBtn.disabled = false;
        downloadBtn.textContent = "Download Content";
      }
    };

  } catch (error) {
    console.error("Verification error:", error);

    message.textContent =
      "Something went wrong while verifying your payment.";
  }
}

verifyPayment();