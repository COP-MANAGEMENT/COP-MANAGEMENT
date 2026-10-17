// ============================================
// COP MANAGEMENT
// CONGO ONE SERVICES SARL
// ============================================

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
  getDoc,
  collection,
  addDoc,
  getDocs,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";


// ============================================
// CONFIGURATION FIREBASE
// ============================================

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


// ============================================
// CONNEXION DU GERANT
// ============================================

document.querySelector("#adminLoginForm").addEventListener("submit", async (e) => {

  e.preventDefault();

  const message = document.querySelector("#adminMessage");

  const email = document.querySelector("#adminEmail").value.trim();

  const password = document.querySelector("#adminPassword").value;

  message.textContent = "Connexion en cours...";

  try {

    const result = await signInWithEmailAndPassword(auth, email, password);

    const userDoc = await getDoc(doc(db, "users", result.user.uid));

    if (!userDoc.exists()) {
      await signOut(auth);
      message.textContent = "Profil administrateur introuvable.";
      return;
    }

    const role = String(userDoc.data().role || "").trim().toLowerCase();

    if (role !== "admin") {
      await signOut(auth);
      message.textContent = "Accès refusé : compte non administrateur.";
      return;
    }

    document.querySelector("#accueil").hidden = true;
    document.querySelector("#connexion-gerant").hidden = true;
    document.querySelector("#connexion-employe").hidden = true;
    document.querySelector("#adminDashboard").hidden = false;

    message.textContent = "Connexion réussie. Bienvenue dans votre espace gérant !";

    await afficherPersonnel();

  } catch (error) {

    console.error("Erreur administrateur :", error);

    message.textContent = "Erreur Firebase : " + error.code;

  }

});


// ============================================
// CONNEXION DE L'EMPLOYE
// ============================================

document.querySelector("#employeeLoginForm").addEventListener("submit", async (e) => {

  e.preventDefault();

  const message = document.querySelector("#employeeMessage");

  const matricule = document.querySelector("#employeeMatricule").value.trim().toUpperCase();

  const password = document.querySelector("#employeePassword").value;

  if (!/^COP\d{4}$/.test(matricule)) {

    message.textContent = "Matricule invalide. Exemple : COP0001";

    return;

  }

  const emailTechnique = matricule.toLowerCase() + "@cop-management.app";

  try {

    message.textContent = "Connexion en cours...";

    const result = await signInWithEmailAndPassword(auth, emailTechnique, password);

    const userDoc = await getDoc(doc(db, "users", result.user.uid));

    if (!userDoc.exists()) {

      await signOut(auth);

      message.textContent = "Profil employé introuvable.";

      return;

    }

    const userData = userDoc.data();

    const role = String(userData.role || "").trim().toLowerCase();

    const matriculeEnregistre = String(userData.matricule || "").trim().toUpperCase();

    if (role !== "employee" || matriculeEnregistre !== matricule) {

      await signOut(auth);

      message.textContent = "Accès refusé : matricule ou profil non reconnu.";

      return;

    }

    message.textContent = "Connexion réussie. Bienvenue dans COP MANAGEMENT !";

  } catch (error) {

    console.error("Erreur employé :", error);

    if (
      error.code === "auth/invalid-credential" ||
      error.code === "auth/user-not-found" ||
      error.code === "auth/wrong-password"
    ) {

      message.textContent = "Matricule ou mot de passe incorrect.";

    } else {

      message.textContent = "Erreur Firebase : " + error.code;

    }

  }

});


// ============================================
// MODULE PERSONNEL
// ============================================

const employeeForm = document.querySelector("#employeeForm");


// Ajouter le bouton d'enregistrement
// si celui-ci n'existe pas encore.

if (employeeForm && !employeeForm.querySelector('button[type="submit"]')) {

  const saveButton = document.createElement("button");

  saveButton.type = "submit";

  saveButton.textContent = "Enregistrer l'employé";

  employeeForm.appendChild(saveButton);

}


// Créer la zone de liste du personnel.

const personnelSection = document.querySelector("#module-personnel");

let personnelList = document.querySelector("#personnelList");

if (personnelSection && !personnelList) {

  personnelList = document.createElement("div");

  personnelList.id = "personnelList";

  personnelList.className = "card";

  personnelList.innerHTML = `
    <h2>Liste du personnel</h2>
    <p id="personnelMessage">Chargement des employés...</p>
    <div id="personnelItems"></div>
  `;

  personnelSection.appendChild(personnelList);

}


// Générer le prochain matricule.

async function genererMatricule() {

  const snapshot = await getDocs(collection(db, "employees"));

  let numeroMaximum = 0;

  snapshot.forEach((document) => {

    const matricule = document.data().matricule || "";

    const correspondance = matricule.match(/^COP(\d{4})$/);

    if (correspondance) {

      const numero = Number(correspondance[1]);

      if (numero > numeroMaximum) {
        numeroMaximum = numero;
      }

    }

  });

  const prochainNumero = numeroMaximum + 1;

  if (prochainNumero > 9999) {

    throw new Error("La limite des matricules COP est atteinte.");

  }

  return "COP" + String(prochainNumero).padStart(4, "0");

}


// Enregistrer un nouvel employé.

if (employeeForm) {

  employeeForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    if (!auth.currentUser) {

      alert("Veuillez vous connecter comme gérant.");

      return;

    }

    const button = employeeForm.querySelector('button[type="submit"]');

    button.disabled = true;

    button.textContent = "Enregistrement en cours...";

    try {

      const nom = document.querySelector("#employeeNom").value.trim();

      const postnom = document.querySelector("#employeePostnom").value.trim();

      const prenom = document.querySelector("#employeePrenom").value.trim();

      const sexe = document.querySelector("#employeeSexe").value;

      const naissance = document.querySelector("#employeeNaissance").value;

      const telephone = document.querySelector("#employeeTelephone").value.trim();

      const adresse = document.querySelector("#employeeAdresse").value.trim();

      const email = document.querySelector("#employeeEmail").value.trim();

      const fonction = document.querySelector("#employeeFonction").value.trim();

      const engagement = document.querySelector("#employeeEngagement").value;

      const contrat = document.querySelector("#employeeContrat").value;

      const statut = document.querySelector("#employeeStatut").value;

      if (!nom || !postnom || !prenom || !telephone || !fonction) {

        alert("Veuillez remplir le nom, le postnom, le prénom, le téléphone et la fonction.");

        return;

      }

      // Génération automatique du matricule.

      const matricule = await genererMatricule();

      // Création du dossier dans Firestore.

      await addDoc(collection(db, "employees"), {

        matricule: matricule,

        nom: nom,

        postnom: postnom,

        prenom: prenom,

        sexe: sexe,

        dateNaissance: naissance,

        telephone: telephone,

        adresse: adresse,

        email: email,

        fonction: fonction,

        dateEngagement: engagement,

        typeContrat: contrat,

        statut: statut,

        employeeUid: null,

        createdAt: serverTimestamp(),

        createdBy: auth.currentUser.uid

      });

      alert("Employé enregistré avec succès ! Matricule : " + matricule);

      employeeForm.reset();

      await afficherPersonnel();

    } catch (error) {

      console.error("Erreur d'enregistrement :", error);

      alert("Impossible d'enregistrer l'employé : " + error.message);

    } finally {

      button.disabled = false;

      button.textContent = "Enregistrer l'employé";

    }

  });

}


// Afficher la liste du personnel.

async function afficherPersonnel() {

  const message = document.querySelector("#personnelMessage");

  const items = document.querySelector("#personnelItems");

  if (!message || !items) return;

  if (!auth.currentUser) return;

  message.textContent = "Chargement des employés...";

  items.innerHTML = "";

  try {

    const snapshot = await getDocs(collection(db, "employees"));

    if (snapshot.empty) {

      message.textContent = "Aucun employé enregistré pour le moment.";

      return;

    }

    const employes = [];

    snapshot.forEach((document) => {

      employes.push({
        id: document.id,
        ...document.data()
      });

    });

    employes.sort((a, b) => {

      return String(a.matricule || "").localeCompare(String(b.matricule || ""));

    });

    message.textContent = employes.length + " employé(s) enregistré(s).";

    employes.forEach((employe) => {

      const ligne = document.createElement("div");

      ligne.className = "person";

      const nomComplet = [
        employe.nom,
        employe.postnom,
        employe.prenom
      ].filter(Boolean).join(" ");

      const titre = document.createElement("strong");

      titre.textContent = employe.matricule + " - " + nomComplet;

      const details = document.createElement("p");

      details.textContent =
        "Fonction : " + (employe.fonction || "Non précisée") +
        " | Téléphone : " + (employe.telephone || "Non précisé") +
        " | Statut : " + (employe.statut || "Non précisé");

      ligne.appendChild(titre);

      ligne.appendChild(details);

      items.appendChild(ligne);

    });

  } catch (error) {

    console.error("Erreur de lecture du personnel :", error);

    message.textContent = "Erreur de chargement : " + error.code;

  }

}


// ============================================
// DECONNEXION DU GERANT
// ============================================

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


// ============================================
// APPLICATION HORS CONNEXION
// ============================================

if ("serviceWorker" in navigator) {

  window.addEventListener("load", () => {

    navigator.serviceWorker.register("./sw.js").catch(console.error);

  });

}
