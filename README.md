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
