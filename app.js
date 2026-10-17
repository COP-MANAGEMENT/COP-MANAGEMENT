import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// CONFIGURATION FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyDzmREE5X1wIOLkUBTJLnfFLBThFfrBhSU",
  authDomain: "cop-management.firebaseapp.com",
  projectId: "cop-management",
  storageBucket: "cop-management.firebasestorage.app",
  messagingSenderId: "602152027077",
  appId: "1:602152027077:web:2631e9e9eb9fb4feb381ac",
  measurementId: "G-9M2MGHRC9V"
};

// INITIALISATION
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// CONNEXION GÉRANT
document.querySelector("#adminLoginForm")
.addEventListener("submit", async (e) => {
  e.preventDefault();

  const message = document.querySelector("#adminMessage");
  const email = document.querySelector("#adminEmail").value.trim();
  const password = document.querySelector("#adminPassword").value;

  message.textContent = "Connexion en cours...";

  try {
    const result = await signInWithEmailAndPassword(auth, email, password);

    const userDoc = await getDoc(doc(db, "users", result.user.uid));

    if (!userDoc.exists() || userDoc.data().role !== "admin") {
      await signOut(auth);
      message.textContent = "Accès refusé : compte administrateur non autorisé.";
      return;
    }

    message.textContent = "Connexion réussie. Bienvenue dans votre espace gérant !";

  } catch (error) {
    message.textContent = "Erreur de connexion. Vérifiez votre adresse e-mail et votre mot de passe.";
    console.error(error);
  }
});

// CONNEXION EMPLOYÉ
document.querySelector("#employeeLoginForm")
.addEventListener("submit", async (e) => {
  e.preventDefault();

  const message = document.querySelector("#employeeMessage");
  const email = document.querySelector("#employeeEmail").value.trim();
  const password = document.querySelector("#employeePassword").value;

  message.textContent = "Connexion en cours...";

  try {
    const result = await signInWithEmailAndPassword(auth, email, password);

    const userDoc = await getDoc(doc(db, "users", result.user.uid));

    if (!userDoc.exists() || userDoc.data().role !== "employee") {
      await signOut(auth);
      message.textContent = "Accès refusé : compte employé non autorisé.";
      return;
    }

    message.textContent = "Connexion réussie. Bienvenue dans COP MANAGEMENT !";

  } catch (error) {
    message.textContent = "Erreur de connexion. Vérifiez vos identifiants.";
    console.error(error);
  }
});

// SERVICE WORKER
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(console.error);
  });
}
