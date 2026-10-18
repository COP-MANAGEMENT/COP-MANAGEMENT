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
  query,
  where,
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
    await afficherAffectationsAdmin();
    await afficherHorairesAdmin();
    await afficherRapportsAdmin();

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

    // Charger la fiche employé liée au compte connecté.
    const employeeProfile = userData.employeeId
      ? await getDoc(doc(db, "employees", userData.employeeId))
      : null;

    if (employeeProfile && employeeProfile.exists()) {
      const employee = employeeProfile.data();
      const fullName = [employee.nom, employee.postnom, employee.prenom]
        .filter(Boolean).join(" ");

      document.querySelector("#employeeDashboardName").textContent =
        fullName || "Non renseigné";
      document.querySelector("#employeeDashboardFunction").textContent =
        employee.fonction || "Non renseignée";
      document.querySelector("#employeeDashboardPhone").textContent =
        employee.telephone || "Non renseigné";
      document.querySelector("#employeeDashboardSite").textContent =
        employee.siteTravail || "Non renseigné";
      document.querySelector("#employeeDashboardStatus").textContent =
        employee.statut || "Non renseigné";

      const photo = document.querySelector("#employeeDashboardPhoto");
      if (employee.photoUrl) {
        photo.src = employee.photoUrl;
        photo.hidden = false;
        photo.onerror = () => { photo.hidden = true; };
      } else {
        photo.removeAttribute("src");
        photo.hidden = true;
      }
    } else {
      document.querySelector("#employeeDashboardName").textContent =
        "Fiche employé non accessible";
    }

    await afficherAffectationsEmploye(result.user.uid);
    await afficherHorairesEmploye(result.user.uid);
    await afficherRapportsEmploye(result.user.uid);

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
      const siteTravail = document.querySelector("#employeeSite").value.trim();
      const photoUrl = document.querySelector("#employeePhotoUrl").value.trim();

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
          siteTravail,
          photoUrl,
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


// RETROUVER UN EMPLOYE PAR SON MATRICULE
// Secours : si employeeUid manque dans employees, retrouver le compte
// connecté à partir de son profil users/{uid}.
async function trouverEmployeParMatricule(matricule) {
  const employeesSnapshot = await getDocs(collection(db, "employees"));
  let employee = null;

  employeesSnapshot.forEach((employeeDoc) => {
    const data = employeeDoc.data();
    if (String(data.matricule || "").trim().toUpperCase() === matricule) {
      employee = { id: employeeDoc.id, ...data };
    }
  });

  if (!employee) return null;
  if (employee.employeeUid) return employee;

  const usersSnapshot = await getDocs(collection(db, "users"));
  let linkedUser = null;

  usersSnapshot.forEach((userDoc) => {
    const data = userDoc.data();
    if (
      String(data.matricule || "").trim().toUpperCase() === matricule &&
      String(data.role || "").trim().toLowerCase() === "employee"
    ) {
      linkedUser = { uid: userDoc.id, ...data };
    }
  });

  if (!linkedUser) return employee;

  return {
    ...employee,
    employeeUid: linkedUser.uid,
    employeeId: linkedUser.employeeId || employee.id
  };
}


// MODULE AFFECTATIONS : ENREGISTREMENT ET CONSULTATION
const assignmentForm = document.querySelector("#assignmentForm");

if (assignmentForm) {
  assignmentForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = assignmentForm.querySelector('button[type="submit"]');
    const message = document.querySelector("#assignmentMessage");
    button.disabled = true;
    message.textContent = "Enregistrement en cours...";

    try {
      await verifierAdministrateur();
      const site = document.querySelector("#assignmentSite").value.trim();
      const adresse = document.querySelector("#assignmentAddress").value.trim();
      const matricule = document.querySelector("#assignmentMatricule").value.trim().toUpperCase();
      const poste = document.querySelector("#assignmentPosition").value.trim();
      const dateAffectation = document.querySelector("#assignmentDate").value;
      const consignes = document.querySelector("#assignmentInstructions").value.trim();

      if (!/^COP\d{4}$/.test(matricule)) {
        throw new Error("Matricule invalide. Exemple : COP0001.");
      }

      const employee = await trouverEmployeParMatricule(matricule);

      if (!employee || !employee.employeeUid) {
        throw new Error("Aucun compte employé actif ne correspond à ce matricule.");
      }

      await addDoc(collection(db, "assignments"), {
        site,
        adresse,
        matricule,
        poste,
        dateAffectation,
        consignes,
        employeeUid: employee.employeeUid,
        employeeId: employee.id,
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser.uid
      });

      assignmentForm.reset();
      message.textContent = "Affectation enregistrée. Elle est maintenant disponible dans l'espace de l'employé.";
      await afficherAffectationsAdmin();
    } catch (error) {
      console.error("Erreur affectation :", error);
      message.textContent = "Enregistrement impossible : " + (error.message || error.code);
    } finally {
      button.disabled = false;
    }
  });
}

function creerCarteAffectation(affectation) {
  const card = document.createElement("article");
  card.className = "person";
  const title = document.createElement("strong");
  title.textContent = (affectation.matricule || "") + " — " + (affectation.site || "Site non précisé");
  const details = document.createElement("p");
  details.textContent = "Adresse : " + (affectation.adresse || "—") +
    " | Poste : " + (affectation.poste || "—") +
    " | Date : " + (affectation.dateAffectation || "—");
  card.append(title, details);
  if (affectation.consignes) {
    const note = document.createElement("p");
    note.textContent = "Consignes : " + affectation.consignes;
    card.appendChild(note);
  }
  return card;
}

async function afficherAffectationsAdmin() {
  const message = document.querySelector("#assignmentListMessage");
  const items = document.querySelector("#assignmentItems");
  if (!message || !items || !auth.currentUser) return;
  message.textContent = "Chargement des affectations...";
  items.replaceChildren();
  try {
    await verifierAdministrateur();
    const snapshot = await getDocs(collection(db, "assignments"));
    if (snapshot.empty) {
      message.textContent = "Aucune affectation enregistrée pour le moment.";
      return;
    }
    const records = [];
    snapshot.forEach((item) => records.push(item.data()));
    records.sort((a, b) => String(b.dateAffectation || "").localeCompare(String(a.dateAffectation || "")));
    records.forEach((record) => items.appendChild(creerCarteAffectation(record)));
    message.textContent = records.length + " affectation(s) enregistrée(s).";
  } catch (error) {
    console.error("Erreur lecture affectations admin :", error);
    message.textContent = "Chargement impossible : " + error.code;
  }
}

async function afficherAffectationsEmploye(uid) {
  const message = document.querySelector("#employeeAssignmentMessage");
  const items = document.querySelector("#employeeAssignmentItems");
  if (!message || !items) return;
  message.textContent = "Chargement de vos affectations...";
  items.replaceChildren();
  try {
    const q = query(collection(db, "assignments"), where("employeeUid", "==", uid));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      message.textContent = "Aucune affectation ne vous a encore été attribuée.";
      return;
    }
    const records = [];
    snapshot.forEach((item) => records.push(item.data()));
    records.sort((a, b) => String(b.dateAffectation || "").localeCompare(String(a.dateAffectation || "")));
    records.forEach((record) => items.appendChild(creerCarteAffectation(record)));
    message.textContent = records.length + " affectation(s) disponible(s).";
  } catch (error) {
    console.error("Erreur lecture affectations employé :", error);
    message.textContent = "Impossible de charger vos affectations : " + error.code;
  }
}


// MODULE HORAIRES : ENREGISTREMENT ET CONSULTATION
const scheduleForm = document.querySelector("#scheduleForm");

function creerCarteHoraire(horaire) {
  const card = document.createElement("article");
  card.className = "person";
  const title = document.createElement("strong");
  title.textContent = (horaire.dateService || "Date non précisée") +
    " — " + (horaire.matricule || "") + " — " + (horaire.site || "Site non précisé");
  const details = document.createElement("p");
  if (Array.isArray(horaire.jours)) {
    details.textContent = "Planning hebdomadaire :";
    const table = document.createElement("table");
    const body = document.createElement("tbody");
    horaire.jours.forEach(item => {
      const row = document.createElement("tr");
      const day = document.createElement("td");
      const status = document.createElement("td");
      day.textContent = item.jour;
      status.textContent = item.statut;
      row.append(day, status);
      body.appendChild(row);
    });
    table.appendChild(body);
    card.append(title, details, table);
  } else {
    details.textContent = "Service : " + (horaire.typeService || "—") +
      (horaire.heureDebut || horaire.heureFin ? " | De " + (horaire.heureDebut || "—") + " à " + (horaire.heureFin || "—") : "");
    card.append(title, details);
  }
  if (horaire.consignes) {
    const note = document.createElement("p");
    note.textContent = "Consignes : " + horaire.consignes;
    card.appendChild(note);
  }
  return card;
}

if (scheduleForm) {
  scheduleForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = scheduleForm.querySelector('button[type="submit"]');
    const message = document.querySelector("#scheduleMessage");
    button.disabled = true;
    message.textContent = "Enregistrement en cours...";
    try {
      await verifierAdministrateur();
      const matricule = document.querySelector("#scheduleMatricule").value.trim().toUpperCase();
      const dateService = document.querySelector("#scheduleWeekStart").value;
      const site = document.querySelector("#scheduleSite").value.trim();
      const consignes = document.querySelector("#scheduleInstructions").value.trim();
      const choixJours = [...document.querySelectorAll(".schedule-day-choice")]
        .map(select => ({ jour: select.dataset.day, statut: select.value }))
        .filter(item => item.statut);

      if (!/^COP\\d{4}$/.test(matricule)) {
        throw new Error("Matricule invalide. Exemple : COP0001.");
      }
      if (!dateService) throw new Error("Choisissez la date du lundi de la semaine.");
      if (!choixJours.length) throw new Error("Choisissez au moins un horaire ou statut dans le tableau.");
      if (choixJours.some(item => ["Jour", "Nuit", "24h", "48h"].includes(item.statut)) && !site) {
        throw new Error("Indiquez le site de service pour les jours travaillés.");
      }

      const employee = await trouverEmployeParMatricule(matricule);
      if (!employee || !employee.employeeUid) {
        throw new Error("Aucun compte employé ne correspond à ce matricule.");
      }

      await addDoc(collection(db, "schedules"), {
        matricule,
        dateService,
        typeService: "Planning hebdomadaire",
        jours: choixJours,
        site,
        consignes,
        employeeUid: employee.employeeUid,
        employeeId: employee.id,
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser.uid
      });
      scheduleForm.reset();
      message.textContent = "Planning hebdomadaire enregistré. Il est visible dans l'espace de l'employé.";
      await afficherHorairesAdmin();
    } catch (error) {
      console.error("Erreur horaire :", error);
      message.textContent = "Enregistrement impossible : " + (error.message || error.code);
    } finally {
      button.disabled = false;
    }
  });
}

async function afficherHorairesAdmin() {
  const message = document.querySelector("#scheduleListMessage");
  const items = document.querySelector("#scheduleItems");
  if (!message || !items || !auth.currentUser) return;
  message.textContent = "Chargement des horaires...";
  items.replaceChildren();
  try {
    await verifierAdministrateur();
    const snapshot = await getDocs(collection(db, "schedules"));
    if (snapshot.empty) {
      message.textContent = "Aucun horaire enregistré pour le moment.";
      return;
    }
    const records = [];
    snapshot.forEach(item => records.push(item.data()));
    records.sort((a, b) => String(a.dateService || "").localeCompare(String(b.dateService || "")));
    records.forEach(record => items.appendChild(creerCarteHoraire(record)));
    message.textContent = records.length + " horaire(s) enregistré(s).";
  } catch (error) {
    console.error("Erreur lecture horaires gérant :", error);
    message.textContent = "Chargement impossible : " + error.code;
  }
}

async function afficherHorairesEmploye(uid) {
  const message = document.querySelector("#employeeScheduleMessage");
  const items = document.querySelector("#employeeScheduleItems");
  if (!message || !items) return;
  message.textContent = "Chargement de vos horaires...";
  items.replaceChildren();
  try {
    const q = query(collection(db, "schedules"), where("employeeUid", "==", uid));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      message.textContent = "Aucun horaire ne vous a encore été attribué.";
      return;
    }
    const records = [];
    snapshot.forEach(item => records.push(item.data()));
    records.sort((a, b) => String(a.dateService || "").localeCompare(String(b.dateService || "")));
    records.forEach(record => items.appendChild(creerCarteHoraire(record)));
    message.textContent = records.length + " horaire(s) disponible(s).";
  } catch (error) {
    console.error("Erreur lecture horaires employé :", error);
    message.textContent = "Impossible de charger vos horaires : " + error.code;
  }
}


// MODULE RAPPORTS : ENVOI PAR L'EMPLOYE ET CONSULTATION PAR LE GERANT
function creerCarteRapport(rapport) {
  const card = document.createElement("article");
  card.className = "person";
  const title = document.createElement("strong");
  title.textContent = (rapport.matricule || "") + " — " +
    (rapport.site || "Site non précisé") + " — " + (rapport.dateRapport || "");
  const details = document.createElement("p");
  details.textContent = "Agent : " + (rapport.nomEmploye || "Non renseigné");
  const description = document.createElement("p");
  description.textContent = rapport.description || "";
  card.append(title, details, description);
  return card;
}

const employeeReportForm = document.querySelector("#employeeReportForm");

if (employeeReportForm) {
  employeeReportForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = employeeReportForm.querySelector('button[type="submit"]');
    const message = document.querySelector("#employeeReportMessage");
    button.disabled = true;
    message.textContent = "Envoi du rapport en cours...";
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Votre session a expiré. Reconnectez-vous.");

      const profileSnapshot = await getDoc(doc(db, "users", currentUser.uid));
      if (!profileSnapshot.exists()) throw new Error("Profil employé introuvable.");
      const profile = profileSnapshot.data();
      if (String(profile.role || "").trim().toLowerCase() !== "employee") {
        throw new Error("Seul un compte employé peut envoyer un rapport ici.");
      }

      const matricule = String(profile.matricule || "").trim().toUpperCase();
      const site = document.querySelector("#employeeReportSite").value.trim();
      const dateRapport = document.querySelector("#employeeReportDate").value;
      const description = document.querySelector("#employeeReportDescription").value.trim();
      if (!site || !dateRapport || description.length < 10) {
        throw new Error("Complétez tous les champs. Le compte rendu doit contenir au moins 10 caractères.");
      }

      let nomEmploye = "";
      if (profile.employeeId) {
        const employeeSnapshot = await getDoc(doc(db, "employees", profile.employeeId));
        if (employeeSnapshot.exists()) {
          const employee = employeeSnapshot.data();
          nomEmploye = [employee.nom, employee.postnom, employee.prenom].filter(Boolean).join(" ");
        }
      }

      await addDoc(collection(db, "reports"), {
        matricule,
        site,
        dateRapport,
        description,
        nomEmploye,
        employeeUid: currentUser.uid,
        employeeId: profile.employeeId || "",
        createdAt: serverTimestamp()
      });

      employeeReportForm.reset();
      message.textContent = "Rapport envoyé avec succès au gérant.";
      await afficherRapportsEmploye(currentUser.uid);
    } catch (error) {
      console.error("Erreur envoi rapport :", error);
      message.textContent = "Envoi impossible : " + (error.message || error.code);
    } finally {
      button.disabled = false;
    }
  });
}

async function afficherRapportsAdmin() {
  const message = document.querySelector("#reportAdminMessage");
  const items = document.querySelector("#reportAdminItems");
  if (!message || !items || !auth.currentUser) return;
  message.textContent = "Chargement des rapports...";
  items.replaceChildren();
  try {
    await verifierAdministrateur();
    const snapshot = await getDocs(collection(db, "reports"));
    if (snapshot.empty) {
      message.textContent = "Aucun rapport reçu pour le moment.";
      return;
    }
    const records = [];
    snapshot.forEach(item => records.push(item.data()));
    records.sort((a, b) => {
      const dateA = a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0;
      const dateB = b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0;
      return dateB - dateA;
    });
    records.forEach(record => items.appendChild(creerCarteRapport(record)));
    message.textContent = records.length + " rapport(s) reçu(s).";
  } catch (error) {
    console.error("Erreur lecture rapports gérant :", error);
    message.textContent = "Chargement impossible : " + (error.message || error.code);
  }
}

async function afficherRapportsEmploye(uid) {
  const message = document.querySelector("#employeeReportMessage");
  const items = document.querySelector("#employeeReportItems");
  if (!message || !items) return;
  message.textContent = "Chargement de vos rapports...";
  items.replaceChildren();
  try {
    const q = query(collection(db, "reports"), where("employeeUid", "==", uid));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      message.textContent = "Vous n'avez encore envoyé aucun rapport.";
      return;
    }
    const records = [];
    snapshot.forEach(item => records.push(item.data()));
    records.sort((a, b) => String(b.dateRapport || "").localeCompare(String(a.dateRapport || "")));
    records.forEach(record => items.appendChild(creerCarteRapport(record)));
    message.textContent = records.length + " rapport(s) envoyé(s).";
  } catch (error) {
    console.error("Erreur lecture rapports employé :", error);
    message.textContent = "Impossible de charger vos rapports : " + (error.message || error.code);
  }
}


// SERVICE WORKER
if ("serviceWorker" in navigator) {

  window.addEventListener("load", () => {

    navigator.serviceWorker.register("./sw.js")
      .catch(error => {
        console.error("Erreur Service Worker :", error);
      });

  });

}
