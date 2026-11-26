# API d’événements sportifs

API Express et TypeScript pour créer des événements sportifs, réserver une place et gérer les comptes utilisateurs. Les données sont stockées dans MySQL.

## 1. Installer les dépendances

Il faut Node.js et npm, ainsi qu’un serveur MySQL local. Les commandes de ce guide sont prévues pour Node.js 26.12.0.

Après avoir cloné le dépôt, ouvre un terminal dans `BackEndApiEvenementSportif`, le dossier qui contient `package.json` et `package-lock.json`. Installe les dépendances avec la commande suivante.

```bash
npm ci
```

## 2. Préparer MySQL

### Avec WampServer sous Windows

1. Lance WampServer et vérifie que le service **MySQL** est démarré depuis l’icône WampServer dans la zone de notification de Windows. [Guide d’installation de WampServer](https://wampserver.aviatechno.net/index.php?affiche=install&lang=en)
2. Ouvre **phpMyAdmin** depuis le menu WampServer ou à l’adresse `http://localhost/phpmyadmin`. Si phpMyAdmin propose plusieurs serveurs, sélectionne **MySQL**. Connecte-toi avec ton compte MySQL. Sur une installation WampServer par défaut, essaie `root` avec le mot de passe vide.
3. Dans phpMyAdmin, ouvre l’onglet **SQL**, exécute la commande de création de base indiquée ci-dessous, puis vérifie que `evenementsportif` apparaît dans la liste des bases.
4. Si tu dois vérifier le port du serveur sélectionné, exécute `SELECT @@port AS port_mysql;` dans l’onglet **SQL**. Renseigne ce port dans `DB_PORT` à l’étape 3. Pour une API lancée sur le même Windows, utilise `DB_HOST=localhost` et les identifiants MySQL utilisés dans phpMyAdmin. Laisse WampServer tourner pendant les tests de l’API.

### Avec un autre serveur MySQL

Démarre le serveur MySQL. Pour ouvrir une session SQL depuis le terminal, utilise `mysql -u root -p` si ton compte `root` a un mot de passe, ou `mysql -u root` s’il est vide. Si ton installation utilise un autre compte d’administration, connecte-toi avec ce compte.

### Créer la base vide

Exécute cette commande dans phpMyAdmin ou dans ton client MySQL.

```sql
CREATE DATABASE IF NOT EXISTS evenementsportif CHARACTER SET utf8mb4;
```

Si tu choisis un autre nom de base, utilise ce nom dans la commande SQL et dans `DB_NAME` à l’étape suivante.

TypeORM crée les tables au premier démarrage de l’API grâce à `synchronize: true`. Le compte utilisé par l’API doit donc pouvoir créer et modifier les tables de cette base. Si tu utilises WampServer, actualise l’affichage de la base dans phpMyAdmin après `npm run dev` pour voir les tables créées.

## 3. Configurer MySQL et les jetons dans `.env`

Si tu n’as pas encore de fichier `.env`, copie [`.env.example`](.env.example) sous le nom `.env`, à côté de `package.json`.

Adapte les paramètres `DB_*` de `.env` à ton serveur MySQL.

| Variable | Valeur locale par défaut |
| --- | --- |
| `DB_HOST` | `localhost` |
| `DB_PORT` | `3306` |
| `DB_USER` | `root` |
| `DB_PASSWORD` | Vide |
| `DB_NAME` | `evenementsportif` |

Si ton compte MySQL a un mot de passe, renseigne-le dans `DB_PASSWORD`. Mets la valeur entre guillemets si elle contient un `#`. Le fichier `.env` est ignoré par Git et `.env.example` sert de modèle partagé.

Pour la connexion des utilisateurs, génère une clé de signature avec Node.js.

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Renseigne la valeur affichée dans `JWT_SECRET`.

```dotenv
JWT_SECRET=ta_cle_generee
JWT_EXPIRES_IN=5m
```

`JWT_SECRET` est nécessaire pour signer les jetons de connexion. `JWT_EXPIRES_IN` est facultative et vaut `5m` par défaut.

## 4. Démarrer l’API

```bash
npm run dev
```

Une fois la connexion à MySQL établie, le terminal affiche `Server is running on http://localhost:3000`. Le serveur redémarre automatiquement quand tu modifies un fichier dans `src`. Pour l’arrêter, utilise `Ctrl+C`.

Pour vérifier le démarrage, envoie `GET http://localhost:3000/evenements` dans Postman ou Bruno. Tu peux aussi lancer cette commande dans un deuxième terminal.

```bash
curl -i http://localhost:3000/evenements
```

Tu dois recevoir un statut `200` avec un tableau JSON. Sur une base neuve, le tableau est vide (`[]`).

## 5. Tester l’API avec Postman ou Bruno

### Configuration dans Postman

1. Utilise l’application Postman sur ton ordinateur. Si tu utilises la version web, sélectionne le **Desktop Agent** pour accéder à `localhost`. [Documentation Postman sur les agents](https://learning.postman.com/docs/getting-started/basics/about-postman-agent/)
2. Crée une requête HTTP, choisis la méthode et saisis l’URL. Si la requête contient du JSON, sélectionne **Body → raw → JSON**, puis colle le corps. [Documentation Postman sur le corps des requêtes](https://learning.postman.com/docs/use/send-requests/create-requests/parameters/)
3. Pour une route protégée, sélectionne **Authorization → Bearer Token** et colle la valeur de `accessToken` dans le champ **Token**. Clique sur **Send** pour envoyer la requête. [Documentation Postman sur le Bearer Token](https://learning.postman.com/docs/use/send-requests/authorization/authorization-types/)

### Configuration dans Bruno

1. Crée une collection, puis ajoute une **New Request** de type HTTP. Choisis la méthode et saisis l’URL. Si la requête contient du JSON, sélectionne **Body → JSON**, puis colle le corps. [Guide de démarrage de Bruno](https://github.com/usebruno/bruno-docs/blob/main/introduction/quick-start.mdx)
2. Pour une route protégée, sélectionne **Auth → Bearer Token** et colle la valeur de `accessToken` dans le champ du jeton. Clique sur **Send** pour envoyer la requête. [Guide d’authentification de Bruno](https://blog.usebruno.com/api-authentication-a-bruno-handbook)

### Parcours de connexion commun

1. Crée un compte avec `POST http://localhost:3000/` et le corps JSON suivant. Cette requête et la connexion sont accessibles sans jeton.

   ```json
   {
     "name": "Martin",
     "firstname": "Camille",
     "email": "camille@example.com",
     "password": "MotDePasseLocal123!"
   }
   ```

   L’API répond `202`. Le mail d’inscription est simulé dans le terminal de l’API, sur une ligne qui commence par `[MAIL]`.

2. Envoie `POST http://localhost:3000/auth/login` avec les mêmes identifiants. La réponse `200` contient `user`, `accessToken` et `refreshToken`.

   ```json
   {
     "email": "camille@example.com",
     "password": "MotDePasseLocal123!"
   }
   ```

3. Envoie `GET http://localhost:3000/auth/me` avec `accessToken` dans le champ Bearer Token et laisse le corps vide. La réponse `200` contient le profil du compte connecté.

### Rappel pour renouveler un jeton expiré

Par défaut, l’`accessToken` expire après **5 minutes**. Chaque `refreshToken` est valable **7 jours à partir de son émission**, à la connexion ou lors d’un renouvellement. Si une route protégée renvoie `401`, vérifie d’abord que son Bearer Token contient l’`accessToken` du bon compte. Si ce jeton a expiré, suis ces étapes dans Postman ou Bruno.

1. Envoie `POST http://localhost:3000/auth/refresh`, sans en-tête `Authorization`. Dans le corps JSON, colle le dernier **`refreshToken`** reçu à la connexion ou au précédent renouvellement.

   ```json
   {"refreshToken": "colle_ici_le_jeton_de_renouvellement"}
   ```

2. Si l’API répond `200`, garde **les deux nouveaux jetons**. Remplace la valeur du Bearer Token par le nouvel `accessToken`, puis rejoue ta requête. Garde le nouveau `refreshToken` pour le prochain renouvellement ou la déconnexion. Chaque renouvellement révoque le `refreshToken` utilisé.
3. Si `/auth/refresh` renvoie `401` avec `AUTH_003` (jeton invalide, expiré ou révoqué), reconnecte-toi via `POST http://localhost:3000/auth/login` avec ton e-mail et ton mot de passe pour obtenir une nouvelle paire de jetons.

### Parcours 1 · Créer et modifier son événement

Dans les parcours, ajoute les chemins à `http://localhost:3000`. Pour les routes protégées, utilise le Bearer Token du compte qui effectue l’action. Si tu rejoues les parcours, choisis des adresses e-mail de test encore inutilisées. Si ton jeton expire pendant un test, suis le [rappel sur le renouvellement](#rappel-pour-renouveler-un-jeton-expiré).

1. **Créer le compte A.** Envoie `POST /` avec le corps d’inscription de Camille présenté ci-dessus. Résultat attendu `202`.
2. **Se connecter.** Envoie `POST /auth/login` avec l’e-mail et le mot de passe de Camille. Résultat attendu `200`. Garde son `accessToken` pour les étapes suivantes.
3. **Créer un événement.** Envoie `POST /evenements` avec le token de Camille et ce corps JSON. Choisis une date future au format `AAAA-MM-JJ` si celle de l’exemple est passée. Résultat attendu `201`. Note l’`id` de l’événement renvoyé et utilise-le à la place de `<id>`.

   ```json
   {
     "description": "Match amical de volley",
     "location": "Gymnase municipal",
     "date": "2030-06-15",
     "capacity": 1
   }
   ```

4. **S’inscrire à l’événement.** Envoie `POST /evenements/<id>/reservations` avec le token de Camille et un corps vide. Résultat attendu `201`.
5. **Modifier son événement.** Envoie `PATCH /evenements/<id>` avec le token de Camille et le corps JSON `{"location": "Salle omnisports"}`. Résultat attendu `200`. La réponse affiche le nouveau lieu.
6. **Se retirer de l’événement.** Envoie `DELETE /evenements/<id>/reservations/me` avec le token de Camille et un corps vide. Résultat attendu `200`. La place est de nouveau disponible pour le parcours suivant.

### Parcours 2 · Participer à l’événement d’un autre compte

1. **Créer le compte B.** Envoie `POST /` avec le corps ci-dessous. Résultat attendu `202`.

   ```json
   {
     "name": "Dubois",
     "firstname": "Alex",
     "email": "alex@example.com",
     "password": "MotDePasseLocal456!"
   }
   ```

2. **Se connecter.** Envoie `POST /auth/login` avec le corps JSON `{"email": "alex@example.com", "password": "MotDePasseLocal456!"}`. Résultat attendu `200`. Garde les deux jetons d’Alex et utilise son `accessToken` pour les requêtes protégées de ce parcours.
3. **Afficher les événements.** Envoie `GET /evenements` avec un corps vide. Résultat attendu `200`. Retrouve l’événement du premier parcours à l’aide de son `id`. Le champ `location` affiche `Salle omnisports` et `remainingPlaces` vaut `1`.
4. **S’inscrire à l’événement.** Envoie `POST /evenements/<id>/reservations` avec le token d’Alex et un corps vide. Résultat attendu `201`.
5. **Tenter de modifier l’événement de Camille.** Envoie `PATCH /evenements/<id>` avec le token d’Alex et le corps JSON `{"location": "Terrain extérieur"}`. Résultat attendu `403` avec le code `EVENEMENT_006`, car Alex n’a pas le droit de modifier les événements d’un autre créateur. Modifier la date avec `PATCH /evenements/<id>/date` demande les mêmes droits et renvoie le même code en cas de refus.
6. **Se déconnecter.** Envoie `POST /auth/logout` avec le corps JSON ci-dessous et la valeur du `refreshToken` d’Alex. Résultat attendu `200`. Pour vérifier la déconnexion, rejoue `GET /auth/me` avec son dernier `accessToken`. La requête doit renvoyer `401`.

   ```json
   {"refreshToken": "colle_ici_le_jeton_de_renouvellement_d_alex"}
   ```

### Parcours 3 · Créer et utiliser un compte superadmin

Reprends le compte ordinaire d’Alex et l’événement créé par Camille dans les parcours précédents. Utilise `http://localhost:3000` comme adresse de base dans Postman ou Bruno. TypeORM crée les tables au premier démarrage. La promotion se fait ensuite sur un compte existant.

1. **Créer le compte C.** Envoie `POST /` avec le corps JSON suivant. Résultat attendu `202`.

   ```json
   {
     "name": "Leroy",
     "firstname": "Morgan",
     "email": "morgan@example.com",
     "password": "MotDePasseLocal789!"
   }
   ```

2. **Promouvoir Morgan superadmin.** Fais une première connexion avec `POST /auth/login` et les identifiants de Morgan pour récupérer `user.id`. Dans un terminal ouvert dans `BackEndApiEvenementSportif`, avec MySQL démarré, exécute la commande suivante en remplaçant `1` par cet identifiant. Le terminal confirme la promotion du compte.

   ```bash
   npm run grant:superuser -- 1
   ```

3. **Se connecter en tant que superadmin.** Envoie `POST /auth/login` avec le corps JSON `{"email": "morgan@example.com", "password": "MotDePasseLocal789!"}`. Résultat attendu `200`. Garde l’`accessToken` de Morgan pour les actions d’administration et son `refreshToken` pour la déconnexion. Utilise l’identifiant `user.id` d’Alex obtenu au parcours 2. Tu peux aussi le retrouver avec `GET /` en utilisant le token de Morgan.
4. **Modifier les permissions d’Alex.** Envoie `PATCH /users/<idAlex>/permissions` avec le token de Morgan et le corps JSON `{"permissions": 32}`. Résultat attendu `200`. Si Alex avait les droits par défaut (`7`), la réponse affiche `permissions: 39`.
5. **Suspendre le compte d’Alex.** Envoie `PATCH /users/<idAlex>/suspend` avec le token de Morgan et un corps vide. Résultat attendu `200` avec `suspended: true`.
6. **Vérifier que la connexion d’Alex est bloquée.** Envoie `POST /auth/login` avec le corps JSON `{"email": "alex@example.com", "password": "MotDePasseLocal456!"}`. Résultat attendu `403` avec le code `USER_007` et le message « Ce compte est suspendu. »
7. **Réactiver le compte d’Alex.** Envoie `PATCH /users/<idAlex>/reactivate` avec le token de Morgan et un corps vide. Résultat attendu `200` avec `suspended: false`. Rejoue `POST /auth/login` avec les identifiants d’Alex pour vérifier que la connexion renvoie à nouveau `200`.
8. **Modifier un événement créé par un autre compte.** Envoie `PATCH /evenements/<idEvenement>` avec le token de **Morgan**, l’identifiant de l’événement de Camille et le corps JSON `{"location": "Complexe sportif municipal"}`. Résultat attendu `200` avec le nouveau lieu.
9. **Déconnecter le superadmin.** Envoie `POST /auth/logout` avec le corps JSON ci-dessous et le dernier `refreshToken` de Morgan. Résultat attendu `200`. Vérifie la déconnexion avec `GET /auth/me` et l’ancien `accessToken` de Morgan. La réponse doit être `401`.

   ```json
   {"refreshToken": "colle_ici_le_jeton_de_renouvellement_de_morgan"}
   ```

## 6. Permissions et valeurs

Un nouveau compte reçoit les permissions `1`, `2` et `4`, soit la valeur totale `7`. Les routes du tableau utilisent l’adresse `http://localhost:3000` et l’**access token** du compte qui effectue l’action.

| Valeur | Permission | Utilité | Route à tester |
| --- | --- | --- | --- |
| `1` | `CREATE_EVENT` | Créer un événement. | `POST /evenements` |
| `2` | `UPDATE_EVENT` | Modifier la date, la description, le lieu ou la capacité de ses propres événements. | `PATCH /evenements/<id>` ou `PATCH /evenements/<id>/date` |
| `4` | `UPDATE_ACCOUNT` | Changer son propre mot de passe en fournissant `oldPassword` et `newPassword`. | `PATCH /me/password` |
| `8` | `DELETE_ACCOUNT` | Supprimer le compte d’un autre utilisateur. Les comptes superadmins sont protégés. | `DELETE /<idUtilisateur>` |
| `16` | `SUPERUSER` | Accéder à tous les droits du tableau, gérer les permissions des autres comptes, consulter leurs profils et exporter le journal des changements de droits. | `PATCH /users/<id>/permissions`, `GET /`, `GET /<id>` ou `GET /users/permissions/audit/export` |
| `32` | `UPDATE_OTHER_EVENTS` | Modifier la date, la description, le lieu ou la capacité des événements créés par d’autres utilisateurs. | `PATCH /evenements/<id>` ou `PATCH /evenements/<id>/date` |
| `64` | `REMOVE_EVENT_PARTICIPANTS` | Retirer un participant d’un événement, quel que soit son créateur. | `DELETE /evenements/<idEvenement>/participants/<idUtilisateur>` |
| `128` | `SUSPEND_ACCOUNT` | Suspendre un compte existant et révoquer ses sessions actives. Réservé aux superadmins. | `PATCH /users/<id>/suspend` |
| `256` | `REACTIVATE_ACCOUNT` | Réactiver un compte suspendu. Réservé aux superadmins. | `PATCH /users/<id>/reactivate` |
| `512` | `VIEW_OTHER_EVENT_PARTICIPANTS` | Consulter le nom et le prénom des inscrits aux événements des autres. Le créateur peut déjà consulter les inscrits à son propre événement. | `GET /evenements/<id>/participants` |
| `1024` | `CANCEL_OTHER_EVENTS` | Annuler un événement créé par un autre utilisateur. Le créateur peut annuler son propre événement. | `PATCH /evenements/<id>/cancel` |
| `2048` | `MANAGE_OTHER_EVENT_WAITLISTS` | Consulter et réordonner les files d’attente des autres créateurs. Le créateur peut gérer sa propre file. | `GET /evenements/<id>/waitlist` et `PATCH /evenements/<id>/waitlist/<idEntree>/move-up` |

### Attribuer et retirer un droit dans Postman ou Bruno

Le superadmin peut attribuer ou retirer les droits `1`, `2`, `4`, `8`, `32`, `64`, `512`, `1024` et `2048`, un par requête. Les valeurs `16`, `128` et `256` sont réservées au superadmin.

Reprends Alex et Morgan après le parcours 3. Reconnecte les deux comptes avec `POST /auth/login` pour récupérer leurs `accessToken` et l’identifiant `user.id` d’Alex. Alex commence ce test avec `permissions: 39`, car Morgan lui a déjà ajouté le droit `32` dans le parcours 3.

1. Avec le token d’Alex, envoie `GET /evenements/<idEvenement>/participants` sur l’événement de Camille. Tu dois recevoir `403` avec le code `AUTH_006`.
2. Avec le token de Morgan, envoie `PATCH /users/<idAlex>/permissions` avec le corps JSON `{"permissions": 512}`. La réponse `200` contient `permissions: 551`.
3. Rejoue la première requête avec le token d’Alex. Elle doit maintenant renvoyer `200`.
4. Avec le token de Morgan, envoie `DELETE /users/<idAlex>/permissions/512`. La réponse `200` contient de nouveau `permissions: 39`. Avec le token d’Alex, la première requête renvoie à nouveau `403`.

### Tester l’annulation d’un événement

Avec l’access token du créateur ou d’un compte autorisé par le droit `1024`, envoie `PATCH /evenements/<id>/cancel` avec un motif obligatoire dans le corps JSON.

```json
{"reason": "Le gymnase est indisponible."}
```

L’API renvoie `200`. Le motif apparaît dans `description` et la date d’annulation dans `cancelledAt`. Chaque inscrit reçoit un mail simulé dans le terminal de l’API. Une nouvelle inscription renvoie `409` (`EVENEMENT_009`) et les réservations existantes affichent `evenement.status` à `cancelled`. Le nettoyage horaire supprime l’événement et ses réservations au premier passage après cinq jours depuis l’annulation.

### Tester la file d’attente

Crée un événement à une place et réserve cette place avec un premier compte. Utilise l’`accessToken` du compte indiqué pour chaque requête. Laisse le corps vide pour les quatre routes de la file.

1. Avec chacun de deux autres comptes, envoie `POST /evenements/<id>/waitlist`. Tu dois recevoir `201` avec l’`id` de l’entrée et sa `position`.
2. Avec le token du créateur, envoie `GET /evenements/<id>/waitlist`. La réponse `200` affiche les entrées dans l’ordre, avec leur `id`, leur `position`, leur `name` et leur `firstname`. Pour déléguer l’accès à la file, attribue le droit `2048` avec `PATCH /users/<idUtilisateur>/permissions` et le corps `{"permissions": 2048}`.
3. Avec le token du créateur ou de la personne qui a reçu le droit `2048`, envoie `PATCH /evenements/<id>/waitlist/<idEntree>/move-up` en utilisant l’`id` de la deuxième entrée. La réponse `200` affiche sa nouvelle position `1`.
4. Avec le token d’une personne en file, envoie `DELETE /evenements/<id>/waitlist/me`. La réponse `200` confirme son retrait.

Une montée change l’ordre dans lequel les places sont attribuées. Pour tester l’inscription automatique, garde au moins une personne en file et libère la réservation initiale avec `DELETE /evenements/<id>/reservations/me`. Tu peux aussi augmenter la capacité avec `PATCH /evenements/<id>` et un corps comme `{"capacity": 3}`. Les places disponibles sont attribuées dans l’ordre de la file aux comptes actifs. Chaque personne promue apparaît dans `GET /me/reservations` et reçoit un mail simulé dans le terminal de l’API avec la description et la date de l’événement.

## 7. Référence des routes

Ajoute chaque chemin à `http://localhost:3000` et remplace les paramètres comme `<idEvenement>` par les identifiants reçus dans les réponses. Pour une route réservée à un compte connecté, envoie son `accessToken` en Bearer Token. Dans la colonne « Corps JSON », `—` signifie que le corps doit rester vide. Les exemples utilisent `Content-Type: application/json`.

### Authentification

| Méthode et chemin | Accès | Corps JSON | Succès |
| --- | --- | --- | --- |
| `POST /auth/login` | Public | `{"email":"camille@example.com","password":"MotDePasseLocal123!"}` | `200` · profil et deux jetons |
| `GET /auth/me` | Compte connecté | — | `200` · profil du compte connecté |
| `POST /auth/refresh` | Jeton de renouvellement dans le corps | `{"refreshToken":"<dernierRefreshToken>"}` | `200` · nouvelle paire de jetons |
| `POST /auth/logout` | Jeton de renouvellement dans le corps | `{"refreshToken":"<dernierRefreshToken>"}` | `200` · session déconnectée |
| `POST /auth/logout-all` | Compte connecté | — | `200` · toutes les sessions du compte déconnectées |

### Comptes et administration

| Méthode et chemin | Accès | Corps JSON | Succès |
| --- | --- | --- | --- |
| `POST /` | Public | `{"name":"Martin","firstname":"Camille","email":"camille@example.com","password":"MotDePasseLocal123!"}` | `202` · demande d’inscription reçue |
| `GET /` | Superadmin | — | `200` · liste des comptes |
| `GET /<idUtilisateur>` | Superadmin | — | `200` · détail d’un compte |
| `PATCH /me/password` | Compte connecté avec le droit `4` | `{"oldPassword":"MotDePasseLocal123!","newPassword":"NouveauMotDePasse456!"}` | `200` · mot de passe modifié |
| `DELETE /<idUtilisateur>` | Titulaire du compte ou droit `8` pour un autre compte ordinaire | — | `200` · compte supprimé |
| `PATCH /users/<idUtilisateur>/permissions` | Superadmin | `{"permissions":512}` | `200` · permissions mises à jour |
| `DELETE /users/<idUtilisateur>/permissions/<droit>` | Superadmin | — | `200` · permissions mises à jour |
| `GET /users/permissions/audit/export` | Superadmin | — | `200` · journal des modifications de droits en JSON |
| `PATCH /users/<idUtilisateur>/suspend` | Superadmin | — | `200` · `suspended: true` |
| `PATCH /users/<idUtilisateur>/reactivate` | Superadmin | — | `200` · `suspended: false` |

Les comptes superadmins sont protégés contre la suppression via l’API. Les valeurs des droits sont détaillées dans la [section Permissions](#6-permissions-et-valeurs).

### Événements

| Méthode et chemin | Accès | Corps JSON | Succès |
| --- | --- | --- | --- |
| `GET /evenements` | Public | — | `200` · liste avec les places restantes |
| `GET /evenements/<idEvenement>` | Public | — | `200` · détail avec les places restantes |
| `POST /evenements` | Compte connecté avec le droit `1` | `{"description":"Match amical","location":"Gymnase","date":"2030-06-15","capacity":2}` | `201` · événement créé |
| `PATCH /evenements/<idEvenement>` | Droit `2` sur son événement ou droit `32` sur celui d’un autre | Un ou plusieurs champs parmi `description`, `location` et `capacity`, par exemple `{"location":"Terrain B"}` | `200` · événement modifié |
| `PATCH /evenements/<idEvenement>/date` | Droit `2` sur son événement ou droit `32` sur celui d’un autre | `{"date":"2030-06-16"}` | `200` · nouvelle date |
| `PATCH /evenements/<idEvenement>/cancel` | Créateur ou droit `1024` sur l’événement d’un autre | `{"reason":"Gymnase indisponible"}` | `200` · événement annulé |
| `DELETE /evenements/<idEvenement>` | Créateur | — | `200` · événement supprimé |

### Réservations et file d’attente

| Méthode et chemin | Accès | Corps JSON | Succès |
| --- | --- | --- | --- |
| `GET /me/reservations` | Compte connecté | — | `200` · ses réservations avec le statut de chaque événement |
| `POST /evenements/<idEvenement>/reservations` | Compte connecté | — | `201` · place réservée |
| `DELETE /evenements/<idEvenement>/reservations/me` | Compte connecté inscrit | — | `200` · participation annulée |
| `GET /evenements/<idEvenement>/participants` | Créateur ou droit `512` sur l’événement d’un autre | — | `200` · nom et prénom des inscrits |
| `DELETE /evenements/<idEvenement>/participants/<idUtilisateur>` | Compte connecté avec le droit `64` | — | `200` · participant retiré |
| `POST /evenements/<idEvenement>/waitlist` | Compte connecté | — | `201` · inscription en file d’attente |
| `DELETE /evenements/<idEvenement>/waitlist/me` | Compte connecté en file | — | `200` · retrait de la file |
| `GET /evenements/<idEvenement>/waitlist` | Créateur ou droit `2048` sur l’événement d’un autre | — | `200` · liste ordonnée des personnes en attente |
| `PATCH /evenements/<idEvenement>/waitlist/<idEntree>/move-up` | Créateur ou droit `2048` sur l’événement d’un autre | — | `200` · position de l’entrée |

Dans `GET /me/reservations`, `evenement.status` vaut `upcoming` (à venir), `today` (aujourd’hui), `finished` (terminé) ou `cancelled` (annulé). La date du jour est calculée dans le fuseau `Europe/Paris`.

## 8. Format des erreurs

Envoie `POST /auth/refresh` dans Postman ou Bruno avec le corps JSON `{"refreshToken":""}`. L’API répond avec le statut HTTP `400` et le corps suivant.

```json
{
  "statusCode": 400,
  "idcode": "ERR_VALI_400",
  "message": "Les données envoyées sont invalides.",
  "fields": {
    "fields": [
      {
        "field": "refreshToken",
        "constraints": [
          {
            "constraint": "isNotEmpty",
            "message": "refreshToken should not be empty"
          }
        ]
      }
    ]
  }
}
```

`idcode` identifie l’erreur pour le client. `message` contient le texte à afficher. `fields` est présent lorsque l’erreur contient des détails, comme les champs invalides dans cet exemple. Le middleware choisit le statut HTTP à partir du code métier et utilise le presenter pour construire le JSON. [Middleware d’erreur](src/core/middleware/erreur.middleware.ts) · [Presenter d’erreur](src/core/http/error.response.ts)

## 9. Exemple de Clean Architecture

La création d’un événement avec `POST /evenements` traverse les couches suivantes.

1. La route vérifie la session et le droit `CREATE_EVENT` (`1`) avant d’appeler le contrôleur. [Route Express](src/profile/evenement/presentation/routes/evenement.route.ts)
2. Le contrôleur récupère l’identifiant du créateur depuis la session, valide le corps avec `CreateEvenementDto`, puis transmet les données validées au use case. [Contrôleur](src/profile/evenement/presentation/controllers/evenement.controller.ts) · [DTO HTTP](src/profile/evenement/presentation/dtos/create-evenement.dto.ts)
3. Le use case reçoit un `CreateEvenementInput`, appelle `EvenementGateway.create` et lève une erreur métier si le compte créateur est introuvable. [Input](src/profile/evenement/app/inputs/create-evenement.input.ts) · [Use case](src/profile/evenement/app/usecases/create-evenement.usecase.ts) · [Interface de la gateway](src/profile/evenement/app/interfaces/evenement.gateway.ts)
4. L’adaptateur d’infrastructure implémente cette interface et enregistre l’événement dans MySQL via TypeORM. `server.ts` injecte cet adaptateur dans le use case au démarrage. [Adaptateur TypeORM](src/profile/evenement/infra/persistance/repositories/typeorm-evenement.gateway.ts) · [Assemblage](src/server.ts)
5. Le contrôleur passe l’événement au presenter, qui sélectionne les champs publics, puis envoie le JSON avec le statut `201`. [Presenter](src/profile/evenement/presentation/presenters/evenement.presenter.ts)

## 10. Tâches automatiques et mails simulés

Les mails sont simulés dans le terminal de l’API sur des lignes qui commencent par `[MAIL]`. Les tâches planifiées s’exécutent au démarrage de l’API, puis toutes les heures tant qu’elle tourne. Les rappels et les délais J+5 et J+7 suivent la date du jour à Paris (`Europe/Paris`).

| Déclencheur | Comportement |
| --- | --- |
| Veille d’un événement | Au passage de la tâche, l’API simule un rappel pour les personnes inscrites à l’événement. Le message contient la date, le lieu, la description et le nom de l’organisateur. |
| Changement de date | Quand `PATCH /evenements/<idEvenement>/date` modifie la date, l’API simule un mail avec la nouvelle date pour les personnes déjà inscrites. |
| J+5 après la date de l’événement | L’API simule un mail au créateur pour l’avertir de la suppression prévue à J+7. Si le premier passage a lieu à J+6, le mail indique le jour restant. |
| J+7 après la date de l’événement | L’API supprime l’événement si sa date n’a pas été reportée, ainsi que les réservations et les entrées en file associées. Pour un événement annulé, le délai est de cinq jours à partir de l’annulation. |
| Expiration d’un jeton de renouvellement | La tâche de nettoyage supprime les jetons arrivés à expiration. Un jeton révoqué reste en base jusqu’à son expiration et devient inutilisable dès sa révocation. |

### Vérifier le rappel de la veille dans Postman ou Bruno

1. Avec l’`accessToken` du créateur, envoie `POST /evenements` en reprenant le corps du [parcours 1](#parcours-1--créer-et-modifier-son-événement). Renseigne la date de **demain à Paris**, au format `AAAA-MM-JJ`, puis note l’`id` renvoyé.
2. Avec l’`accessToken` d’un autre compte, envoie `POST /evenements/<idEvenement>/reservations` avec un corps vide. La réponse `201` confirme l’inscription.
3. Redémarre l’API avec `Ctrl+C`, puis `npm run dev`, en laissant MySQL tourner. Le démarrage déclenche immédiatement la tâche de rappel.
4. Dans le terminal de l’API, repère la ligne `[MAIL]` contenant « Rappel de l’événement » et l’adresse du compte inscrit. Vérifie la date, le lieu, la description et le nom de l’organisateur. Redémarre une seconde fois pour vérifier que le même compte ne reçoit pas un deuxième rappel pour cette date.

Les [tests du rappel](tests/evenement-reminders.test.mjs) vérifient aussi les inscriptions tardives, le report et l’annulation sans attendre le prochain passage de la tâche.

## Lancer les tests automatisés

```bash
npm test
```

Les tests couvrent la dernière place disponible, les permissions et le renouvellement des jetons. Ils utilisent une base simulée et se lancent sans démarrer MySQL ni l’API.

## Si le démarrage échoue

| Erreur | Vérification |
| --- | --- |
| `ECONNREFUSED` sur le port MySQL | Vérifie que MySQL tourne sur l’adresse et le port de `DB_HOST` et `DB_PORT`. |
| `ER_ACCESS_DENIED_ERROR` | Vérifie `DB_USER` et `DB_PASSWORD` dans `.env`. |
| `ER_BAD_DB_ERROR` | Vérifie que la base indiquée par `DB_NAME` existe sur le serveur MySQL. |
| `EADDRINUSE` sur le port `3000` | Libère le port occupé avant de relancer l’API. |
| `La clé JWT_SECRET est manquante.` | Vérifie le nom de la variable et l’emplacement de `.env`, puis redémarre l’API. |
