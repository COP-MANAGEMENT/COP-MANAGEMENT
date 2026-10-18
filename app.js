import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  deleteUser,
  signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  setDoc,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";


// CONFIGURATION FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyDzmREE5X1wIOLkUBTJLnfFLBThFfrBhSU",
  authDomain: "cop-management.firebaseapp.com",
  projectId: "cop-management",
  storageBucket: "cop-management.firebasestorage.app",
  messagingSenderId: "602152027077",
  appId: "1:602152027077:web:2631e9e9eb9fb4feb381ac",
  measurementId: "G-9M2GHRC9V6"
};


// APPLICATION PRINCIPALE
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// APPLICATION SECONDAIRE POUR CREER LES COMPTES EMPLOYES
// Elle permet de ne pas déconnecter le gérant pendant la création.
const employeeApp = initializeApp(firebaseConfig, "EmployeeCreation");
const employeeAuth = getAuth(employeeApp);


// AFFICHAGE DES ESPACES
function masquerEspaces() {
  const sections = [
    "accueil",
    "connexion-gerant",
    "connexion-employe",
    "adminDashboard",
    "employeeDashboard"
  ];

  sections.forEach(id => {
    const element = document.getElementById(id);
    if (element) element.hidden = true;
  });
}


// VERIFICATION DU COMPTE GERANT
async function verifierAdministrateur() {
  if (!auth.currentUser) {
    throw new Error("Veuillez vous connecter comme gérant.");
  }

  const profil = await getDoc(
    doc(db, "users", auth.currentUser.uid)
  );

  if (
    !profil.exists() ||
    String(profil.data().role || "").toLowerCase() !== "admin"
  ) {
    throw new Error("Accès refusé : compte administrateur requis.");
  }

  return true;
}


// CONNEXION GERANT
document.querySelector("#adminLoginForm").addEventListener("submit", async (e) => {
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
      message.textContent =
        "Accès refusé : compte non administrateur.";
      return;
    }

    masquerEspaces();

    document.querySelector("#adminDashboard").hidden = false;

    message.textContent =
      "Connexion réussie. Bienvenue dans votre espace gérant !";

    await afficherPersonnel();

  } catch (error) {
    console.error("Erreur administrateur :", error);
    message.textContent = "Erreur Firebase : " + error.code;
  }
});


// CONNEXION EMPLOYE
document.querySelector("#employeeLoginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const message = document.querySelector("#employeeMessage");

  const matricule = document
    .querySelector("#employeeMatricule")
    .value.trim()
    .toUpperCase();

  const password = document.querySelector("#employeePassword").value;

  if (!/^COP\d{4}$/.test(matricule)) {
    message.textContent =
      "Matricule invalide. Exemple : COP0001";
    return;
  }

  const emailTechnique =
    matricule.toLowerCase() + "@cop-management.app";

  message.textContent = "Connexion en cours...";

  try {
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

    const matriculeEnregistre = String(userData.matricule || "")
      .trim()
      .toUpperCase();

    if (
      role !== "employee" ||
      matriculeEnregistre !== matricule
    ) {
      await signOut(auth);
      message.textContent =
        "Accès refusé : matricule ou profil non reconnu.";
      return;
    }

    masquerEspaces();

    document.querySelector("#employeeDashboard").hidden = false;

    document.querySelector("#employeeDashboardMatricule").textContent =
      matriculeEnregistre;

    document.querySelector("#employeeDashboardEmail").textContent =
      userData.email || "Non renseigné";

    message.textContent =
      "Connexion réussie. Bienvenue dans COP MANAGEMENT !";

  } catch (error) {
    console.error("Erreur employé :", error);

    if (error.code === "auth/invalid-credential") {
      message.textContent =
        "Matricule ou mot de passe incorrect.";
    } else {
      message.textContent =
        "Erreur Firebase : " + error.code;
    }
  }
});


// FORMULAIRE DU PERSONNEL
const employeeForm = document.querySelector("#employeeForm");


// AJOUT AUTOMATIQUE DU BOUTON
if (
  employeeForm &&
  !employeeForm.querySelector('button[type="submit"]')
) {
  const saveButton = document.createElement("button");

  saveButton.type = "submit";
  saveButton.textContent = "Enregistrer l'employé";

  employeeForm.appendChild(saveButton);
}


// GENERATION AUTOMATIQUE DU MATRICULE
async function genererMatricule() {
  const snapshot = await getDocs(
    collection(db, "employees")
  );

  let numeroMaximum = 0;

  snapshot.forEach(document => {
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


// ENREGISTREMENT COMPLET D'UN EMPLOYE
if (employeeForm) {

  employeeForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const button = employeeForm.querySelector(
      'button[type="submit"]'
    );

    button.disabled = true;
    button.textContent = "Création du compte en cours...";

    let nouvelUtilisateur = null;
    let nouvelEmploye = null;

    try {

      // VERIFIER QUE LE GERANT EST CONNECTE
      await verifierAdministrateur();

      // RECUPERER LES INFORMATIONS
      const nom = document.querySelector("#employeeNom").value.trim();
      const postnom = document.querySelector("#employeePostnom").value.trim();
      const prenom = document.querySelector("#employeePrenom").value.trim();
      const sexe = document.querySelector("#employeeSexe").value;
      const naissance = document.querySelector("#employeeNaissance").value;
      const telephone = document.querySelector("#employeeTelephone").value.trim();
      const adresse = document.querySelector("#employeeAdresse").value.trim();
      const email = document.querySelector("#employeeEmail").value.trim();
      const motDePasse = document.querySelector("#employeeInitialPassword").value;
      const fonction = document.querySelector("#employeeFonction").value.trim();
      const engagement = document.querySelector("#employeeEngagement").value;
      const contrat = document.querySelector("#employeeContrat").value;
      const statut = document.querySelector("#employeeStatut").value;

      if (
        !nom ||
        !postnom ||
        !prenom ||
        !telephone ||
        !fonction
      ) {
        throw new Error(
          "Veuillez remplir le nom, le postnom, le prénom, le téléphone et la fonction."
        );
      }

      if (motDePasse.length < 6) {
        throw new Error(
          "Le mot de passe doit contenir au moins 6 caractères."
        );
      }

      // GENERER LE MATRICULE
      const matricule = await genererMatricule();

      // EMAIL TECHNIQUE POUR LA CONNEXION
      const emailTechnique =
        matricule.toLowerCase() + "@cop-management.app";

      // CREER LE COMPTE FIREBASE DE L'EMPLOYE
      const resultatCompte = await createUserWithEmailAndPassword(
        employeeAuth,
        emailTechnique,
        motDePasse
      );

      nouvelUtilisateur = resultatCompte.user;

      // ENREGISTRER LA FICHE DU PERSONNEL
      nouvelEmploye = await addDoc(
        collection(db, "employees"),
        {
          matricule,
          nom,
          postnom,
          prenom,
          sexe,
          dateNaissance: naissance,
          telephone,
          adresse,
          email,
          fonction,
          dateEngagement: engagement,
          typeContrat: contrat,
          statut,
          employeeUid: nouvelUtilisateur.uid,
          createdAt: serverTimestamp(),
          createdBy: auth.currentUser.uid
        }
      );

      // CREER LE PROFIL EMPLOYE DANS FIRESTORE
      await setDoc(
        doc(db, "users", nouvelUtilisateur.uid),
        {
          role: "employee",
          matricule,
          email: email || "Non renseigné",
          loginEmail: emailTechnique,
          employeeId: nouvelEmploye.id,
          createdAt: serverTimestamp()
        }
      );

      // FERMER LA SESSION SECONDAIRE
      await signOut(employeeAuth);

      alert(
        "Employé enregistré avec succès !\n\n" +
        "Nom : " + nom + " " + postnom + " " + prenom +
        "\nMatricule : " + matricule +
        "\nIdentifiant de connexion : " + matricule +
        "\nMot de passe : celui que vous venez de définir."
      );

      employeeForm.reset();

      await afficherPersonnel();

    } catch (error) {

      console.error("Erreur de création de l'employé :", error);

      // ANNULER LES DONNEES SI LA CREATION A ECHOUE
      if (nouvelEmploye) {
        try {
          await deleteDoc(
            doc(db, "employees", nouvelEmploye.id)
          );
        } catch (rollbackError) {
          console.error("Erreur de nettoyage fiche :", rollbackError);
        }
      }

      if (nouvelUtilisateur) {
        try {
          await deleteUser(nouvelUtilisateur);
        } catch (rollbackError) {
          console.error("Erreur de suppression du compte :", rollbackError);
        }
      }

      alert(
        "Impossible de créer le compte employé.\n\n" +
        "Erreur : " + (error.message || error.code)
      );

    } finally {

      button.disabled = false;
      button.textContent = "Enregistrer l'employé";

    }
  });
}


// AFFICHER LE PERSONNEL
async function afficherPersonnel() {

  const message = document.querySelector("#personnelMessage");
  const items = document.querySelector("#personnelItems");

  if (!message || !items || !auth.currentUser) return;

  message.textContent = "Chargement des employés...";
  items.innerHTML = "";

  try {

    const snapshot = await getDocs(
      collection(db, "employees")
    );

    if (snapshot.empty) {
      message.textContent =
        "Aucun employé enregistré pour le moment.";
      return;
    }

    const employes = [];

    snapshot.forEach(document => {
      employes.push({
        id: document.id,
        ...document.data()
      });
    });

    employes.sort((a, b) =>
      String(a.matricule || "").localeCompare(
        String(b.matricule || "")
      )
    );

    message.textContent =
      employes.length + " employé(s) enregistré(s).";

    employes.forEach(employe => {

      const ligne = document.createElement("div");
      ligne.className = "person";

      const nomComplet = [
        employe.nom,
        employe.postnom,
        employe.prenom
      ].filter(Boolean).join(" ");

      const titre = document.createElement("strong");

      titre.textContent =
        employe.matricule + " - " + nomComplet;

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

    message.textContent =
      "Erreur de chargement : " + error.code;

  }
}


// DECONNEXION GERANT
window.deconnexionAdmin = async function () {

  try {

    await signOut(auth);

    masquerEspaces();

    document.querySelector("#accueil").hidden = false;

    document.querySelector("#adminEmail").value = "";
    document.querySelector("#adminPassword").value = "";

  } catch (error) {

    console.error("Erreur de déconnexion :", error);

    alert("Impossible de terminer la déconnexion.");

  }
};


// DECONNEXION EMPLOYE
window.deconnexionEmploye = async function () {

  try {

    await signOut(auth);

    masquerEspaces();

    document.querySelector("#accueil").hidden = false;

    document.querySelector("#employeeMatricule").value = "";
    document.querySelector("#employeePassword").value = "";

    document.querySelector("#employeeDashboardMatricule").textContent = "---";
    document.querySelector("#employeeDashboardEmail").textContent = "---";

  } catch (error) {

    console.error("Erreur de déconnexion employé :", error);

    alert("Impossible de terminer la déconnexion.");

  }
};


// SERVICE WORKER
if ("serviceWorker" in navigator) {

  window.addEventListener("load", () => {

    navigator.serviceWorker.register("./sw.js")
      .catch(error => {
        console.error("Erreur Service Worker :", error);
      });

  });

}
