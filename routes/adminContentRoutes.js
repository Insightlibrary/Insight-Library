const express = require("express");
const multer = require("multer");
const {
  PutObjectCommand
} = 
require("@aws-sdk/client-s3");

const s3 = require("../config/b2");
const Content = require("../models/Content");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

const router = express.Router();

// store uploaded file temporary in memory 
const upload = multer({
  storage:
  multer.memoryStorage(),
  limites: {
    fileSize: 50 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("only PDF files are allowed"));
    }
    cb(null, true);
  }
});

// ADMIN: Upload new content 
router.post(
  "/upload",
  auth,
  admin,
  upload.single("file"),
  async (req, res) => {
    try {
      const { title, description, price} = req.body;
      // check required fields
      if (!title || !description || price === undefined) {
        return 
        res.status(400).json({
          message: "Title, description and price are required"
        });
      }
      //check file
      if (!req.file) {
        return 
        res.status(400).json({
          message: "PDF file is required"
        });
      }
      //create a unique file key
const safeFileName = req.file.originalname
  .replace(/[^\x20-\x7E]/g, "")
  .replace(/\s+/g, "-");

const fileKey =
  `contents/${Date.now()}-${safeFileName}`;

      //Upload PDF to Backblaze B2
      const command = new PutObjectCommand({
        Bucket:
        process.env.B2_BUCKET_NAME,
        Key: fileKey,
        Body:
        req.file.buffer,
        ContentType:
        "application/pdf"
      });
      await
      s3.send(command);
      
      //saved content information in mongoDB
      const content = new Content({
        title,
        description,
        price:
        Number(price),
        fileUrl: fileKey
      });
      await content.save();
      
      res.status(201).json({
        message: "Content uploaded successfully", content
      });
    } catch (error) {
      console.error("ADMIN UPLOAD ERROR:", error);
      res.status(500).json({
        message: "Content upload failed",
        error: error.message
      });
    }
  }
);
module.exports = router;
