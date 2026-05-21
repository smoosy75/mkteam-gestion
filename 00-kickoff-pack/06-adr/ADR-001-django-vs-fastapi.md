# ADR-001 — Backend : Django 5 + DRF

**Date :** 18 mai 2026
**Statut :** Décidé

---

## Contexte

Choix du framework backend Python pour l'API REST du projet.

## Options considérées

| Critère           | Django 5 + DRF          |
| ----------------- | ----------------------- |
| Maturité          | Très mature (2005)      |
| ORM intégré       | ORM puissant            |
| Admin natif       | Opérationnel en 0 ligne |
| Auth intégrée     | AbstractBaseUser        |
| Async natif       | Partiel                 |
| Compétence équipe | Maîtrisé                |

## Décision

**Django 5 + Django REST Framework**

## Justification

Le projet nécessite un ORM fiable pour des relations complexes (Membre → Paiements → Documents → Ceintures), une admin Django opérationnelle dès le départ pour le staff, et une gestion Auth robuste. L'équipe maîtrise Django. FastAPI apporterait des performances async dont le projet n'a pas besoin à ce stade (club de 50-100 membres).

## Conséquences

- Pas d'async natif pour les endpoints (compensé par Celery pour les tâches longues)
- Gain : admin Django utilisable immédiatement par le staff sans frontend
