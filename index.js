
require("dotenv").config()

const express = require("express")
const paymentRoutes = require("./routes/paymentRoutes");
const contentRoutes = require("./routes/contentRoutes");
const adminContentRoutes = require("./routes/adminContentRoutes");
const mongoose = require("mongoose")
const cors = require("cors")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const morgan = require("morgan")
const multer = require("multer")
const rateLimit = require("express-rate-limit")
const PasswordReset = require("./models/PasswordReset");
const transporter = require("./config/email");

const app = express()

/* ---------------- GLOBAL MIDDLEWARE ---------------- */

console.log(
  process.env.PAYSTACK_SECRET_KEY
    ? "Paystack secret key detected"
    : "Paystack secret key NOT detected"
);


app.use(cors())
app.use(express.json())
app.use("/api/payments", paymentRoutes);
app.use("/api/contents", contentRoutes);
app.use("/api/admin/content", adminContentRoutes);
app.use(morgan("dev"))

const limiter = rateLimit({

windowMs: 15 * 60 * 1000,
max: 100
})

app.use(limiter)

/* DATABASE CONNECTION */

mongoose.connect(process.env.MONGO_URI, {
 serverSelectionTimeoutMS: 10000 // Wait up to 30s before timing out
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

app.post("/api/v1/auth/forgot-password", async (req, res) => {

  try {

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required"
      });
    }

    const user = await User.findOne({ email });

    // Don't reveal whether the email exists
    if (!user) {
      return res.json({
        message: "If an account exists with that email, a reset link has been sent."
      });
    }

    // Create a random reset token
    const crypto = require("crypto");

    const token = crypto.randomBytes(32).toString("hex");

    // Token expires after 15 minutes
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Remove any previous reset token for this user
    await PasswordReset.deleteMany({
      userId: user._id
    });

    // Save the new reset token
    await PasswordReset.create({
      userId: user._id,
      token: token,
      expiresAt: expiresAt
    });

    // Link the user will click in their email
    const resetLink =
      `https://insightlibrary.github.io/Insight-Library/reset-password.html?token=${token}`;

    // Send the email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Reset your Insight-Library password",

      html: `
        <h2>Password Reset</h2>

        <p>Hello ${user.name || "there"},</p>

        <p>
          We received a request to reset your Insight-Library password.
        </p>

        <p>
          Click the button below to create a new password:
        </p>

        <p>
          <a href="${resetLink}"
             style="
               display:inline-block;
               padding:12px 20px;
               background:#007bff;
               color:white;
               text-decoration:none;
               border-radius:5px;
             ">
            Reset Password
          </a>
        </p>

        <p>
          This link will expire in 15 minutes.
        </p>

        <p>
          If you did not request this, you can ignore this email.
        </p>
      `
    });

    res.json({
      message: "If an account exists with that email, a reset link has been sent."
    });

  } catch (error) {

    console.error("Forgot password error:", error);

    res.status(500).json({
      message: "Something went wrong. Please try again later."
    });

  }

});

app.post("/api/v1/auth/reset-password", async (req, res) => {

  try {

    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        message: "Token and new password are required"
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters"
      });
    }

    // Find the reset token
    const resetRequest = await PasswordReset.findOne({
      token: token
    });

    if (!resetRequest) {
      return res.status(400).json({
        message: "Invalid or expired reset link"
      });
    }

    // Check whether the token has expired
    if (resetRequest.expiresAt < new Date()) {

      await PasswordReset.deleteOne({
        _id: resetRequest._id
      });

      return res.status(400).json({
        message: "Invalid or expired reset link"
      });
    }

    // Find the user
    const user = await User.findById(
      resetRequest.userId
    );

    if (!user) {
      return res.status(400).json({
        message: "User not found"
      });
    }

    // Hash the new password
    const hash = await bcrypt.hash(
      newPassword,
      10
    );

    // Save the new password
    user.password = hash;

    await user.save();

    // Delete the reset token so it cannot be used again
    await PasswordReset.deleteOne({
      _id: resetRequest._id
    });

    res.json({
      message: "Password reset successfully"
    });

  } catch (error) {

    console.error("Reset password error:", error);

    res.status(500).json({
      message: "Something went wrong. Please try again later."
    });

  }

});

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

