# ADR-002 — Statut membre calculé à la volée, jamais stocké

**Date :** 18 mai 2026
**Statut :** Décidé

---

## Contexte

Le statut d'un membre (ACTIF / EN_ATTENTE / SUSPENDU / ANCIEN) dépend de plusieurs données : complétude du dossier, validité du certif médical, retard de paiement, archivage. Deux approches possibles : stocker le statut en BDD ou le calculer à la demande.

## Options considérées

**Option A — Colonne `statut` stockée**
- Avantage : requêtes filtrées directement (`WHERE statut = 'ACTIF'`)
- Risque : désynchronisme si on oublie de mettre à jour le statut après un paiement ou un certif

**Option B — Calcul à la volée (fonction pure)**
- Avantage : source de vérité unique, impossible d'avoir un statut "périmé"
- Risque : légèrement moins performant (calcul à chaque requête)

## Décision

**Option B — Calcul à la volée**

## Justification

Pour un club de 50-100 membres, la performance n'est pas un enjeu. En revanche, la fiabilité l'est : un certif qui expire la nuit doit changer le statut sans action humaine. Stocker le statut obligerait soit une tâche Celery de synchronisation (point de défaillance), soit une discipline parfaite dans chaque endpoint (risque d'oubli).

## Conséquences

- Implémenté dans `backend/membres/services.py::get_statut_membre()`
- Si les volumes augmentent (1000+ membres), on peut ajouter un champ `statut_cache` invalidé à chaque modification
