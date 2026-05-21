from datetime import date

from membres.models import Abonnement, Document, Membre


def get_statut_membre(membre: Membre) -> str:
    if membre.archive:
        return "ANCIEN"
    if not (membre.dossier_valide or _dossier_complet(membre)):
        return "EN_ATTENTE"
    if _certif_expire(membre):
        return "SUSPENDU"
    if _jours_retard(membre) > 30:
        return "SUSPENDU"
    return "ACTIF"


def _dossier_complet(membre: Membre) -> bool:
    requis = {
        Document.Type.CERTIF_MEDICAL,
        Document.Type.PHOTO_IDENTITE,
        Document.Type.REGLEMENT,
    }
    if membre.est_mineur:
        requis.add(Document.Type.AUTORISATION_PARENTALE)
    actifs = set(membre.documents.filter(actif=True).values_list("type", flat=True))
    return requis.issubset(actifs)


def _certif_expire(membre: Membre) -> bool:
    certif = membre.documents.filter(
        type=Document.Type.CERTIF_MEDICAL, actif=True
    ).first()
    if not certif or not certif.date_expiration:
        return True
    return certif.date_expiration < date.today()


def _jours_retard(membre: Membre) -> int:
    abonnement = membre.abonnements.filter(actif=True).first()
    if not abonnement:
        return 0
    dernier = membre.paiements.order_by("-date").first()
    reference = dernier.date if dernier else abonnement.date_debut
    intervalle = 365 if abonnement.type == Abonnement.Type.ANNUEL else 30
    retard = (date.today() - reference).days - intervalle
    return max(0, retard)
