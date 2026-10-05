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

const migrateContentButton =
  document.getElementById("migrateContentButton");

const migrationMessage =
  document.getElementById("migrationMessage");


if (migrateContentButton) {

  migrateContentButton.addEventListener("click", async () => {

    const token = localStorage.getItem("token");

    if (!token) {
      migrationMessage.textContent =
        "Please login first.";

      return;
    }


    const confirmed = confirm(
      "Assign all existing unowned content to the Super Admin?"
    );

    if (!confirmed) {
      return;
    }


    migrationMessage.textContent =
      "Running migration...";


    try {

      const response = await fetch(
        "https://insight-library.onrender.com/api/migration/assign-existing-content",
        {
          method: "POST",

          headers: {
            "Authorization": `Bearer ${token}`
          }
        }
      );


      const data = await response.json();


      if (!response.ok) {
        throw new Error(
          data.message || "Migration failed"
        );
      }


      migrationMessage.textContent =
        `Migration completed. ${data.modified} content item(s) assigned to the Super Admin.`;


      console.log(
        "CONTENT MIGRATION RESULT:",
        data
      );


    } catch (error) {

      console.error(
        "CONTENT MIGRATION ERROR:",
        error
      );

      migrationMessage.textContent =
        "Migration failed: " + error.message;
    }

  });

}