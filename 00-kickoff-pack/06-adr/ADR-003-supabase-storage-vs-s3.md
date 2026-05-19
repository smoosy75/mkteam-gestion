# ADR-003 — Stockage fichiers : Supabase Storage plutôt que S3 AWS

**Date :** 18 mai 2026
**Statut :** Décidé

---

## Contexte

Les membres uploadent des documents (certifs médicaux, photos, autorisations parentales) en PDF/JPG/PNG jusqu'à 5 Mo. Il faut un stockage objet fiable, sécurisé, et gratuit pour un usage associatif.

## Options considérées

| Critère | Supabase Storage | AWS S3 | Disque local |
|---|---|---|---|
| Coût | Gratuit (tier associatif) | Payant dès le 1er Go | Gratuit |
| API | S3-compatible (boto3) | Natif S3 | - |
| Sécurité | Row-level policies | IAM | Dépend du serveur |
| Réversibilité | ✅ S3-compatible | ✅ Standard | Faible |
| Setup | Simple | Complexe (IAM, buckets) | Immédiat |

## Décision

**Supabase Storage en production, disque local en développement**

## Justification

Le tier gratuit Supabase couvre largement les besoins d'un club (< 1 Go de documents/an). L'API est S3-compatible via `django-storages` + `boto3` : un seul flag `USE_SUPABASE_STORAGE=True` bascule entre local et prod sans changer une ligne de code métier.

## Risque de lock-in

Faible : l'API S3-compatible permet de migrer vers AWS S3, MinIO ou tout autre provider sans refactoring. Le risque réel est la dépendance au service Supabase pour la disponibilité.

## Conséquences

- `USE_SUPABASE_STORAGE=False` en dev → fichiers dans `backend/media/`
- `USE_SUPABASE_STORAGE=True` en prod → Supabase Storage
- Si Supabase change ses CGU, migration vers MinIO auto-hébergé en < 1 journée
