# MK Team Paris — Logiciel de gestion JJB

Outil interne pour un club de Jiu-Jitsu Brésilien parisien : centralise les fiches membres, trace les paiements en espèces/chèque/TPE, alerte sur les certifs médicaux expirés et suit la progression des ceintures.

**Conception complète → [`00-kickoff-pack/`](00-kickoff-pack/)**

---

## MVP v0 —   

| Fonctionnalité | État |
|---|---|
| Formulaire public pré-inscription (sans compte) | ✅ modèles prêts |
| Validation du dossier par le staff | ✅ modèles prêts |
| Calcul du statut membre à la volée (ACTIF / EN_ATTENTE / SUSPENDU / ANCIEN) | ✅ service.py |
| Enregistrement paiement (chèque / TPE / espèces) | ✅ modèles prêts |
| Suivi des ceintures (grade + prof + date) | ✅ modèles prêts |
| Alertes certifs médicaux expirants (J-30 / expirés) | ✅ modèles prêts |
| Gestion mineurs avec contact parental | ✅ détection auto |
| Auth staff JWT (email + password) | ✅ configuré |
| API REST (serializers + endpoints) | ✅ livré |
| Portail admin frontend | ✅ livré |

## Hors scope v0  

- Paiement en ligne Stripe   
- Portail self-service membre  
- Relances WhatsApp automatiques (Celery tasks)  
- Multi-club / SaaS    
- Application mobile   

---

## Démarrage en 5 minutes

**Prérequis :** Docker + Docker Compose

```bash
git clone https://github.com/smoosy75/mkteam-gestion.git
cd mkteam-gestion

cp .env.example .env

docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| API Django | http://localhost:8000 |
| Admin Django | http://localhost:8000/django-admin/ |

---

## Workflow complet — de l'inscription à l'adhésion active

### Étape 1 — Créer un compte staff (une seule fois)

```bash
docker exec -it projettechniquemk1-django-1 \
  python manage.py shell -c "
from auth_staff.models import Staff
Staff.objects.create_superuser(
    email='admin@mkteam.fr',
    nom='Dupont',
    password='motdepasse123'
)
print('Staff créé.')
"
```

### Étape 2 — Le futur membre remplit le formulaire public

Ouvrir **http://localhost:3000/inscription**

- Remplir nom, prénom, date de naissance, contact
- Si mineur détecté automatiquement → champs responsable légal apparaissent
- Choisir catégorie + mode de paiement
- Soumettre → statut passe à **EN_ATTENTE**

### Étape 3 — Se connecter au portail staff

Ouvrir **http://localhost:3000/admin/login**

Saisir les identifiants créés à l'étape 1.

### Étape 4 — Dashboard : voir les dossiers en attente

Le dashboard affiche immédiatement :

- **En attente de validation** — membres qui ont soumis le formulaire mais dont le dossier est incomplet
- **Suspendus** — membres avec certif expiré ou paiement en retard
- **Alertes certifs** — expirations à venir dans les 30 jours

Cliquer sur un membre pour ouvrir sa fiche.

### Étape 5 — Envoyer le lien de dépôt de documents

Dans la fiche membre (statut **EN_ATTENTE**) :

1. Cliquer **"Envoyer lien documents"**
2. Le membre reçoit un email avec un lien valable 7 jours
3. Le bouton passe en grisé — lien déjà envoyé

> En dev, configurer `EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'`
> dans `settings.py` pour voir l'email dans les logs Docker au lieu de l'envoyer.

### Étape 6 — Le membre dépose ses documents

Le membre ouvre le lien reçu par email → **http://localhost:3000/upload/\<token\>**

Documents requis :
- Photo d'identité
- Certificat médical (validité 1 an auto)
- Règlement intérieur (case à cocher)
- Autorisation parentale (si mineur)

Une fois envoyés, le lien est invalidé (usage unique).

### Étape 7 — Valider le dossier

Dans la fiche membre, vérifier les documents via **"Voir"** sur chaque ligne.

- Dossier complet → statut passe automatiquement à **ACTIF**
- Dossier incomplet → cliquer **"Valider le dossier"** pour forcer la validation manuellement

### Étape 8 — Enregistrer le premier paiement

Dans la fiche membre, section **"Enregistrer un paiement"** :

- Saisir date, montant, moyen (espèces / chèque / TPE)
- Ajouter une note optionnelle (ex : "Chèque n°12345")
- L'historique des paiements s'affiche en dessous

### Étape 9 (optionnel) — Saisir une ceinture

Dans la fiche membre, section **"Ceintures"** :

- Choisir grade (blanche → noire)
- Nom du professeur + date d'obtention
- La ceinture actuelle s'affiche en tête de liste

---

### Récapitulatif des statuts

| Statut | Condition |
|---|---|
| **EN_ATTENTE** | Dossier incomplet (documents manquants) |
| **ACTIF** | Dossier complet + certif valide + paiement à jour |
| **SUSPENDU** | Certif expiré OU retard de paiement > 30 jours |
| **ANCIEN** | Membre archivé manuellement |

---

## Stack

```
Next.js 15 (App Router)s· Django 5 · PostgreSQL 16 · Redis 7 · Celery · Docker · JWT · Supabase Storage (prod)
```

---

## Structure du projet

```
mkteam-gestion/
├── 00-kickoff-pack/          ← conception complète (brief, scope, BDD, archi, ADR...)
├── backend/                  ← Django 5 + DRF
│   ├── auth_staff/           ← modèle Staff custom (email login, rôles)
│   ├── membres/              ← Membre, Ceinture, Abonnement, Licence, Document + services
│   ├── paiements/            ← Paiement
│   └── config/               ← settings, URLs, Celery
├── frontend/                 ← Next.js 15 App Router
├── docker-compose.yml        ← dev (hot reload)
├── docker-compose.prod.yml   ← prod (Railway)
└── .env.example
```

---

## Variables d'environnement

Copier `.env.example` en `.env`.

| Variable | Description | Défaut dev |
|---|---|---|
| `SECRET_KEY` | Clé secrète Django | insecure-change-me |
| `DEBUG` | Mode debug | `True` |
| `POSTGRES_DB` | Nom BDD | `mkteam` |
| `POSTGRES_USER` | User PostgreSQL | `mkteam` |
| `POSTGRES_PASSWORD` | Mot de passe | `mkteam` |
| `POSTGRES_HOST` | Hôte | `postgres` |
| `REDIS_URL` | URL Redis | `redis://redis:6379/0` |
| `NEXT_PUBLIC_API_URL` | URL API côté client | `http://localhost:8000` |
| `CORS_ALLOWED_ORIGINS` | Origines autorisées | `http://localhost:3000` |
| `USE_SUPABASE_STORAGE` | Activer Supabase (prod) | `False` |

---

## Développement

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Frontend
cd frontend
npm install
npm run dev
```

---

## Tests

### Backend

Les tests nécessitent PostgreSQL et Redis. Le plus simple est de les lancer via Docker Compose (les services sont déjà up) :

```bash
# Depuis la racine du projet — services Docker déjà lancés
docker exec projettechniquemk1-django-1 pytest
```

Ou en local avec un venv (PostgreSQL et Redis doivent tourner) :

```bash
cd backend
source .venv/bin/activate

# Variables requises
export SECRET_KEY=test-secret-key
export DEBUG=True
export POSTGRES_DB=mkteam
export POSTGRES_USER=mkteam
export POSTGRES_PASSWORD=mkteam
export POSTGRES_HOST=localhost
export REDIS_URL=redis://localhost:6379/0

pytest
```

Résultat attendu :

```
collected 27 items
auth_staff/tests.py ...... [ 22%]
membres/tests.py ............... [ 77%]
paiements/tests.py ...... [100%]
27 passed in Xs
```

### Ce que couvrent les tests

| Fichier | Cas testés |
|---|---|
| `auth_staff/tests.py` | Login valide/invalide, accès protégé, refresh token |
| `membres/tests.py` | Inscription majeur/mineur, statut calculé, API membres, alertes |
| `paiements/tests.py` | Enregistrement paiement, validation montant/moyen, accès non authentifié |

### Lint

```bash
cd backend
source .venv/bin/activate

# Vérification
flake8 . --exclude=.venv,migrations
black --check . --exclude='.venv|migrations'

# Correction automatique
black . --exclude='.venv|migrations'
```

```bash
cd frontend
npm run lint
```

---

## CI/CD

GitHub Actions sur chaque push/PR vers `main` ou `develop` :

| Job | Ce qu'il fait |
|---|---|
| `lint-backend` | flake8 + black |
| `test-backend` | pytest avec vraie PostgreSQL + Redis |
| `lint-frontend` | eslint |
| `build-frontend` | next build |
