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
    const response = await fetch(
      "https://insight-library.onrender.com/api/contents"
    );

    if (!response.ok) {
      throw new Error("Failed to load contents");
    }

    const contents = await response.json();

    const contentList = document.getElementById("content-list");

    contentList.innerHTML = contents.map(content => `
      <div class="content-card">

        <h2>${content.title}</h2>

        <p>${content.description}</p>

        <p>
          Price: ₦${content.price.toLocaleString()}
        </p>

        <button onclick="buyContent('${content._id}')">
          Buy Now
        </button>

      </div>
    `).join("");

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
      alert("Please login before buying content.");
      return;
    }

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







