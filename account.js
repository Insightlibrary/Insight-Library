// ================================
// MY ACCOUNT
// ================================

const accountDetails =
  document.getElementById("account-details");


// ================================
// CHECK LOGIN
// ================================

const token =
  localStorage.getItem("token");


// User is not logged in

if (!token) {

  accountDetails.innerHTML = `
    <h2>
      You are not logged in
    </h2>

    <p>
      Please log in to view your account.
    </p>

    <a href="login.html">
      Login
    </a>
  `;

}


// User is logged in

else {

  loadAccount();

}


// ================================
// LOAD ACCOUNT INFORMATION
// ================================

async function loadAccount() {

  try {

    const response = await fetch(
      "https://insight-library.onrender.com/api/v1/auth/me",
      {
        headers: {
          "Authorization":
            `Bearer ${token}`
        }
      }
    );


    if (!response.ok) {

      throw new Error(
        "Unable to load account"
      );

    }


    const user =
      await response.json();


    accountDetails.innerHTML = `

      <div class="account-info">

        <div class="account-info-item">

          <span>
            Name:
          </span>

          <strong>
            ${user.name}
          </strong>

        </div>


        <div class="account-info-item">

          <span>
            Email:
          </span>

          <strong>
            ${user.email}
          </strong>

        </div>


        <div class="account-info-item">

          <span>
            Account Type:
          </span>

          <strong>
            ${user.role}
          </strong>

        </div>

      </div>

    `;


  } catch (error) {

    console.error(
      "Account error:",
      error
    );


    accountDetails.innerHTML = `

      <h2>
        Unable to load account
      </h2>

      <p>
        Please try logging in again.
      </p>

      <a href="login.html">
        Login
      </a>

    `;

  }

}
