const uploadForm = document.getElementById("uploadForm");
const message = document.getElementById("message");

uploadForm.addEventListener("submit", async (event) => {

  event.preventDefault();

  const token = localStorage.getItem("token");

  if (!token) {
    message.textContent = "Please login first.";
    return;
  }

  const formData = new FormData();

  formData.append(
    "title",
    document.getElementById("title").value
  );

  formData.append(
    "description",
    document.getElementById("description").value
  );

  formData.append(
    "price",
    document.getElementById("price").value
  );

  formData.append(
    "file",
    document.getElementById("file").files[0]
  );

  message.textContent = "Uploading...";

  try {

    const response = await fetch(
      "https://insight-library.onrender.com/api/admin/content/upload",
      {
        method: "POST",

        headers: {
          "Authorization": `Bearer ${token}`
        },

        body: formData
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || data.error || "Upload failed"
      );
    }

    message.textContent =
      "Content uploaded successfully!";

    uploadForm.reset();

    console.log(data);

  } catch (error) {

    console.error(error);

    message.textContent =
      "Upload failed: " + error.message;
  }

});
