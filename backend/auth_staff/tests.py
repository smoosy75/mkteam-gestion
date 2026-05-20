import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from auth_staff.models import Staff


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def staff(db):
    return Staff.objects.create_user(
        email="staff@mkteam.fr",
        nom="Dupont",
        password="motdepasse123",
        role=Staff.Role.STAFF,
    )


@pytest.fixture
def token(client, staff):
    response = client.post(
        reverse("token_obtain_pair"),
        {"email": "staff@mkteam.fr", "password": "motdepasse123"},
    )
    return response.data["access"]


@pytest.mark.django_db
class TestAuth:
    def test_login_valide(self, client, staff):
        response = client.post(
            reverse("token_obtain_pair"),
            {"email": "staff@mkteam.fr", "password": "motdepasse123"},
        )
        assert response.status_code == 200
        assert "access" in response.data
        assert "refresh" in response.data

    def test_login_mauvais_mot_de_passe(self, client, staff):
        response = client.post(
            reverse("token_obtain_pair"),
            {"email": "staff@mkteam.fr", "password": "mauvais"},
        )
        assert response.status_code == 401

    def test_login_email_inconnu(self, client):
        response = client.post(
            reverse("token_obtain_pair"),
            {"email": "inconnu@mkteam.fr", "password": "test"},
        )
        assert response.status_code == 401

    def test_acces_refuse_sans_token(self, client):
        response = client.get("/api/membres/")
        assert response.status_code == 401

    def test_acces_avec_token_valide(self, client, token):
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = client.get("/api/membres/")
        assert response.status_code == 200

    def test_refresh_token(self, client, staff):
        login = client.post(
            reverse("token_obtain_pair"),
            {"email": "staff@mkteam.fr", "password": "motdepasse123"},
        )
        refresh = login.data["refresh"]
        response = client.post(reverse("token_refresh"), {"refresh": refresh})
        assert response.status_code == 200
        assert "access" in response.data
