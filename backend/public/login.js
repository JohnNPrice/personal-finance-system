document.getElementById("loginBtn").addEventListener("click", async () => {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();

  if (res.ok) {
    window.location.href = "/";
  } else {
    document.getElementById("msg").innerText = data.error;
  }
});
