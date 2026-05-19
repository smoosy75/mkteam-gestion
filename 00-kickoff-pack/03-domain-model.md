# 03 — Modèle Métier

## Rôles (RBAC)

| Rôle | Description |
|---|---|
| `super_admin` | Accès total : gestion du staff, configuration |
| `staff` | Gestion des membres, paiements, ceintures, documents |

### Matrice des permissions

| Action | super_admin | staff |
|---|---|---|
| Voir la liste des membres | ✅ | ✅ |
| Valider / refuser un dossier | ✅ | ✅ |
| Enregistrer un paiement | ✅ | ✅ |
| Saisir une ceinture | ✅ | ✅ |
| Créer un compte staff | ✅ | ❌ |
| Archiver un membre | ✅ | ✅ |
| Voir le portail admin | ✅ | ✅ |

---

## Règles Métier

**BR-01** — Un membre est considéré mineur si sa date de naissance implique un âge < 18 ans au moment du calcul (calculé à la volée, jamais stocké).

**BR-02** — Si un membre est mineur, les champs `nom_responsable` et `tel_responsable` sont obligatoires, et le document `autorisation_parentale` est requis.

**BR-03** — Le statut d'un membre est calculé à la volée à partir de ses données, jamais stocké en base. Cela évite tout désynchronisme.

**BR-04** — Un seul abonnement peut être `actif = True` par membre à un instant donné.

**BR-05** — Le document `certif_medical` doit obligatoirement avoir une `date_expiration` renseignée. Un certif sans date d'expiration est considéré comme invalide.

**BR-06** — Quand un nouveau certif médical est uploadé, l'ancien passe à `actif = False` (archivé). Seul le certif actif compte pour le calcul du statut.

**BR-07** — Un paiement ne peut pas être supprimé, seulement annoté (champ `note`). L'historique est immuable.

**BR-08** — Le dossier est considéré complet quand les documents suivants sont présents et actifs : `certif_medical`, `photo_identite`, `reglement`. Pour un mineur : + `autorisation_parentale`.

---

## Machine à États — Statut Membre

```
                    ┌─────────────┐
    [Soumission]    │  EN_ATTENTE │
    ──────────────▶ │             │
                    └──────┬──────┘
                           │ dossier complet
                           │ + paiement confirmé
                           │ + certif valide
                           ▼
                    ┌─────────────┐
                    │    ACTIF    │◀─────────────────┐
                    └──────┬──────┘                  │
                           │                         │ régularisation
                    ┌──────┴──────────────────┐      │
                    │                         │      │
              certif expiré            retard > 30j  │
                    │                         │      │
                    ▼                         ▼      │
                    ┌─────────────────────────┐      │
                    │        SUSPENDU         │──────┘
                    └─────────────────────────┘
                           │
                    archivage manuel
                           │
                           ▼
                    ┌─────────────┐
                    │    ANCIEN   │
                    └─────────────┘
```

### Transitions

| De | Vers | Condition |
|---|---|---|
| EN_ATTENTE | ACTIF | Dossier complet + certif valide + paiement initial |
| EN_ATTENTE | EN_ATTENTE | Dossier incomplet ou refusé (reste en attente) |
| ACTIF | SUSPENDU | Certif expiré OU retard paiement > 30 jours |
| SUSPENDU | ACTIF | Certif renouvelé ET paiement régularisé |
| ACTIF / SUSPENDU | ANCIEN | Archivage manuel par le staff |

---

## Algorithme de calcul du statut

```python
def get_statut_membre(membre):
    if membre.archive:
        return "ANCIEN"
    if not dossier_complet(membre):
        return "EN_ATTENTE"
    if certif_expire(membre):
        return "SUSPENDU"
    if jours_retard(membre) > 30:
        return "SUSPENDU"
    return "ACTIF"
```

Implémenté dans `backend/membres/services.py`.
