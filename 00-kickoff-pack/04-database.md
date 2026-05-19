# 04 — Base de Données

## Choix : PostgreSQL

PostgreSQL est choisi pour sa fiabilité, son support natif des UUIDs, ses contraintes FK solides et sa compatibilité avec Django ORM. Voir ADR-004.

---

## ERD — Entités et Relations

```
┌──────────────────┐
│      Staff       │
│──────────────────│
│ id (UUID) PK     │
│ email (unique)   │
│ nom              │
│ role             │
│ actif            │
└────────┬─────────┘
         │ created_by (FK)
         │
         ▼
┌──────────────────┐       ┌──────────────────┐
│    Paiement      │       │    Ceinture      │
│──────────────────│       │──────────────────│
│ id (UUID) PK     │       │ id (UUID) PK     │
│ membre_id (FK) ──┼──┐    │ membre_id (FK) ──┼──┐
│ date             │  │    │ grade            │  │
│ montant          │  │    │ nom_prof         │  │
│ moyen            │  │    │ date_obtention   │  │
│ note             │  │    │ created_at       │  │
│ created_by (FK)  │  │    └──────────────────┘  │
│ created_at       │  │                          │
└──────────────────┘  │    ┌──────────────────┐  │
                      │    │   Abonnement     │  │
                      │    │──────────────────│  │
                      │    │ id (UUID) PK     │  │
                      └───▶│ membre_id (FK)   │◀─┘
                           │ type             │  │
                      ┌───▶│ date_debut       │  │
                      │    │ nombre_mois      │  │
                      │    │ actif            │  │
                      │    │ created_at       │  │
                      │    │ updated_at       │  │
                      │    └──────────────────┘  │
                      │                          │
              ┌───────┴──────────────────────────┘
              │
              │    ┌──────────────────┐
              │    │     Membre       │
              │    │──────────────────│
              └───▶│ id (UUID) PK     │
                   │ nom              │
                   │ prenom           │
                   │ date_naissance   │
                   │ nationalite      │
                   │ adresse          │
                   │ telephone        │
                   │ email (unique)   │
                   │ instagram        │
                   │ nom_responsable  │
                   │ tel_responsable  │
                   │ date_inscription │
                   │ archive          │
                   │ created_at       │
                   │ updated_at       │
                   └──────┬───────────┘
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
   │   Licence    │  │   Document   │  │  (Ceinture,  │
   │──────────────│  │──────────────│  │ Abonnement,  │
   │ id (UUID) PK │  │ id (UUID) PK │  │  Paiement)   │
   │ membre_id FK │  │ membre_id FK │  └──────────────┘
   │ federation   │  │ type         │
   │ numero       │  │ url_fichier  │
   │ date_exp     │  │ date_upload  │
   │ created_at   │  │ date_exp     │
   └──────────────┘  │ actif        │
                     └──────────────┘
```

---

## Dictionnaire de données

### Table `membres`

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| id | UUID | PK, default uuid4 | Identifiant opaque |
| nom | varchar(100) | NOT NULL | Nom de famille |
| prenom | varchar(100) | NOT NULL | Prénom |
| date_naissance | date | NOT NULL | Sert à calculer est_mineur |
| nationalite | varchar(100) | nullable | |
| adresse | text | NOT NULL | Adresse complète |
| telephone | varchar(20) | NOT NULL | Format +33... |
| email | varchar | NOT NULL, UNIQUE | |
| instagram | varchar(100) | nullable | |
| nom_responsable | varchar(200) | nullable | Obligatoire si mineur (BR-01) |
| tel_responsable | varchar(20) | nullable | Obligatoire si mineur (BR-01) |
| date_inscription | date | auto_now_add | |
| archive | boolean | default False | Soft delete (BR-07) |
| created_at | timestamptz | auto_now_add | |
| updated_at | timestamptz | auto_now | |

**Champ virtuel :** `est_mineur` — calculé depuis `date_naissance`, jamais stocké (BR-01).

### Table `ceintures`

| Colonne | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| membre_id | UUID | FK → membres.id CASCADE |
| grade | enum | blanche/bleue/violette/marron/noire |
| nom_prof | varchar(150) | NOT NULL |
| date_obtention | date | NOT NULL |
| created_at | timestamptz | auto_now_add |

### Table `abonnements`

| Colonne | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| membre_id | UUID | FK → membres.id CASCADE |
| type | enum | mensuel/annuel |
| date_debut | date | NOT NULL |
| nombre_mois | smallint | nullable, rempli si mensuel |
| actif | boolean | Un seul True par membre (BR-04) |
| created_at | timestamptz | auto_now_add |
| updated_at | timestamptz | auto_now |

### Table `licences`

| Colonne | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| membre_id | UUID | FK → membres.id CASCADE |
| federation | enum | CFJJB/FFJDA/FFL |
| numero | varchar(50) | nullable |
| date_expiration | date | NOT NULL, alerte J-30 |
| created_at | timestamptz | auto_now_add |

### Table `paiements`

| Colonne | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| membre_id | UUID | FK → membres.id CASCADE |
| date | date | NOT NULL |
| montant | decimal(8,2) | NOT NULL |
| moyen | enum | cheque/tpe/especes |
| note | text | nullable |
| created_by | UUID | FK → staff.id SET NULL |
| created_at | timestamptz | auto_now_add |

### Table `documents`

| Colonne | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| membre_id | UUID | FK → membres.id CASCADE |
| type | enum | certif_medical/photo_identite/autorisation_parentale/fiche_inscription/reglement |
| url_fichier | text | NOT NULL |
| date_upload | timestamptz | auto_now_add |
| date_expiration | date | nullable, obligatoire pour certif_medical (BR-05) |
| actif | boolean | False = archivé (BR-06) |

### Table `auth_staff_staff`

| Colonne | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| email | varchar | NOT NULL, UNIQUE |
| nom | varchar(150) | NOT NULL |
| role | enum | super_admin/staff |
| actif | boolean | default True |
| password | varchar | hashé Django PBKDF2 |

---

## Anti-patterns évités

- **Pas de table fourre-tout** : chaque entité a sa propre table
- **Pas de valeurs multiples dans une cellule** : les licences sont des lignes, pas un champ CSV
- **IDs UUID, non exposés en séquence** : impossible de deviner l'ID d'un autre membre
- **Soft delete** : `archive = True` sur Membre plutôt que DELETE
- **Statut jamais stocké** : calculé à la volée depuis les données (BR-03)
