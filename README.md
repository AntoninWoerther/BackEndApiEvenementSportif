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

Pour vérifier le démarrage, envoie `GET http://localhost:3000/evenements` dans Bruno ou lance cette commande dans un deuxième terminal.

```bash
curl -i http://localhost:3000/evenements
```

Tu dois recevoir un statut `200` avec un tableau JSON. Sur une base neuve, le tableau est vide (`[]`).

## 5. Tester la connexion dans Bruno

1. Envoie `POST http://localhost:3000/` avec un corps au format JSON.

   ```json
   {
     "name": "Martin",
     "firstname": "Camille",
     "email": "camille@example.com",
     "password": "MotDePasseLocal123!"
   }
   ```

   L’API répond `202`. Le mail d’inscription est simulé dans le terminal de l’API, sur une ligne qui commence par `[MAIL]`.

2. Envoie `POST http://localhost:3000/auth/login` avec les mêmes valeurs pour `email` et `password` dans le corps JSON. La réponse `200` contient `user`, `accessToken` et `refreshToken`.
3. Envoie `GET http://localhost:3000/auth/me` avec `Authorization: Bearer <accessToken>`. Tu dois recevoir le profil du compte connecté. Pour renouveler les jetons, envoie le `refreshToken` dans le corps JSON de `POST http://localhost:3000/auth/refresh`.

Si tu veux tester les actions réservées au superadmin, récupère `user.id` dans la réponse de connexion, puis exécute la commande suivante en remplaçant `1` par l’identifiant de ton compte de test. Elle utilise les mêmes paramètres MySQL que l’API.

```bash
npm run grant:superuser -- 1
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

### Attribuer et retirer un droit dans Bruno

Connecte-toi avec deux comptes de test distincts, un superadmin et un utilisateur ordinaire. Récupère `user.id` dans la réponse de connexion du compte ordinaire. Le superadmin peut attribuer ou retirer les droits `1`, `2`, `4`, `8`, `32`, `64` et `512`, un par requête. Les valeurs `16`, `128` et `256` sont réservées au superadmin. Pour créer le compte de test superadmin, utilise la commande `grant:superuser` indiquée à l’étape précédente.

1. Avec le token du compte ordinaire, envoie `GET /evenements/<id>/participants` sur un événement créé par un autre compte. Tu dois recevoir `403` avec le code `AUTH_006`.
2. Avec le token du superadmin, envoie `PATCH /users/<idUtilisateur>/permissions` avec le corps JSON `{"permissions": 512}`. Pour un compte ayant les droits par défaut, la réponse `200` contient `permissions: 519` car le droit `512` s’ajoute aux droits existants.
3. Rejoue la première requête avec le token du compte ordinaire. Elle doit maintenant renvoyer `200`.
4. Avec le token du superadmin, envoie `DELETE /users/<idUtilisateur>/permissions/512`. La réponse `200` contient de nouveau `permissions: 7` si le compte avait ses droits par défaut au départ. Le compte ordinaire reçoit à nouveau `403` sur la première requête.

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
