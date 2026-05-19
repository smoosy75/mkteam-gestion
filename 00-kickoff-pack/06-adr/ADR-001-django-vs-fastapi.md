# ADR-001 — Backend : Django 5 + DRF plutôt que FastAPI

**Date :** 18 mai 2026
**Statut :** Décidé

---

## Contexte

Choix du framework backend Python pour l'API REST du projet.

## Options considérées

| Critère | Django 5 + DRF | FastAPI |
|---|---|---|
| Maturité | Très mature (2005) | Récent (2018) |
| ORM intégré | ✅ ORM puissant | ❌ SQLAlchemy séparé |
| Admin natif | ✅ Opérationnel en 0 ligne | ❌ À construire |
| Auth intégrée | ✅ AbstractBaseUser | Librairie tierce |
| Async natif | Partiel | ✅ Natif |
| Compétence équipe | ✅ Maîtrisé | Partiel |
| Ecosystème | ✅ Vaste, stable | Croissant |

## Décision

**Django 5 + Django REST Framework**

## Justification

Le projet nécessite un ORM fiable pour des relations complexes (Membre → Paiements → Documents → Ceintures), une admin Django opérationnelle dès le départ pour le staff, et une gestion Auth robuste. L'équipe maîtrise Django. FastAPI apporterait des performances async dont le projet n'a pas besoin à ce stade (club de 50-100 membres).

## Conséquences

- Pas d'async natif pour les endpoints (compensé par Celery pour les tâches longues)
- Gain : admin Django utilisable immédiatement par le staff sans frontend
