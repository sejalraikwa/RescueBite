// ✅ FIXED — updated to Firebase 10.12.0 to match firebase-config.js
import { db, auth } from "./firebase-config.js";
import {
  collection, query, where,
  onSnapshot, doc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

let map;
let currentUserId = null;
let activeMarkers = [];

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUserId = user.uid;
    loadMyPickups();
  }
});

// ── INIT MAP ─────────────────────────────────────────────
window.initMap = function () {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 23.1815, lng: 79.9864 },
    zoom: 13,
  });
  loadAvailableListings();
};

// ── LOAD AVAILABLE LISTINGS + MAP PINS ───────────────────
function loadAvailableListings() {
  const listingsDiv = document.getElementById("all-listings");

  const q = query(
    collection(db, "foodListings"),
    where("status", "==", "available")
  );

  onSnapshot(q, (snapshot) => {
    // Clear old markers from map
    activeMarkers.forEach(m => m.setMap(null));
    activeMarkers = [];
    if (listingsDiv) listingsDiv.innerHTML = "";

    if (snapshot.empty) {
      if (listingsDiv) listingsDiv.innerHTML =
        "<p style='color:#888'>No food available right now. Check back soon!</p>";
      return;
    }

    snapshot.forEach((docSnap) => {
      const d  = docSnap.data();
      const id = docSnap.id;

      // Add map marker
      if (map && d.lat && d.lng) {
        const marker = new google.maps.Marker({
          position: { lat: d.lat, lng: d.lng },
          map: map,
          title: d.foodName,
          icon: "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
        });
        activeMarkers.push(marker);

        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="font-family:sans-serif;padding:.5rem;max-width:220px">
              <h3 style="color:#16a34a;margin:0 0 .3rem">🍱 ${d.foodName}</h3>
              <p style="margin:.2rem 0"><strong>Qty:</strong> ${d.quantity} plates</p>
              <p style="margin:.2rem 0"><strong>Where:</strong> ${d.address}</p>
              <p style="margin:.2rem 0"><strong>Until:</strong> ${new Date(d.expiry).toLocaleString()}</p>
              <button onclick="acceptPickup('${id}')"
                style="background:#16a34a;color:white;border:none;
                       padding:.4rem .8rem;border-radius:6px;
                       cursor:pointer;margin-top:.5rem;width:100%">
                ✅ Accept Pickup
              </button>
            </div>`
        });
        marker.addListener("click", () => infoWindow.open(map, marker));
      }

      // Add listing card
      if (listingsDiv) {
        listingsDiv.innerHTML += `
          <div class="listing-card">
            <h3>${d.foodName} — ${d.quantity} plates</h3>
            <p>📍 ${d.address}, ${d.city}</p>
            <p>⏰ Until: ${new Date(d.expiry).toLocaleString()}</p>
            ${d.notes ? `<p>📝 ${d.notes}</p>` : ""}
            <button onclick="acceptPickup('${id}')"
              style="background:#16a34a;width:auto;padding:.4rem 1rem;
                     font-size:13px;margin-top:.5rem;">
              ✅ Accept Pickup
            </button>
          </div>`;
      }
    });
  });
}

// ── ACCEPT PICKUP ────────────────────────────────────────
async function acceptPickup(listingId) {
  if (!currentUserId) { alert("Please log in first."); return; }
  if (!confirm("Accept this food pickup?")) return;

  try {
    await updateDoc(doc(db, "foodListings", listingId), {
      status:      "accepted",
      volunteerId: currentUserId,
      acceptedAt:  new Date().toISOString()
    });
    alert("Pickup accepted! Go collect the food. 🚴");
  } catch (error) {
    alert("Error: " + error.message);
  }
}
window.acceptPickup = acceptPickup;

// ── MARK AS COLLECTED ────────────────────────────────────
async function markCollected(listingId) {
  if (!confirm("Mark this food as collected and delivered?")) return;
  await updateDoc(doc(db, "foodListings", listingId), {
    status:      "collected",
    collectedAt: new Date().toISOString()
  });
  alert("Great work! Marked as collected. 🎉");
}
window.markCollected = markCollected;

// ── MY ACCEPTED PICKUPS ──────────────────────────────────
function loadMyPickups() {
  if (!currentUserId) return;

  const q = query(
    collection(db, "foodListings"),
    where("volunteerId", "==", currentUserId),
    where("status", "==", "accepted")
  );

  onSnapshot(q, (snapshot) => {
    let pickupsDiv = document.getElementById("my-pickups");
    if (!pickupsDiv) {
      pickupsDiv = document.createElement("div");
      pickupsDiv.id = "my-pickups";
      pickupsDiv.className = "card";
      const container = document.querySelector(".dashboard-container");
      if (container) container.appendChild(pickupsDiv);
    }

    let html = "<h2>My Active Pickups 🚴</h2>";
    if (snapshot.empty) {
      html += "<p style='color:#888'>No active pickups. Accept one from the map above.</p>";
    } else {
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        html += `
          <div class="listing-card" style="border-color:orange">
            <h3>${d.foodName} — ${d.quantity} plates</h3>
            <p>📍 ${d.address}, ${d.city}</p>
            <button onclick="markCollected('${docSnap.id}')"
              style="background:orange;width:auto;
                     padding:.4rem 1rem;font-size:13px;margin-top:.5rem;">
              📦 Mark as Collected
            </button>
          </div>`;
      });
    }
    pickupsDiv.innerHTML = html;
  });
}
