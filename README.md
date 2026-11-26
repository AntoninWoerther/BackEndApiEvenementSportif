# API d’événements sportifs

API Express et TypeScript pour créer des événements sportifs, réserver une place et gérer les comptes utilisateurs. Les données sont stockées dans MySQL.

## 1. Installer les dépendances

Il faut Node.js et npm, ainsi qu’un serveur MySQL local. Les commandes de ce guide sont prévues pour Node.js 26.12.0.

Après avoir cloné le dépôt, ouvre un terminal dans `BackEndApiEvenementSportif`, le dossier qui contient `package.json` et `package-lock.json`. Installe les dépendances avec la commande suivante.

```bash
npm ci
```

## 2. Préparer MySQL

Démarre ton serveur MySQL sur le port `3306`. Pour ouvrir une session SQL depuis le terminal, utilise `mysql -u root -p` si ton compte `root` a un mot de passe, ou `mysql -u root` s’il est vide. Si ton installation utilise un autre compte d’administration, connecte-toi avec ce compte. Exécute ensuite cette commande dans le client MySQL ou dans ton interface d’administration.

```sql
CREATE DATABASE IF NOT EXISTS evenementsportif CHARACTER SET utf8mb4;
```

Si tu choisis un autre nom de base, utilise ce nom dans la commande SQL et dans `DB_NAME` à l’étape suivante.

TypeORM crée les tables au premier démarrage grâce à `synchronize: true`. Le compte utilisé par l’API doit donc pouvoir créer et modifier les tables de cette base.

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

Par défaut, l’`accessToken` expire après **5 minutes**. Si une route protégée renvoie `401`, vérifie d’abord que son Bearer Token contient l’`accessToken` du bon compte. Si ce jeton a expiré, suis ces étapes dans Postman ou Bruno.

1. Envoie `POST http://localhost:3000/auth/refresh`, sans en-tête `Authorization`. Dans le corps JSON, colle le dernier **`refreshToken`** reçu à la connexion ou au précédent renouvellement.

   ```json
   {"refreshToken": "colle_ici_le_jeton_de_renouvellement"}
   ```

2. Si l’API répond `200`, garde **les deux nouveaux jetons**. Remplace la valeur du Bearer Token par le nouvel `accessToken`, puis rejoue ta requête. Garde le nouveau `refreshToken` pour le prochain renouvellement ou la déconnexion. Chaque renouvellement révoque le `refreshToken` utilisé.
3. Si `/auth/refresh` renvoie `401` avec `AUTH_003`, `AUTH_004` ou `AUTH_005`, reconnecte-toi via `POST http://localhost:3000/auth/login` avec ton e-mail et ton mot de passe pour obtenir une nouvelle paire de jetons.

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
5. **Tenter de modifier l’événement de Camille.** Envoie `PATCH /evenements/<id>` avec le token d’Alex et le corps JSON `{"location": "Terrain extérieur"}`. Résultat attendu `403` avec le code `EVENEMENT_006`, car Alex n’a pas le droit de modifier les événements d’un autre créateur.
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

Utilise un superadmin créé à l’étape 2 du parcours 3 et un compte ordinaire distinct. Le superadmin peut attribuer ou retirer les droits `1`, `2`, `4`, `8`, `32`, `64`, `512`, `1024` et `2048`, un par requête. Les valeurs `16`, `128` et `256` sont réservées au superadmin. Pour les tests ci-dessous, récupère `user.id` dans la réponse de connexion du compte ordinaire.

1. Avec le token du compte ordinaire, envoie `GET /evenements/<id>/participants` sur un événement créé par un autre compte. Tu dois recevoir `403` avec le code `AUTH_006`.
2. Avec le token du superadmin, envoie `PATCH /users/<idUtilisateur>/permissions` avec le corps JSON `{"permissions": 512}`. Pour un compte ayant les droits par défaut, la réponse `200` contient `permissions: 519` car le droit `512` s’ajoute aux droits existants.
3. Rejoue la première requête avec le token du compte ordinaire. Elle doit maintenant renvoyer `200`.
4. Avec le token du superadmin, envoie `DELETE /users/<idUtilisateur>/permissions/512`. La réponse `200` contient de nouveau `permissions: 7` si le compte avait ses droits par défaut au départ. Le compte ordinaire reçoit à nouveau `403` sur la première requête.

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

Une montée change uniquement l’ordre de la file. La réservation reste une action distincte via `POST /evenements/<id>/reservations`.

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
