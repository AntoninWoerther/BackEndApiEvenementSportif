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

L’API utilise par défaut `localhost:3306`, le compte `root` avec un mot de passe vide et la base `evenementsportif`. Ces valeurs se trouvent dans [src/core/dataBase.config.ts](src/core/dataBase.config.ts). Si ton installation exige un mot de passe ou utilise un autre compte, adapte la configuration locale à tes identifiants MySQL. Garde tes identifiants hors des commits.

TypeORM crée les tables au premier démarrage grâce à `synchronize: true`. Le compte utilisé par l’API doit donc pouvoir créer et modifier les tables de cette base.

## 3. Configurer les jetons

Crée un fichier `.env` à côté de `package.json`. Tu peux générer une clé de signature avec Node.js.

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Copie la valeur affichée à la place de `ta_cle_generee` dans le fichier `.env`.

```dotenv
JWT_SECRET=ta_cle_generee
JWT_EXPIRES_IN=5m
```

`JWT_SECRET` est nécessaire pour signer les jetons de connexion. `JWT_EXPIRES_IN` est facultative et vaut `5m` par défaut. Git ignore le fichier `.env`.

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

Si tu veux tester les actions réservées au superadmin, récupère `user.id` dans la réponse de connexion, puis exécute la commande suivante en remplaçant `1` par l’identifiant de ton compte de test.

```bash
npm run grant:superuser -- 1
```

## Lancer les tests automatisés

```bash
npm test
```

Les tests couvrent la dernière place disponible, les permissions et le renouvellement des jetons. Ils utilisent une base simulée et se lancent sans démarrer MySQL ni l’API.

## Si le démarrage échoue

| Erreur | Vérification |
| --- | --- |
| `ECONNREFUSED` sur le port `3306` | Vérifie que MySQL tourne et accepte les connexions TCP sur ce port. |
| `ER_ACCESS_DENIED_ERROR` | Vérifie que le compte MySQL et son mot de passe correspondent à la configuration de l’API. |
| `ER_BAD_DB_ERROR` | Vérifie que la base `evenementsportif` existe sur le serveur auquel l’API se connecte. |
| `EADDRINUSE` sur le port `3000` | Libère le port occupé avant de relancer l’API. |
| `La clé JWT_SECRET est manquante.` | Vérifie le nom de la variable et l’emplacement de `.env`, puis redémarre l’API. |
