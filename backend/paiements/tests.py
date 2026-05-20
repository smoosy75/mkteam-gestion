import pytest
from datetime import date

from rest_framework.test import APIClient

from auth_staff.models import Staff
from membres.models import Membre
from paiements.models import Paiement


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
def membre(db):
    return Membre.objects.create(
        nom="Leblanc",
        prenom="Sara",
        date_naissance=date(1993, 7, 22),
        adresse="10 rue du Test, Paris",
        telephone="+33677777777",
        email="sara.leblanc@test.fr",
    )


@pytest.mark.django_db
class TestPaiement:
    def test_enregistrer_paiement_cheque(self, auth_client, staff, membre):
        url = f"/api/membres/{membre.id}/paiements/"
        payload = {
            "date": str(date.today()),
            "montant": "80.00",
            "moyen": "cheque",
            "note": "Chèque n°12345",
        }
        response = auth_client.post(url, payload, format="json")
        assert response.status_code == 201
        assert Paiement.objects.filter(membre=membre).count() == 1
        p = Paiement.objects.get(membre=membre)
        assert str(p.montant) == "80.00"
        assert p.moyen == "cheque"
        assert p.created_by == staff

    def test_enregistrer_paiement_especes(self, auth_client, membre):
        url = f"/api/membres/{membre.id}/paiements/"
        payload = {
            "date": str(date.today()),
            "montant": "50.00",
            "moyen": "especes",
        }
        response = auth_client.post(url, payload, format="json")
        assert response.status_code == 201

    def test_paiement_montant_invalide_rejete(self, auth_client, membre):
        url = f"/api/membres/{membre.id}/paiements/"
        payload = {
            "date": str(date.today()),
            "montant": "abc",
            "moyen": "tpe",
        }
        response = auth_client.post(url, payload, format="json")
        assert response.status_code == 400

    def test_paiement_moyen_invalide_rejete(self, auth_client, membre):
        url = f"/api/membres/{membre.id}/paiements/"
        payload = {
            "date": str(date.today()),
            "montant": "80.00",
            "moyen": "virement",
        }
        response = auth_client.post(url, payload, format="json")
        assert response.status_code == 400

    def test_paiement_sans_auth_rejete(self, client, membre):
        url = f"/api/membres/{membre.id}/paiements/"
        payload = {
            "date": str(date.today()),
            "montant": "80.00",
            "moyen": "cheque",
        }
        response = client.post(url, payload, format="json")
        assert response.status_code == 401

    def test_liste_paiements_globale(self, auth_client, staff, membre):
        Paiement.objects.create(
            membre=membre,
            date=date.today(),
            montant=80,
            moyen="cheque",
            created_by=staff,
        )
        response = auth_client.get("/api/paiements/")
        assert response.status_code == 200
        assert len(response.data) == 1
