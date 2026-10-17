import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

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

const firebaseConfig = {
  apiKey: "AIzaSyDzmREE5X1wIOLkUBTJLnfFLBThFfrBhSU",
  authDomain: "cop-management.firebaseapp.com",
  projectId: "cop-management",
  storageBucket: "cop-management.firebasestorage.app",
  messagingSenderId: "602152027077",
  appId: "1:602152027077:web:2631e9e9eb9fb4feb381ac",
  measurementId: "G-9M2MGHRC9V"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// =====================================
// CONNEXION DU GERANT
// =====================================

document.querySelector("#adminLoginForm")
.addEventListener("submit", async (e) => {

  e.preventDefault();

  const message = document.querySelector("#adminMessage");
  const email = document.querySelector("#adminEmail").value.trim();
  const password = document.querySelector("#adminPassword").value;

  message.textContent = "Connexion en cours...";

  try {

    const result = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    const userDoc = await getDoc(
      doc(db, "users", result.user.uid)
    );

    if (!userDoc.exists()) {
      await signOut(auth);
      message.textContent = "Profil administrateur introuvable.";
      return;
    }

    const role = String(userDoc.data().role || "")
      .trim()
      .toLowerCase();

    if (role !== "admin") {
      await signOut(auth);
      message.textContent = "Accès refusé : compte non administrateur.";
      return;
    }

    document.querySelector("#accueil").hidden = true;
    document.querySelector("#connexion-gerant").hidden = true;
    document.querySelector("#connexion-employe").hidden = true;
    document.querySelector("#adminDashboard").hidden = false;

    message.textContent =
      "Connexion réussie. Bienvenue dans votre espace gérant !";

  } catch (error) {

    console.error("Erreur administrateur :", error);
    message.textContent = "Erreur Firebase : " + error.code;

  }

});


// =====================================
// CONNEXION DES EMPLOYES PAR MATRICULE
// =====================================

document.querySelector("#employeeLoginForm")
.addEventListener("submit", async (e) => {

  e.preventDefault();

  const message = document.querySelector("#employeeMessage");

  const matricule = document
    .querySelector("#employeeMatricule")
    .value
    .trim()
    .toUpperCase();

  const password = document
    .querySelector("#employeePassword")
    .value;

  if (!/^COP\d{4}$/.test(matricule)) {
    message.textContent =
      "Matricule invalide. Exemple attendu : COP0001";
    return;
  }

  const emailTechnique =
    matricule.toLowerCase() + "@cop-management.app";

  try {

    message.textContent = "Connexion en cours...";

    const result = await signInWithEmailAndPassword(
      auth,
      emailTechnique,
      password
    );

    const userDoc = await getDoc(
      doc(db, "users", result.user.uid)
    );

    if (!userDoc.exists()) {
      await signOut(auth);
      message.textContent = "Profil employé introuvable.";
      return;
    }

    const userData = userDoc.data();

    const role = String(userData.role || "")
      .trim()
      .toLowerCase();

    const matriculeEnregistre = String(
      userData.matricule || ""
    ).trim().toUpperCase();

    if (
      role !== "employee" ||
      matriculeEnregistre !== matricule
    ) {
      await signOut(auth);
      message.textContent =
        "Accès refusé : matricule ou profil non reconnu.";
      return;
    }

    message.textContent =
      "Connexion réussie. Bienvenue dans COP MANAGEMENT !";

  } catch (error) {

    console.error("Erreur employé :", error);

    if (
      error.code === "auth/invalid-credential" ||
      error.code === "auth/user-not-found" ||
      error.code === "auth/wrong-password"
    ) {
      message.textContent =
        "Matricule ou mot de passe incorrect.";
    } else {
      message.textContent = "Erreur Firebase : " + error.code;
    }

  }

});


// =====================================
// DECONNEXION DU GERANT
// =====================================

window.deconnexionAdmin = async function () {

  try {

    await signOut(auth);

    document.querySelector("#adminDashboard").hidden = true;
    document.querySelector("#connexion-gerant").hidden = true;
    document.querySelector("#connexion-employe").hidden = true;
    document.querySelector("#accueil").hidden = false;

    document.querySelector("#adminEmail").value = "";
    document.querySelector("#adminPassword").value = "";

  } catch (error) {

    console.error("Erreur de déconnexion :", error);
    alert("Impossible de terminer la déconnexion.");

  }

};


// =====================================
// SERVICE WORKER
// =====================================

if ("serviceWorker" in navigator) {

  window.addEventListener("load", () => {

    navigator.serviceWorker
      .register("./sw.js")
      .catch(console.error);

  });

      }
