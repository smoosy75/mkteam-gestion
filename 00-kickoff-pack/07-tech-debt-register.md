# 07 — Registre de Dette Technique

Dettes **assumées volontairement** pour tenir le délai v0 (vendredi 22/05). Chaque entrée documente pourquoi la décision a été prise et quand elle sera remboursée.

---

## DETTE-01 — Pas de contrainte BDD unique sur `abonnements.actif`

**Description :** La règle BR-04 (un seul abonnement actif par membre) est appliquée au niveau service, pas avec une contrainte BDD (`UNIQUE WHERE actif = True`).

**Pourquoi acceptée :** PostgreSQL supporte les partial unique indexes mais Django ORM ne les génère pas nativement. L'ajouter manuellement dans la migration prend du temps et sort du scope v0.

**Risque :** Si deux requêtes simultanées créent deux abonnements actifs, la contrainte n'est pas garantie en BDD.

**Plan de remboursement :** v1 — ajouter un partial unique index via migration manuelle + constraint check dans le service.

---

## DETTE-02 — Relances WhatsApp déclenchées manuellement, pas automatiquement

**Description :** En v0, le staff déclenche les relances WhatsApp via un lien `wa.me` pré-rempli. Les tâches Celery automatiques (J+7, J+15, J+30) ne sont pas implémentées.

**Pourquoi acceptée :** Celery est configuré et prêt. L'implémentation des tâches async est hors scope J-3.

**Risque :** Le staff doit vérifier manuellement les alertes chaque jour.

**Plan de remboursement :** v1 — ajouter `membres/tasks.py` avec les 3 tâches périodiques via Celery Beat.

---

## DETTE-03 — Pas de tests end-to-end

**Description :** Seuls les tests unitaires et d'intégration API sont prévus pour v0. Pas de tests Playwright/Cypress sur le frontend.

**Pourquoi acceptée :** Le frontend est en cours de développement, les tests E2E sont pertinents quand les parcours sont stables.

**Risque :** Régressions UI non détectées automatiquement.

**Plan de remboursement :** v1 — Playwright sur les 2 parcours critiques (inscription + validation staff).

---

## DETTE-04 — Pas de déploiement prod automatisé

**Description :** `docker-compose.prod.yml` est prêt pour Railway mais le déploiement n'est pas automatisé via CI/CD.

**Pourquoi acceptée :** Hors scope du MVP académique.

**Plan de remboursement :** v1 — GitHub Actions `deploy` job sur merge vers `main`.

---

## DETTE-05 — Frontend minimal, UX non optimisée

**Description :** Le portail admin v0 est fonctionnel mais non designé. Les composants shadcn/ui sont installés mais les vues sont basiques.

**Pourquoi acceptée :** La priorité v0 est la fiabilité du backend et la complétude des données, pas l'UX.

**Plan de remboursement :** v1 — itération UX avec retours du staff du club.
