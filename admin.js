const uploadForm = document.getElementById("uploadForm");
const message = document.getElementById("message");


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

  if (!title || !description || !price) {

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
  // CHECK PRICE
  // ==================================================

  if (Number(price) < 1500) {

    message.textContent =
      "The minimum content price is ₦1,500.";

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


    if (!previewPages.value ||
        Number(previewPages.value) < 1) {

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
    "price",
    price
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