let menubtn = document.getElementById("menu-btn");

let sidebar = document.getElementById("sidebar");

function toggle(x) {
  sidebar.classList.toggle("active");
  x.classList.toggle("change");

}

/*featured post start here */

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







