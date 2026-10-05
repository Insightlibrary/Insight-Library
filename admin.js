const uploadForm = document.getElementById("uploadForm");
const message = document.getElementById("message");


// ==================================================
// FREE / PAID CONTENT
// ==================================================

const contentType =
  document.getElementById("contentType");

const priceSection =
  document.getElementById("priceSection");


// Show or hide price depending on content type
contentType.addEventListener("change", () => {

  if (contentType.value === "free") {

    priceSection.style.display = "none";

  } else {

    priceSection.style.display = "block";

  }

});


// ==================================================
// PREVIEW SETTINGS
// ==================================================

const previewEnabled =
  document.getElementById("previewEnabled");

const previewSettings =
  document.getElementById("previewSettings");

const previewFile =
  document.getElementById("previewFile");

const previewPages =
  document.getElementById("previewPages");


// Show or hide preview settings
previewEnabled.addEventListener("change", () => {

  if (previewEnabled.checked) {

    previewSettings.style.display = "block";

  } else {

    previewSettings.style.display = "none";

    previewFile.value = "";

    previewPages.value = "";

  }

});


// ==================================================
// UPLOAD FORM
// ==================================================

uploadForm.addEventListener("submit", async (event) => {

  event.preventDefault();


  // ==================================================
  // CHECK LOGIN
  // ==================================================

  const token = localStorage.getItem("token");

  if (!token) {

    message.textContent =
      "Please login first.";

    return;

  }


  // ==================================================
  // GET BASIC INFORMATION
  // ==================================================

  const title =
    document.getElementById("title").value.trim();

  const description =
    document.getElementById("description").value.trim();

  const selectedContentType =
    contentType.value;

  const price =
    document.getElementById("price").value;


  // ==================================================
  // GET MAIN FILE
  // ==================================================

  const mainFile =
    document.getElementById("file").files[0];


  // ==================================================
  // BASIC VALIDATION
  // ==================================================

  if (!title || !description) {

    message.textContent =
      "Please fill in all required fields.";

    return;

  }


  if (!mainFile) {

    message.textContent =
      "Please select the main content file.";

    return;

  }


  // ==================================================
  // CHECK FREE / PAID CONTENT
  // ==================================================

  if (
    selectedContentType !== "free" &&
    selectedContentType !== "paid"
  ) {

    message.textContent =
      "Please choose whether this content is free or paid.";

    return;

  }


  // ==================================================
  // CHECK PAID CONTENT PRICE
  // ==================================================

  if (
    selectedContentType === "paid" &&
    (!price || Number(price) < 1500)
  ) {

    message.textContent =
      "Paid content must have a minimum price of ₦1,500.";

    return;

  }


  // ==================================================
  // PREVIEW VALIDATION
  // ==================================================

  if (previewEnabled.checked) {

    if (!previewFile.files[0]) {

      message.textContent =
        "Please select a preview PDF.";

      return;

    }


    if (
      !previewPages.value ||
      Number(previewPages.value) < 1
    ) {

      message.textContent =
        "Please enter the number of preview pages.";

      return;

    }

  }


  // ==================================================
  // GET OPTIONAL FILES
  // ==================================================

  const coverFile =
    document.getElementById("cover").files[0];


  // ==================================================
  // GET SOCIAL LINKS
  // ==================================================

  const tiktok =
    document.getElementById("tiktok").value.trim();

  const facebook =
    document.getElementById("facebook").value.trim();

  const youtube =
    document.getElementById("youtube").value.trim();

  const other =
    document.getElementById("other").value.trim();


  // ==================================================
  // CREATE FORM DATA
  // ==================================================

  const formData = new FormData();


  // ==================================================
  // BASIC INFORMATION
  // ==================================================

  formData.append(
    "title",
    title
  );

  formData.append(
    "description",
    description
  );

  formData.append(
    "contentType",
    selectedContentType
  );

  formData.append(
    "price",
    selectedContentType === "free"
      ? "0"
      : price
  );


  // ==================================================
  // MAIN FILE
  // ==================================================

  formData.append(
    "file",
    mainFile
  );


  // ==================================================
  // PREVIEW
  // ==================================================

  formData.append(
    "previewEnabled",
    previewEnabled.checked
      ? "true"
      : "false"
  );


  if (previewEnabled.checked) {

    formData.append(
      "previewFile",
      previewFile.files[0]
    );

    formData.append(
      "previewPages",
      previewPages.value
    );

  } else {

    formData.append(
      "previewPages",
      "0"
    );

  }


  // ==================================================
  // COVER IMAGE
  // ==================================================

  if (coverFile) {

    formData.append(
      "cover",
      coverFile
    );

  }


  // ==================================================
  // SOCIAL LINKS
  // ==================================================

  formData.append(
    "tiktok",
    tiktok
  );

  formData.append(
    "facebook",
    facebook
  );

  formData.append(
    "youtube",
    youtube
  );

  formData.append(
    "other",
    other
  );


  // ==================================================
  // SHOW UPLOADING MESSAGE
  // ==================================================

  message.textContent =
    "Uploading content...";


  // ==================================================
  // SEND TO RENDER BACKEND
  // ==================================================

  try {

    const response = await fetch(
      "https://insight-library.onrender.com/api/admin/content/upload",
      {

        method: "POST",

        headers: {

          "Authorization":
            `Bearer ${token}`

        },

        body: formData

      }
    );


    // ==================================================
    // READ SERVER RESPONSE
    // ==================================================

    const data =
      await response.json();


    // ==================================================
    // CHECK FOR ERROR
    // ==================================================

    if (!response.ok) {

      throw new Error(
        data.message ||
        data.error ||
        "Upload failed"
      );

    }


    // ==================================================
    // SUCCESS
    // ==================================================

    message.textContent =
      "Content uploaded successfully!";


    uploadForm.reset();


    // Reset price section
    priceSection.style.display = "block";


    // Hide preview settings again
    previewSettings.style.display = "none";


    console.log(
      "Upload response:",
      data
    );


  } catch (error) {

    console.error(
      "UPLOAD ERROR:",
      error
    );


    message.textContent =
      "Upload failed: " +
      error.message;

  }

});

