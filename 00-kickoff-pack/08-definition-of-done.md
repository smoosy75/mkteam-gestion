# 08 — Definition of Done

Checklist de cadrage signée avant la première ligne de code métier.

---

## Cadrage

- [x] Brief 1 page rédigé (problème ≠ idée ≠ solution) → `01-project-brief.md`
- [x] User stories priorisées en MoSCoW (Must < 60%) → `02-product-scope.md`
- [x] MVP clairement défini avec liste IN / OUT explicite → `02-product-scope.md`
- [x] Definition of Done du MVP rédigée → `02-product-scope.md`

## Modèle métier

- [x] Rôles RBAC structurés (super_admin / staff) → `03-domain-model.md`
- [x] Règles métier numérotées (BR-01 à BR-08) → `03-domain-model.md`
- [x] Machine à états dessinée pour le statut membre → `03-domain-model.md`

## Base de données

- [x] ERD dessiné avec toutes les relations → `04-database.md`
- [x] Dictionnaire de données complet → `04-database.md`
- [x] `created_at` / `updated_at` sur toutes les tables → models Django
- [x] Soft delete (`archive`) sur `Membre` → `membres/models.py`
- [x] Clés étrangères avec CASCADE → migrations Django
- [x] IDs UUID, non auto-incrémentés, non exposés en séquence → models
- [x] Anti-patterns documentés et évités → `04-database.md`
- [x] Migrations versionnées → `*/migrations/0001_initial.py`

## Architecture

- [x] Schéma composants dessiné → `05-architecture.md`
- [x] Séparation 3 couches (Views / Serializers / Services) → `05-architecture.md`
- [x] Règles métier dans services.py, pas dans views → `membres/services.py`
- [x] RBAC documenté avec matrice → `03-domain-model.md`

## Sécurité

- [x] Secrets en variables d'env → `.env.example` + `python-decouple`
- [x] Mots de passe hashés → Django PBKDF2 (AbstractBaseUser)
- [x] Auth JWT → `djangorestframework-simplejwt`
- [x] Rate limiting → DRF throttling configuré
- [x] CORS explicite → `django-cors-headers`
- [x] Protection SQL injection → Django ORM
- [x] Inventaire données RGPD → `05-architecture.md`

## Infrastructure

- [x] Dockerfile fonctionnel (backend + frontend) → `*/Dockerfile`
- [x] `docker-compose.yml` dev complet (5 services) → `docker-compose.yml`
- [x] Multi-stage build frontend → `frontend/Dockerfile`
- [x] `.env.example` fourni → `.env.example`
- [x] Hot reload en dev → volumes Docker
- [x] Image prod séparée → `docker-compose.prod.yml`

## CI/CD

- [x] Lint auto sur push (flake8 + black + eslint) → `.github/workflows/ci.yml`
- [x] Tests auto sur push (pytest + vraie PostgreSQL) → `.github/workflows/ci.yml`
- [x] Build frontend auto → `.github/workflows/ci.yml`

## Décisions documentées

- [x] ADR-001 : Django vs FastAPI → `06-adr/`
- [x] ADR-002 : Statut calculé vs stocké → `06-adr/`
- [x] ADR-003 : Supabase Storage vs S3 → `06-adr/`

## Dette technique

- [x] Registre de dette documenté → `07-tech-debt-register.md`
- [x] Chaque dette a un plan de remboursement daté

## Documentation

- [x] README avec quick start < 5 min → `README.md`
- [x] Variables d'env documentées → `.env.example` + README
- [x] Structure des dossiers documentée → README
