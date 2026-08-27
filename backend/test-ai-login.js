const fetch = global.fetch;

async function login() {
  try {
    const response = await fetch("http://localhost:8000/api/v1/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "bhide@gmail.com",
        password: "Bhide@123",
        tenantId: 1,
      }),
    });

    const data = await response.json();

    console.log("Login status:", response.status);

    if (!response.ok) {
      console.log("Login failed:");
      console.log(data);
      return;
    }

    console.log("Login successful.");
    console.log("User:", data.data.user);
    console.log("JWT:");
    console.log(data.data.token);
  } catch (error) {
    console.error("ERROR:", error.message);
  }
}

login();