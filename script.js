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

  const res = await fetch(`http://localhost:5000/search?q=${query}`);
  const data = await res.json();

  resultsDiv.innerHTML = data.map(post => `
    <div class="result-item">
      <a href="${post.link}" target="_blank">
        ${post.title}
      </a>
    </div>
  `).join("");
});
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







