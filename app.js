<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#30363b">
  <link rel="manifest" href="manifest.webmanifest">
  <link rel="stylesheet" href="styles.css">
  <title>COP MANAGEMENT | CONGO ONE SERVICES</title>
</head>

<body>

<header>
  <div class="logo">COP</div>
  <div>
    <b>CONGO ONE SERVICES</b>
    <small>Votre sécurité, notre priorité</small>
  </div>
</header>

<main>

  <!-- ACCUEIL -->
  <section class="hero">
    <small>PLATEFORME DE GESTION</small>
    <h1>Bienvenue sur COP MANAGEMENT</h1>
    <p>
      La gestion professionnelle du personnel,
      des affectations et des activités de notre société.
    </p>
  </section>

  <!-- CHOIX DE CONNEXION -->
  <section class="card" id="accueil">
    <h2>Choisissez votre espace</h2>
    <p>Veuillez sélectionner votre type de connexion.</p>

    <button type="button" onclick="ouvrirConnexion('gerant')">
      🔐 Connexion du gérant
    </button>

    <br><br>

    <button type="button" onclick="ouvrirConnexion('employe')">
      👤 Connexion des employés
    </button>
  </section>

  <!-- CONNEXION GERANT -->
  <section class="card" id="connexion-gerant" hidden>
    <h2>ESPACE GÉRANT</h2>
    <p>Accès réservé à l'administrateur de CONGO ONE SERVICES.</p>

    <form id="adminLoginForm">

      <label>
        Adresse e-mail
        <input
          type="email"
          id="adminEmail"
          placeholder="Votre adresse e-mail"
          autocomplete="username"
          required
        >
      </label>

      <label>
        Mot de passe
        <input
          type="password"
          id="adminPassword"
          placeholder="Votre mot de passe"
          autocomplete="current-password"
          required
        >
      </label>

      <button type="submit">Se connecter</button>

    </form>

    <p id="adminMessage" class="note" role="status"></p>

    <button type="button" onclick="retourAccueil()">
      Retour à l'accueil
    </button>
  </section>

  <!-- CONNEXION EMPLOYE -->
  <section class="card" id="connexion-employe" hidden>
    <h2>ESPACE EMPLOYÉ</h2>
    <p>Utilisez les identifiants fournis par votre gérant.</p>

    <form id="employeeLoginForm">

      <label>
        Matricule
        <input
          type="text"
          id="employeeMatricule"
          placeholder="Exemple : COP0001"
          autocomplete="username"
          required
        >
      </label>

      <label>
        Mot de passe
        <input
          type="password"
          id="employeePassword"
          placeholder="Votre mot de passe"
          autocomplete="current-password"
          required
        >
      </label>

      <button type="submit">Se connecter</button>

    </form>

    <p id="employeeMessage" class="note" role="status"></p>

    <button type="button" onclick="retourAccueil()">
      Retour à l'accueil
    </button>
  </section>

  <!-- TABLEAU DE BORD GERANT -->
  <section class="card" id="adminDashboard" hidden>

    <div class="dashboard-header">
      <div>
        <small>CONGO ONE SERVICES SARL</small>
        <h1>Tableau de bord</h1>
        <p>Espace de gestion du gérant</p>
      </div>
    </div>

    <h2>Vue générale</h2>

    <div class="grid">
      <div>
        <strong>Personnel</strong>
        <p>Gestion des employés</p>
      </div>

      <div>
        <strong>Affectations</strong>
        <p>Sites et postes de travail</p>
      </div>

      <div>
        <strong>Horaires</strong>
        <p>Planning du personnel</p>
      </div>

      <div>
        <strong>Rapports</strong>
        <p>Suivi des activités</p>
      </div>
    </div>

    <h2>Modules de gestion</h2>

    <div class="dashboard-menu">

      <button type="button" onclick="afficherModule('personnel')">
        👥 Gestion du personnel
      </button>

      <button type="button" onclick="afficherModule('affectations')">
        📍 Affectations et sites
      </button>

      <button type="button" onclick="afficherModule('horaires')">
        🕒 Horaires et présences
      </button>

      <button type="button" onclick="afficherModule('rapports')">
        📋 Rapports d'activités
      </button>

      <button type="button" onclick="afficherModule('documents')">
        📁 Documents du personnel
      </button>

      <button type="button" onclick="afficherModule('conges')">
        📝 Congés et absences
      </button>

      <button type="button" onclick="afficherModule('salaires')">
        💰 Salaires et paiements
      </button>

      <button type="button" onclick="afficherModule('clients')">
        🏢 Clients et contrats
      </button>

    </div>

    <!-- MODULE PERSONNEL -->
    <section class="card module" id="module-personnel" hidden>
      <h2>Gestion du personnel</h2>

      <p>
        Cet espace permettra d'enregistrer et de consulter
        les dossiers individuels des employés.
      </p>

      <h3>Informations à enregistrer</h3>

      <ul>
        <li>Matricule professionnel</li>
        <li>Nom, postnom et prénom</li>
        <li>Date et lieu de naissance</li>
        <li>Adresse et coordonnées</li>
        <li>Fonction et département</li>
        <li>Date d'engagement</li>
        <li>Formation et qualifications</li>
        <li>Expériences professionnelles</li>
        <li>Personne à contacter en cas d'urgence</li>
      </ul>

      <p class="note">
        Le formulaire d'enregistrement et la sauvegarde sécurisée
        seront ajoutés dans la prochaine étape.
      </p>

      <button type="button" onclick="retourModules()">
        Retour aux modules
      </button>
    </section>

    <!-- MODULE AFFECTATIONS -->
    <section class="card module" id="module-affectations" hidden>
      <h2>Affectations et sites</h2>
      <p>
        Espace destiné à gérer les clients, les sites de travail,
        les postes et les agents affectés.
      </p>
      <button type="button" onclick="retourModules()">
        Retour aux modules
      </button>
    </section>

    <!-- MODULE HORAIRES -->
    <section class="card module" id="module-horaires" hidden>
      <h2>Horaires et présences</h2>
      <p>
        Espace destiné à organiser les horaires,
        les prises de service et les présences.
      </p>
      <button type="button" onclick="retourModules()">
        Retour aux modules
      </button>
    </section>

    <!-- MODULE RAPPORTS -->
    <section class="card module" id="module-rapports" hidden>
      <h2>Rapports d'activités</h2>
      <p>
        Espace destiné à recevoir les rapports des agents,
        avec photos et pièces justificatives.
      </p>
      <button type="button" onclick="retourModules()">
        Retour aux modules
      </button>
    </section>

    <!-- MODULE DOCUMENTS -->
    <section class="card module" id="module-documents" hidden>
      <h2>Documents du personnel</h2>
      <p>
        Espace destiné aux CV, pièces d'identité,
        diplômes, certificats et contrats.
      </p>
      <button type="button" onclick="retourModules()">
        Retour aux modules
      </button>
    </section>

    <!-- MODULE CONGES -->
    <section class="card module" id="module-conges" hidden>
      <h2>Congés et absences</h2>
      <p>
        Espace de suivi des demandes de congé,
        des absences et des autorisations.
      </p>
      <button type="button" onclick="retourModules()">
        Retour aux modules
      </button>
    </section>

    <!-- MODULE SALAIRES -->
    <section class="card module" id="module-salaires" hidden>
      <h2>Salaires et paiements</h2>
      <p>
        Espace de gestion des rémunérations,
        des paiements et des fiches de paie.
      </p>
      <button type="button" onclick="retourModules()">
        Retour aux modules
      </button>
    </section>

    <!-- MODULE CLIENTS -->
    <section class="card module" id="module-clients" hidden>
      <h2>Clients et contrats</h2>
      <p>
        Espace de gestion des clients,
        des prestations et des contrats commerciaux.
      </p>
      <button type="button" onclick="retourModules()">
        Retour aux modules
      </button>
    </section>

    <br>

    <button type="button" onclick="deconnexionAdmin()">
      🚪 Déconnexion
    </button>

  </section>

</main>

<footer>
  © CONGO ONE SERVICES SARL
  <br>
  COP MANAGEMENT
  <br>
  Votre sécurité, notre priorité.
</footer>

<!-- NAVIGATION -->
<script>

  function ouvrirConnexion(type) {

    document.getElementById("accueil").hidden = true;

    document.getElementById("connexion-gerant").hidden =
      type !== "gerant";

    document.getElementById("connexion-employe").hidden =
      type !== "employe";

  }

  function retourAccueil() {

    document.getElementById("accueil").hidden = false;

    document.getElementById("connexion-gerant").hidden = true;

    document.getElementById("connexion-employe").hidden = true;

  }

  function afficherModule(module) {

    document.getElementById("adminDashboard").querySelectorAll(".module")
      .forEach(section => section.hidden = true);

    document.getElementById("adminDashboard").querySelectorAll(".dashboard-menu")
      .forEach(menu => menu.hidden = true);

    document.getElementById("adminDashboard").querySelectorAll("h2")
      .forEach(titre => {
        if (titre.textContent === "Vue générale" ||
            titre.textContent === "Modules de gestion") {
          titre.hidden = true;
        }
      });

    document.getElementById("module-" + module).hidden = false;

  }

  function retourModules() {

    document.getElementById("adminDashboard").querySelectorAll(".module")
      .forEach(section => section.hidden = true);

    document.getElementById("adminDashboard").querySelectorAll(".dashboard-menu")
      .forEach(menu => menu.hidden = false);

    document.getElementById("adminDashboard").querySelectorAll("h2")
      .forEach(titre => titre.hidden = false);

  }

</script>

<script type="module" src="app.js"></script>

</body>
</html>
