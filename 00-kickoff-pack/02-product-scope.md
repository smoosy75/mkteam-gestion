# 02 — Product Scope & MVP

## User Stories (MoSCoW)

### Must Have (MVP v0)

- En tant que **membre**, je veux remplir un formulaire de pré-inscription en ligne afin de soumettre mon dossier sans me déplacer.
- En tant que **staff**, je veux recevoir une notification quand un dossier est soumis afin de le traiter rapidement.
- En tant que **staff**, je veux valider ou refuser un dossier membre afin de confirmer l'inscription.
- En tant que **staff**, je veux enregistrer un paiement reçu (espèces / chèque / TPE) avec le montant et la date afin de tracer les encaissements.
- En tant que **staff**, je veux voir la liste de tous les membres avec leur statut (ACTIF / EN_ATTENTE / SUSPENDU) afin d'avoir une vue globale du club.
- En tant que **staff**, je veux voir les certifs médicaux qui expirent dans moins de 30 jours afin d'anticiper les relances.
- En tant que **staff**, je veux enregistrer la ceinture d'un membre (grade + prof + date) afin de tracer sa progression.
- En tant que **staff**, je veux me connecter avec email + mot de passe afin d'accéder au portail sécurisé.

### Should Have (v1)

- En tant que **staff**, je veux envoyer une relance WhatsApp pré-remplie en un clic afin de relancer un paiement sans saisir le message.
- En tant que **staff**, je veux voir l'historique complet des paiements d'un membre afin de répondre à une contestation.
- En tant que **staff**, je veux gérer les licences fédérales (CFJJB / FFJDA / FFL) d'un membre afin de suivre les renouvellements.

### Could Have (v1+)

- En tant que **membre**, je veux accéder à un portail personnel afin de consulter mon statut et mes paiements.
- En tant que **staff**, je veux exporter la liste des membres en CSV afin de la partager avec la fédération.

### Won't Have (hors scope)

- Paiement en ligne (Stripe)
- Pointage des séances
- Gestion des compétitions
- Application mobile native
- Multi-club / SaaS

---

## MVP — Scope IN / OUT

### IN (livré vendredi 22/05)

- Formulaire public pré-inscription (sans compte membre)
- Portail admin avec authentification JWT
- Liste membres avec statuts calculés à la volée
- Fiche membre : documents, paiements, ceintures
- Action : valider / refuser un dossier
- Action : enregistrer un paiement
- Action : saisir une ceinture
- Alertes certifs expirants (badge J-30 / expirés)
- Détection automatique des mineurs + champs responsable légal

### OUT (volontaire, documenté)

- Relances WhatsApp automatiques via Celery (tâche async)
- Portail self-service membre
- Licences fédérales (modèle prêt, UI non faite)
- Déploiement prod Railway
- Tests end-to-end

---

## Definition of Done du MVP

Le MVP est terminé quand :

- [ ] `git clone + docker compose up` lance le projet sans erreur sur une machine vierge
- [ ] Un nouveau membre peut soumettre le formulaire depuis son téléphone
- [ ] Le staff voit ce nouveau dossier en statut EN_ATTENTE
- [ ] Le staff peut valider le dossier → statut passe à ACTIF
- [ ] Le staff peut enregistrer un paiement pour ce membre
- [ ] La CI GitHub Actions est verte sur `main`
- [ ] Le README permet de lancer le projet en moins de 5 minutes
