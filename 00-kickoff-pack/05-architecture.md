# 05 — Architecture

## Schéma des composants

```
[Navigateur membre]          [Navigateur staff]
       │                            │
       │ HTTPS                      │ HTTPS
       ▼                            ▼
┌──────────────────────────────────────────┐
│           Next.js 15 :3000               │
│  App Router · TypeScript · Tailwind      │
│  /inscription (public)                   │
│  /admin/** (staff authentifié)           │
└──────────────────┬───────────────────────┘
                   │ REST JSON (JWT)
                   ▼
┌──────────────────────────────────────────┐
│           Django 5 DRF :8000             │
│  ViewSets → Serializers → Services       │
│  JWT auth · Rate limiting · CORS         │
└──────┬──────────────────────┬────────────┘
       │                      │
       ▼                      ▼
┌─────────────┐     ┌─────────────────────┐
│ PostgreSQL  │     │        Redis        │
│ :5432       │     │  :6379              │
│ données     │     │  broker Celery      │
└─────────────┘     └─────────┬───────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Celery Worker     │
                    │  tâches async       │
                    │  (relances WhatsApp)│
                    └─────────────────────┘
                               │
[Fichiers membres]             │
       │                       │
       ▼                       ▼
┌─────────────────────────────────────────┐
│  Supabase Storage (prod) /              │
│  Disque local media/ (dev)              │
└─────────────────────────────────────────┘
```

---

## Séparation des couches (backend)

| Couche | Fichier | Responsabilité |
|---|---|---|
| **Views** | `*/views.py` | Reçoit HTTP, délègue, retourne réponse |
| **Serializers** | `*/serializers.py` | Valide les données entrantes et sortantes |
| **Services** | `*/services.py` | Contient toutes les règles métier |
| **Models** | `*/models.py` | Définit les entités et relations BDD uniquement |

**Règle :** aucun `Model.objects.filter()` dans une view. Tout accès BDD passe par le service.

---

## Sécurité

| Réflexe | Statut | Implémentation |
|---|---|---|
| Secrets en variables d'env | ✅ | `.env` + `python-decouple` |
| Mots de passe hashés | ✅ | Django PBKDF2 (AbstractBaseUser) |
| Auth JWT | ✅ | `djangorestframework-simplejwt` |
| Rate limiting | ✅ | DRF throttling : 30/h anon, 1000/h user |
| CORS configuré | ✅ | `django-cors-headers`, origines explicites |
| Protection SQL injection | ✅ | Django ORM (prepared statements) |
| Validation input serveur | 🔄 | Serializers DRF (en cours) |
| HTTPS (prod) | ⚠️ | À configurer Railway |
| IDOR (vérif autorisation ressource) | 🔄 | Permissions DRF (en cours) |
| XSS | ✅ | Échappement React natif côté frontend |

---

## RGPD — données personnelles stockées

| Donnée | Table | Durée de conservation |
|---|---|---|
| Nom, prénom, date de naissance | membres | Durée adhésion + 5 ans (archive) |
| Adresse, téléphone, email | membres | Durée adhésion + 5 ans |
| Photo d'identité | documents | Durée adhésion |
| Certif médical | documents | 1 an (date expiration) |
| Historique paiements | paiements | 10 ans (obligation comptable) |
| Nom/tél responsable légal | membres | Durée adhésion du mineur |

---

## Observabilité (minimal v0)

- Logs Django structurés via `logging` standard
- Logs Celery via `celery -A config worker -l info`
- CI GitHub Actions : build cassé = alerte immédiate

---

## Scalabilité prévue

**v0 :** mono-club, architecture simple.

**v2 (multi-club) :** ajout d'un modèle `Club` + FK `club_id` sur `Membre` et `Staff` + manager Django filtrant automatiquement par club. L'architecture actuelle supporte cette migration sans refactoring majeur. Voir ADR-005.
