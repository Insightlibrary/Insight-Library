let menubtn = document.getElementById("menu-btn");

let sidebar = document.getElementById("sidebar");

function toggle(x) {
  sidebar.classList.toggle("active");
  x.classList.toggle("change");

}
//api search start here 

const searchInput = document.getElementById("searchInput");
const resultsDiv = document.getElementById("results");

searchInput.addEventListener("input", async () => {
  const query = searchInput.value;

  if (query.length < 2) {
    resultsDiv.innerHTML = "";
    return;
  }

  const res = await fetch(`https://insight-library.onrender.com/search?q=${query}`);
  const data = await res.json();

  resultsDiv.innerHTML = data.map(post => `
    <div class="result-item">
      <a href="${post.link}" target="_blank">
        ${post.title}
      </a>
    </div>
  `).join("");
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

      if (alreadyPurchased) {

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

//api search ends here 


/*featured post start here 

const posts = [
  {title:"Artificial Intelligence", link:""},
  
  {title:"Android Development", link:""},
  
  {title:"Blog Writing Guide", link:""},
  
  {title:"Coding With Js", link:""},
  
  {title:"Innovation Ideas", link:""},
  
  {title:"Internet Basics", link:""},
  ];
  
  const searchInput = document.getElementById("searchInput");
  const results = document.getElementById("results");
  
  searchInput.addEventListener("keyup", function(){
   let input = searchInput.value.toLowerCase();
   
   results.innerHTML = "";
   
   posts.forEach(function(post){
     if(post.title.toLowerCase().startsWith(input)) {
       
       results.innerHTML +=
       `<div class="result-item">
       <a href="${post.link}">${post.title}</a>
       </div>`;
     }
     
   });
    
  });
  
  /*featured post ends here */







