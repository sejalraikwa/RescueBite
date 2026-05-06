// ✅ FIXED — function is now named handleLogin (login.html calls handleLogin)
// login.js was exporting loginUser but login.html calls handleLogin — mismatch!
import { auth, db } from "./firebase-config.js";
import { signInWithEmailAndPassword } from
  "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc } from
  "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

async function handleLogin() {
  const email    = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const btn      = document.getElementById("loginBtn");
  const msg      = document.getElementById("msg");

  // Clear previous message
  msg.className = "msg";
  msg.textContent = "";

  if (!email || !password) {
    msg.className = "msg error";
    msg.textContent = "Please fill in all fields.";
    return;
  }

  btn.disabled = true;
  btn.textContent = "Signing in…";

  try {
    // Step 1: Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Step 2: Get user role from Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid));

    // ✅ FIXED — safely read role even if doc fields differ
    const role = userDoc.exists() ? (userDoc.data().role || "donor") : "donor";

    msg.className = "msg success";
    msg.textContent = "Login successful! Redirecting…";

    setTimeout(() => {
      window.location.href = role === "volunteer"
        ? "volunteer-dashboard.html"
        : "donor-dashboard.html";
    }, 900);

  } catch (error) {
    btn.disabled = false;
    btn.textContent = "Sign In";

    const errorMap = {
      "auth/user-not-found":    "No account found with this email.",
      "auth/wrong-password":    "Incorrect password.",
      "auth/invalid-email":     "Invalid email address.",
      "auth/invalid-credential":"Email or password is incorrect.",
      "auth/too-many-requests": "Too many attempts. Try again later.",
    };
    msg.className = "msg error";
    msg.textContent = errorMap[error.code] || "Login failed: " + error.message;
  }
}

// ✅ Make it available globally so login.html onclick="handleLogin()" works
window.handleLogin = handleLogin;

// Allow Enter key to submit
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleLogin();
});
