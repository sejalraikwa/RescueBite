// ✅ FIXED — removed the circular self-import that was breaking everything
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth }       from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore }  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "AIzaSyAoeO9shwyTPeaiueZYAC9NBijaoCL8L0A",
  authDomain:        "rescuebite-62aad.firebaseapp.com",
  projectId:         "rescuebite-62aad",
  storageBucket:     "rescuebite-62aad.firebasestorage.app",
  messagingSenderId: "462394806163",
  appId:             "1:462394806163:web:d226e9a5df987886162266"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db   = getFirestore(app);
