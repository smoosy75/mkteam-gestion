import pytest
from datetime import date, timedelta
from rest_framework.test import APIClient

from auth_staff.models import Staff
from membres.models import Abonnement, Ceinture, Document, Membre
from membres.services import get_statut_membre

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def staff(db):
    return Staff.objects.create_user(
        email="staff@mkteam.fr",
        nom="Dupont",
        password="motdepasse123",
    )


@pytest.fixture
def auth_client(client, staff):
    response = client.post(
        "/api/auth/login/",
        {"email": "staff@mkteam.fr", "password": "motdepasse123"},
    )
    token = response.data["access"]
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    return client


@pytest.fixture
def membre_majeur(db):
    return Membre.objects.create(
        nom="Martin",
        prenom="Jean",
        date_naissance=date(1990, 1, 1),
        adresse="1 rue de la Paix, Paris",
        telephone="+33600000001",
        email="jean.martin@test.fr",
    )


@pytest.fixture
def membre_mineur(db):
    return Membre.objects.create(
        nom="Petit",
        prenom="Luc",
        date_naissance=date.today() - timedelta(days=365 * 15),
        adresse="2 rue du Test, Paris",
        telephone="+33600000002",
        email="luc.petit@test.fr",
        nom_responsable="Marie Petit",
        tel_responsable="+33600000003",
    )


@pytest.fixture
def membre_avec_dossier_complet(db, staff):
    m = Membre.objects.create(
        nom="Actif",
        prenom="Pierre",
        date_naissance=date(1995, 6, 15),
        adresse="3 rue Active, Paris",
        telephone="+33600000004",
        email="pierre.actif@test.fr",
        dossier_valide=True,
    )
    Abonnement.objects.create(
        membre=m,
        type=Abonnement.Type.MENSUEL,
        date_debut=date.today() - timedelta(days=10),
        nombre_mois=1,
        actif=True,
    )
    Document.objects.create(
        membre=m,
        type=Document.Type.CERTIF_MEDICAL,
        url_fichier="https://storage/certif.pdf",
        date_expiration=date.today() + timedelta(days=300),
        actif=True,
    )
    Document.objects.create(
        membre=m,
        type=Document.Type.PHOTO_IDENTITE,
        url_fichier="https://storage/photo.jpg",
        actif=True,
    )
    Document.objects.create(
        membre=m,
        type=Document.Type.REGLEMENT,
        url_fichier="https://storage/reglement.pdf",
        actif=True,
    )
    return m


@pytest.fixture
def membre_certif_expire(db):
    m = Membre.objects.create(
        nom="Suspendu",
        prenom="Ali",
        date_naissance=date(1998, 3, 10),
        adresse="4 rue Expire, Paris",
        telephone="+33600000005",
        email="ali.suspendu@test.fr",
        dossier_valide=True,
    )
    Abonnement.objects.create(
        membre=m,
        type=Abonnement.Type.MENSUEL,
        date_debut=date.today() - timedelta(days=10),
        nombre_mois=1,
        actif=True,
    )
    Document.objects.create(
        membre=m,
        type=Document.Type.CERTIF_MEDICAL,
        url_fichier="https://storage/certif_old.pdf",
        date_expiration=date.today() - timedelta(days=5),
        actif=True,
    )
    Document.objects.create(
        membre=m,
        type=Document.Type.PHOTO_IDENTITE,
        url_fichier="https://storage/photo.jpg",
        actif=True,
    )
    Document.objects.create(
        membre=m,
        type=Document.Type.REGLEMENT,
        url_fichier="https://storage/reglement.pdf",
        actif=True,
    )
    return m


# ---------------------------------------------------------------------------
# Tests inscription (public)
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestInscription:
    def test_inscription_majeur_valide(self, client):
        payload = {
            "nom": "Durand",
            "prenom": "Sophie",
            "date_naissance": "1995-03-15",
            "adresse": "5 rue Test, Paris",
            "telephone": "+33611111111",
            "email": "sophie.durand@test.fr",
            "type_abonnement": "mensuel",
            "date_debut": str(date.today()),
            "nombre_mois": 1,
        }
        response = client.post("/api/inscription/", payload, format="json")
        assert response.status_code == 201
        assert Membre.objects.filter(email="sophie.durand@test.fr").exists()
        assert Abonnement.objects.filter(membre__email="sophie.durand@test.fr").exists()

    def test_inscription_mineur_sans_responsable_rejete(self, client):
        payload = {
            "nom": "Junior",
            "prenom": "Tom",
            "date_naissance": str(date.today() - timedelta(days=365 * 14)),
            "adresse": "6 rue Jeune, Paris",
            "telephone": "+33622222222",
            "email": "tom.junior@test.fr",
            "type_abonnement": "mensuel",
            "date_debut": str(date.today()),
            "nombre_mois": 1,
        }
        response = client.post("/api/inscription/", payload, format="json")
        assert response.status_code == 400
        assert "nom_responsable" in str(response.data)

    def test_inscription_mineur_avec_responsable_valide(self, client):
        payload = {
            "nom": "Junior",
            "prenom": "Tom",
            "date_naissance": str(date.today() - timedelta(days=365 * 14)),
            "adresse": "6 rue Jeune, Paris",
            "telephone": "+33622222222",
            "email": "tom.junior@test.fr",
            "nom_responsable": "Julie Junior",
            "tel_responsable": "+33633333333",
            "type_abonnement": "mensuel",
            "date_debut": str(date.today()),
            "nombre_mois": 1,
        }
        response = client.post("/api/inscription/", payload, format="json")
        assert response.status_code == 201

    def test_inscription_mensuel_sans_nombre_mois_rejete(self, client):
        payload = {
            "nom": "Test",
            "prenom": "User",
            "date_naissance": "1990-01-01",
            "adresse": "7 rue Test, Paris",
            "telephone": "+33644444444",
            "email": "test.user@test.fr",
            "type_abonnement": "mensuel",
            "date_debut": str(date.today()),
        }
        response = client.post("/api/inscription/", payload, format="json")
        assert response.status_code == 400

    def test_inscription_sans_auth_possible(self, client):
        """Le formulaire public ne nécessite pas de JWT."""
        payload = {
            "nom": "Public",
            "prenom": "User",
            "date_naissance": "1988-05-20",
            "adresse": "8 rue Publique, Paris",
            "telephone": "+33655555555",
            "email": "public.user@test.fr",
            "type_abonnement": "annuel",
            "date_debut": str(date.today()),
        }
        response = client.post("/api/inscription/", payload, format="json")
        assert response.status_code == 201


# ---------------------------------------------------------------------------
# Tests statut membre (service)
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestStatutMembre:
    def test_statut_en_attente_dossier_incomplet(self, membre_majeur):
        assert get_statut_membre(membre_majeur) == "EN_ATTENTE"

    def test_statut_actif_dossier_complet(self, membre_avec_dossier_complet):
        assert get_statut_membre(membre_avec_dossier_complet) == "ACTIF"

    def test_statut_suspendu_certif_expire(self, membre_certif_expire):
        assert get_statut_membre(membre_certif_expire) == "SUSPENDU"

    def test_statut_ancien_si_archive(self, membre_majeur):
        membre_majeur.archive = True
        membre_majeur.save()
        assert get_statut_membre(membre_majeur) == "ANCIEN"

    def test_est_mineur_calcule(self, membre_mineur):
        assert membre_mineur.est_mineur is True

    def test_est_majeur_calcule(self, membre_majeur):
        assert membre_majeur.est_mineur is False


# ---------------------------------------------------------------------------
# Tests API membres (staff)
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestMembreAPI:
    def test_liste_membres(self, auth_client, membre_majeur):
        response = auth_client.get("/api/membres/")
        assert response.status_code == 200
        assert len(response.data) >= 1

    def test_fiche_membre(self, auth_client, membre_avec_dossier_complet):
        url = f"/api/membres/{membre_avec_dossier_complet.id}/"
        response = auth_client.get(url)
        assert response.status_code == 200
        assert response.data["statut"] == "ACTIF"
        assert "documents" in response.data
        assert "ceintures" in response.data

    def test_archiver_membre(self, auth_client, membre_majeur):
        url = f"/api/membres/{membre_majeur.id}/archiver/"
        response = auth_client.patch(url)
        assert response.status_code == 200
        membre_majeur.refresh_from_db()
        assert membre_majeur.archive is True

    def test_add_ceinture(self, auth_client, membre_majeur):
        url = f"/api/membres/{membre_majeur.id}/ceintures/"
        payload = {
            "grade": "blanche",
            "nom_prof": "Karim B.",
            "date_obtention": str(date.today()),
        }
        response = auth_client.post(url, payload, format="json")
        assert response.status_code == 201
        assert Ceinture.objects.filter(membre=membre_majeur).count() == 1

    def test_alertes(self, auth_client, membre_certif_expire):
        response = auth_client.get("/api/alertes/")
        assert response.status_code == 200
        assert "certifs_expires" in response.data
        assert "certifs_bientot" in response.data
        assert "membres_suspendus" in response.data
