const express = require("express");
const multer = require("multer");
const { PutObjectCommand } = require("@aws-sdk/client-s3");

const s3 = require("../config/b2");
const Content = require("../models/Content");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

const router = express.Router();


// ==================================================
// ALLOWED FILE TYPES
// ==================================================

// These are the types we allow as the MAIN paid file.
const allowedMainTypes = [

  "application/pdf",

  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",

  "text/plain",
  "text/csv",

  "application/zip"

];


// ==================================================
// MULTER FILE UPLOAD SETTINGS
// ==================================================

const upload = multer({

  // Store the uploaded file temporarily in memory.
  // We will send it directly to Backblaze B2.
  storage: multer.memoryStorage(),

  // Maximum size for each uploaded file.
  limits: {
    fileSize: 50 * 1024 * 1024
  }

});


// ==================================================
// HELPER: CREATE SAFE FILE NAME
// ==================================================

function createSafeFileName(originalName) {

  return originalName
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\s+/g, "-");

}


// ==================================================
// ADMIN CONTENT UPLOAD
// ==================================================

router.post(
  "/upload",

  // User must be logged in.
  auth,

  // For now, only Super Admin can upload.
  admin,

  // Accept the three possible files.
  upload.fields([
    {
      name: "file",
      maxCount: 1
    },
    {
      name: "previewFile",
      maxCount: 1
    },
    {
      name: "cover",
      maxCount: 1
    }
  ]),

  async (req, res) => {

    try {

      // ==================================================
      // GET FORM INFORMATION
      // ==================================================

      const {
        title,
        description,
        price,

        previewEnabled,
        previewPages,

        tiktok,
        facebook,
        youtube,
        other

      } = req.body;


      // ==================================================
      // CHECK REQUIRED INFORMATION
      // ==================================================

    if (
  !title ||
  !description ||
  !contentType
) {

  return res.status(400).json({
    message:
      "Title, description and content type are required"
  });

}

// ==================================================
// CHECK FREE OR PAID CONTENT
// ==================================================

if (
  contentType !== "free" &&
  contentType !== "paid"
) {

  return res.status(400).json({
    message:
      "Content type must be free or paid"
  });

}


// FREE CONTENT MUST HAVE PRICE 0

if (contentType === "free") {

  req.body.price = 0;

}


// PAID CONTENT MUST BE AT LEAST ₦1,500

if (contentType === "paid") {

  if (
    price === undefined ||
    Number(price) < 1500
  ) {

    return res.status(400).json({
      message:
        "Paid content must have a minimum price of ₦1,500"
    });

  }

}


      // ==================================================
      // GET UPLOADED FILES
      // ==================================================

      const mainFile =
        req.files?.file?.[0];

      const previewFile =
        req.files?.previewFile?.[0];

      const coverFile =
        req.files?.cover?.[0];


      // ==================================================
      // MAIN FILE IS REQUIRED
      // ==================================================

      if (!mainFile) {

        return res.status(400).json({
          message:
            "Main content file is required"
        });

      }


      // ==================================================
      // CHECK MAIN FILE TYPE
      // ==================================================

      if (
        !allowedMainTypes.includes(
          mainFile.mimetype
        )
      ) {

        return res.status(400).json({
          message:
            "This main file type is not supported"
        });

      }


      // ==================================================
      // PREVIEW FILE CHECK
      // ==================================================

      if (previewFile) {

        if (
          previewFile.mimetype !==
          "application/pdf"
        ) {

          return res.status(400).json({
            message:
              "Preview file must be a PDF"
          });

        }

      }


      // ==================================================
      // COVER IMAGE CHECK
      // ==================================================

      if (coverFile) {

        const allowedCoverTypes = [

          "image/jpeg",
          "image/png",
          "image/webp"

        ];

        if (
          !allowedCoverTypes.includes(
            coverFile.mimetype
          )
        ) {

          return res.status(400).json({
            message:
              "Cover must be JPG, PNG or WebP"
          });

        }

      }


      // ==================================================
      // CREATE SAFE MAIN FILE NAME
      // ==================================================

      const safeMainFileName =
        createSafeFileName(
          mainFile.originalname
        );


      // ==================================================
      // CREATE MAIN B2 KEY
      // ==================================================

      const mainFileKey =
        `contents/${Date.now()}-${safeMainFileName}`;


      // ==================================================
      // UPLOAD MAIN FILE TO B2
      // ==================================================

      const mainCommand =
        new PutObjectCommand({

          Bucket:
            process.env.B2_BUCKET_NAME,

          Key:
            mainFileKey,

          Body:
            mainFile.buffer,

          ContentType:
            mainFile.mimetype

        });


      await s3.send(mainCommand);


      // ==================================================
      // PREVIEW FILE
      // ==================================================

      let previewFileKey = "";


      if (previewFile) {

        const safePreviewFileName =
          createSafeFileName(
            previewFile.originalname
          );


        previewFileKey =
          `previews/${Date.now()}-${safePreviewFileName}`;


        const previewCommand =
          new PutObjectCommand({

            Bucket:
              process.env.B2_BUCKET_NAME,

            Key:
              previewFileKey,

            Body:
              previewFile.buffer,

            ContentType:
              "application/pdf"

          });


        await s3.send(previewCommand);

      }


      // ==================================================
      // COVER IMAGE
      // ==================================================

      let coverFileKey = "";


      if (coverFile) {

        const safeCoverFileName =
          createSafeFileName(
            coverFile.originalname
          );


        coverFileKey =
          `covers/${Date.now()}-${safeCoverFileName}`;


        const coverCommand =
          new PutObjectCommand({

            Bucket:
              process.env.B2_BUCKET_NAME,

            Key:
              coverFileKey,

            Body:
              coverFile.buffer,

            ContentType:
              coverFile.mimetype

          });


        await s3.send(coverCommand);

      }


      // ==================================================
      // PREVIEW SETTINGS
      // ==================================================

      const isPreviewEnabled =
        previewEnabled === "true";


      const numberOfPreviewPages =
        Number(previewPages) || 0;


      // ==================================================
      // CREATE CONTENT RECORD
      // ==================================================

      const content =
        new Content({

          // Basic information
          title:
            title.trim(),

          description:
            description.trim(),
            
         contentType:
            contentType,

          price:
  contentType === "free"
    ? 0
    : Number(price),

          // Main paid file
          fileUrl:
            mainFileKey,


          // Preview
          previewEnabled:
            isPreviewEnabled,

          previewFileUrl:
            previewFileKey,

          previewPages:
            numberOfPreviewPages,


          // Cover
          coverImageUrl:
            coverFileKey,


          // Creator
          ownerId:
            req.user.id,


          // Social links
          socialLinks: {

            tiktok:
              tiktok || "",

            facebook:
              facebook || "",

            youtube:
              youtube || "",

            other:
              other || ""

          }

        });


      // ==================================================
      // SAVE CONTENT TO MONGODB
      // ==================================================

      await content.save();


      // ==================================================
      // SUCCESS RESPONSE
      // ==================================================

      res.status(201).json({

        message:
          "Content uploaded successfully",

        content

      });


    } catch (error) {

      console.error(
        "ADMIN UPLOAD ERROR:",
        error
      );


      res.status(500).json({

        message:
          "Content upload failed",

        error:
          error.message

      });

    }

  }

);


// ==================================================
// EXPORT ROUTER
// ==================================================

module.exports = router;