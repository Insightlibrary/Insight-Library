
require("dotenv").config()

const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const morgan = require("morgan")
const multer = require("multer")
const rateLimit = require("express-rate-limit")

const app = express()

/* ---------------- GLOBAL MIDDLEWARE ---------------- */

app.use(cors())
app.use(express.json())
app.use(morgan("dev"))

const limiter = rateLimit({
windowMs: 15 * 60 * 1000,
max: 100
})

app.use(limiter)

/* DATABASE CONNECTION */

mongoose.connect(process.env.MONGO_URI, {
 serverSelectionTimeoutMS: 30000 // Wait up to 30s before timing out
})
.then(() => {
  console.log("MongoDB connected")
})
.catch((err) => {
  console.error("MongoDB connection error:", err)
})




/* ---------------- FILE UPLOAD ---------------- */

const storage = multer.diskStorage({
destination:function(req,file,cb){
cb(null,"uploads/")
},
filename:function(req,file,cb){
cb(null,Date.now()+"-"+file.originalname)
}
})

const upload = multer({storage})

/* ---------------- USER MODEL ---------------- */

const userSchema = new mongoose.Schema({

name:{
type:String,
required:true
},

email:{
type:String,
required:true,
unique:true
},

password:{
type:String,
required:true
},

role:{
type:String,
default:"user"
},

age:Number,

avatar:String,

createdAt:{
type:Date,
default:Date.now
}

})

const User = mongoose.model("User",userSchema)

// ✅ IMPORT MODEL
const Post = require("./models/Post");

// ✅ TEST ROUTE (CHECK SERVER)
app.get("/", (req, res) => {
  res.send("API is working");
});


// 🔥 CREATE POST ROUTE (THIS IS WHAT YOU NEED)
app.post("/add-post", async (req, res) => {
  try {
    console.log("BODY:", req.body); // 👈 shows what you sent
    const { title, link, isFeatured } = req.body;

    const newPost = new Post({
      title,
      link,
      isFeatured
    });

    await newPost.save();

    res.json({
      message: "Post created successfully",
      data: newPost
    });

  } catch (err) {
    console.log("REAL ERROR:", err); // 👈 THIS IS WHAT WE NEED
    res.status(500).json({ error: err.message });
  }
});


// 🔍 SEARCH ROUTE (FOR YOUR FRONTEND)
app.get("/search", async (req, res) => {
  try {
    const query = req.query.q || "";

    const results = await Post.find({
      title: { $regex: query, $options: "i" }
    });

    res.json(results);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//test API
app.get("/test-db", async (req, res) => {
  try {
    const posts = await Post.find();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//delete route for front end
app.delete("/posts/:id", async (req, res) => {
  try {
    const id = req.params.id;

    await Post.findByIdAndDelete(id);

    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/* ---------------- LOGGER MIDDLEWARE ---------------- */

function logger(req,res,next){

console.log("Request:",req.method,req.url)

next()

}

app.use(logger)

/* ---------------- AUTH MIDDLEWARE ---------------- */

function auth(req,res,next){

const token = req.headers.authorization

if(!token){

return res.status(401).json({
message:"Token required"
})

}

try{

const decoded = jwt.verify(token,process.env.JWT_SECRET)

req.user = decoded

next()

}catch(err){

res.status(401).json({
message:"Invalid token"
})

}

}

/* ---------------- ADMIN MIDDLEWARE ---------------- */

function admin(req,res,next){

if(req.user.role !== "admin"){

return res.status(403).json({
message:"Admin only"
})

}

next()

}

/* ---------------- ROOT ---------------- */

app.get("/",(req,res)=>{

res.send("Professional API running")

})

/* ---------------- REGISTER ---------------- */

app.post("/api/v1/auth/register",async(req,res)=>{

try{

const {name,email,password,age} = req.body

const exist = await User.findOne({email})

if(exist){

return res.status(400).json({
message:"User already exists"
})

}

const hash = await bcrypt.hash(password,10)

const user = new User({
name,
email,
password:hash,
age
})

await user.save()

res.json({
message:"User registered",
user
})

}catch(err){

res.status(500).json({error:err.message})

}

})

/* ---------------- LOGIN ---------------- */

app.post("/api/v1/auth/login",async(req,res)=>{

try{

const {email,password} = req.body

const user = await User.findOne({email})

if(!user){

return res.status(400).json({
message:"Invalid email"
})

}

const match = await bcrypt.compare(password,user.password)

if(!match){

return res.status(400).json({
message:"Wrong password"
})

}

const token = jwt.sign({

id:user._id,
role:user.role

},process.env.JWT_SECRET,{expiresIn:"1d"})

res.json({
message:"Login success",
token
})

}catch(err){

res.status(500).json({error:err.message})

}

})

/* ---------------- CREATE USER ---------------- */

app.post("/api/v1/users",auth,async(req,res)=>{

try{

const user = new User(req.body)

await user.save()

res.json(user)

}catch(err){

res.status(500).json({error:err.message})

}

})

/* ---------------- GET USERS ---------------- */

app.get("/api/v1/users",auth,async(req,res)=>{

try{

const page = parseInt(req.query.page) || 1
const limit = 5

const users = await User.find()
.skip((page-1)*limit)
.limit(limit)

res.json(users)

}catch(err){

res.status(500).json({error:err.message})

}

})

/* ---------------- GET SINGLE USER ---------------- */

app.get("/api/v1/users/:id",auth,async(req,res)=>{

try{

const user = await User.findById(req.params.id)

res.json(user)

}catch(err){

res.status(500).json({error:err.message})

}

})

/* ---------------- UPDATE USER ---------------- */

app.put("/api/v1/users/:id",auth,async(req,res)=>{

try{

const user = await User.findByIdAndUpdate(
req.params.id,
req.body,
{new:true}
)

res.json(user)

}catch(err){

res.status(500).json({error:err.message})

}

})

/* ---------------- DELETE USER ---------------- */

app.delete("/api/v1/users/:id",auth,admin,async(req,res)=>{

try{

await User.findByIdAndDelete(req.params.id)

res.json({
message:"User deleted"
})

}catch(err){

res.status(500).json({error:err.message})

}

})

/* ---------------- SEARCH ---------------- */

app.get("/api/v1/search",auth,async(req,res)=>{

try{

const keyword = req.query.name

const users = await User.find({
name:{$regex:keyword,$options:"i"}
})

res.json(users)

}catch(err){

res.status(500).json({error:err.message})

}

})

/* ---------------- FILE UPLOAD ---------------- */

app.post("/api/v1/upload",auth,upload.single("avatar"),(req,res)=>{

res.json({
file:req.file
})

})

/* ---------------- GLOBAL ERROR HANDLER ---------------- */

app.use((err,req,res,next)=>{

console.error(err)

res.status(500).json({
message:"Server error"
})

})

/* ---------------- SERVER ---------------- */

const PORT = process.env.PORT || 5000

app.listen(PORT,()=>{

console.log("Server running on port "+PORT)

})

