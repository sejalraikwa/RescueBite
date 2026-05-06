// ✅ FIXED — register.html calls registerUser() AND handleRegister()
// Old register.js only exported registerUser but register.html also needs
// handleRegister AND selectRole to work with the new beautiful design.
// This file handles BOTH so either button works.

import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword } from
  "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, setDoc, serverTimestamp } from
  "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let currentRole = "donor"; // default role

// ── ROLE SELECTOR ────────────────────────────────────────
// Works for BOTH old register.html (btn-donor/btn-volunteer)
// AND new register.html (donorBtn/volunteerBtn + role-pill)
function selectRole(role) {
  currentRole = role;

  // New design buttons (donorBtn / volunteerBtn)
  const donorBtn     = document.getElementById("donorBtn");
  const volunteerBtn = document.getElementById("volunteerBtn");
  if (donorBtn)     donorBtn.classList.toggle("active",     role === "donor");
  if (volunteerBtn) volunteerBtn.classList.toggle("active", role === "volunteer");

  // Old design buttons (btn-donor / btn-volunteer)
  const oldDonor     = document.getElementById("btn-donor");
  const oldVolunteer = document.getElementById("btn-volunteer");
  if (oldDonor)     oldDonor.className     = role === "donor"     ? "role-btn active" : "role-btn";
  if (oldVolunteer) oldVolunteer.className = role === "volunteer" ? "role-btn active" : "role-btn";

  // Hidden input (old design)
  const hiddenRole = document.getElementById("selected-role");
  if (hiddenRole) hiddenRole.value = role;

  // Show / hide donor-only and volunteer-only fields
  const donorFields     = document.getElementById("donorFields");
  const volunteerFields = document.getElementById("volunteerFields");
  if (donorFields)     donorFields.style.display     = role === "donor"     ? "" : "none";
  if (volunteerFields) volunteerFields.style.display = role === "volunteer" ? "" : "none";

  // Left panel role pills
  document.querySelectorAll(".role-pill").forEach((el, i) => {
    el.classList.toggle("active",
      (i === 0 && role === "donor") || (i === 1 && role === "volunteer")
    );
  });
}
window.selectRole = selectRole;

// ── CHECK URL PARAM — pre-select role if ?role=volunteer ─
const urlRole = new URLSearchParams(window.location.search).get("role");
if (urlRole === "volunteer" || urlRole === "donor") {
  selectRole(urlRole);
}

// ── REGISTER USER ────────────────────────────────────────
// Works whether button calls registerUser() or handleRegister()
async function registerUser() {
  const msg = document.getElementById("msg") || document.getElementById("message");
  const btn = document.getElementById("registerBtn");

  // Clear message
  if (msg) { msg.className = "msg"; msg.textContent = ""; }

  // Read fields — supports both old and new register.html field IDs
  const firstName = (document.getElementById("firstName")?.value || "").trim();
  const lastName  = (document.getElementById("lastName")?.value  || "").trim();
  const fullName  = (document.getElementById("name")?.value      || "").trim();
  const name      = firstName ? firstName + " " + lastName : fullName;

  const email    = (document.getElementById("email")?.value           || "").trim();
  const phone    = (document.getElementById("phone")?.value           || "").trim();
  const address  = (document.getElementById("address")?.value         || "").trim();
  const password = (document.getElementById("password")?.value        || "");
  const confirm  = (document.getElementById("confirmPassword")?.value || "");

  // Role — from currentRole variable (set by selectRole) or hidden input
  const hiddenRole = document.getElementById("selected-role");
  const role = hiddenRole ? hiddenRole.value : currentRole;

  // ── VALIDATION ──────────────────────────────────────────
  if (!email || !password) {
    if (msg) { msg.className = "msg error"; msg.textContent = "Email and password are required."; }
    return;
  }
  if (password.length < 6) {
    if (msg) { msg.className = "msg error"; msg.textContent = "Password must be at least 6 characters."; }
    return;
  }
  if (confirm && password !== confirm) {
    if (msg) { msg.className = "msg error"; msg.textContent = "Passwords do not match."; }
    return;
  }

  // Disable button while processing
  if (btn) { btn.disabled = true; btn.textContent = "Creating account…"; }

  try {
    // Step 1 — Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Step 2 — Build profile object
    const userData = {
      uid:       user.uid,
      email,
      name,
      phone,
      address,
      role,
      createdAt: serverTimestamp()
    };

    // Add donor-specific fields
    if (role === "donor") {
      userData.orgName = (document.getElementById("orgName")?.value || "").trim();
    }
    // Add volunteer-specific fields
    if (role === "volunteer") {
      userData.vehicle = (document.getElementById("vehicle")?.value || "");
    }

    // Step 3 — Save to Firestore /users/{uid}
    await setDoc(doc(db, "users", user.uid), userData);

    // Step 4 — Success message + redirect
    if (msg) { msg.className = "msg success"; msg.textContent = "Account created! Redirecting to your dashboard…"; }

    setTimeout(() => {
      window.location.href = role === "volunteer"
        ? "volunteer-dashboard.html"
        : "donor-dashboard.html";
    }, 1200);

  } catch (error) {
    if (btn) { btn.disabled = false; btn.textContent = "Create Account"; }

    const errorMap = {
      "auth/email-already-in-use": "This email is already registered. Please login.",
      "auth/invalid-email":        "Invalid email address.",
      "auth/weak-password":        "Password is too weak.",
    };
    if (msg) {
      msg.className = "msg error";
      msg.textContent = errorMap[error.code] || "Registration failed: " + error.message;
    }
  }
}

// ✅ Export as BOTH names — register.html uses both onclick names
window.registerUser   = registerUser;
window.handleRegister = registerUser;
