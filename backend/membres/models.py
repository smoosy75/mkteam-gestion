import uuid
from datetime import date, timedelta

from django.db import models
from django.utils import timezone


class Membre(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    date_naissance = models.DateField()
    nationalite = models.CharField(max_length=100, blank=True)
    adresse = models.TextField()
    telephone = models.CharField(max_length=20)
    email = models.EmailField(unique=True)
    instagram = models.CharField(max_length=100, blank=True)
    nom_responsable = models.CharField(max_length=200, blank=True)
    tel_responsable = models.CharField(max_length=20, blank=True)
    date_inscription = models.DateField(auto_now_add=True)
    archive = models.BooleanField(default=False)
    dossier_valide = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def est_mineur(self):
        today = date.today()
        age = (
            today.year
            - self.date_naissance.year
            - (
                (today.month, today.day)
                < (self.date_naissance.month, self.date_naissance.day)
            )
        )
        return age < 18

    class Meta:
        ordering = ["-date_inscription"]

    def __str__(self):
        return f"{self.prenom} {self.nom}"


class Ceinture(models.Model):
    class Grade(models.TextChoices):
        BLANCHE = "blanche", "Blanche"
        BLEUE = "bleue", "Bleue"
        VIOLETTE = "violette", "Violette"
        MARRON = "marron", "Marron"
        NOIRE = "noire", "Noire"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    membre = models.ForeignKey(
        Membre, on_delete=models.CASCADE, related_name="ceintures"
    )
    grade = models.CharField(max_length=20, choices=Grade.choices)
    nom_prof = models.CharField(max_length=150)
    date_obtention = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date_obtention"]

    def __str__(self):
        return f"{self.membre} — {self.grade}"


class Abonnement(models.Model):
    class Type(models.TextChoices):
        MENSUEL = "mensuel", "Mensuel"
        ANNUEL = "annuel", "Annuel"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    membre = models.ForeignKey(
        Membre, on_delete=models.CASCADE, related_name="abonnements"
    )
    type = models.CharField(max_length=10, choices=Type.choices)
    date_debut = models.DateField()
    nombre_mois = models.PositiveSmallIntegerField(null=True, blank=True)
    actif = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.membre} — {self.type}"


class Licence(models.Model):
    class Federation(models.TextChoices):
        CFJJB = "CFJJB", "CFJJB"
        FFJDA = "FFJDA", "FFJDA"
        FFL = "FFL", "FFL"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    membre = models.ForeignKey(
        Membre, on_delete=models.CASCADE, related_name="licences"
    )
    federation = models.CharField(max_length=10, choices=Federation.choices)
    numero = models.CharField(max_length=50, blank=True)
    date_expiration = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.membre} — {self.federation}"


class Document(models.Model):
    class Type(models.TextChoices):
        CERTIF_MEDICAL = "certif_medical", "Certificat médical"
        PHOTO_IDENTITE = "photo_identite", "Photo d'identité"
        AUTORISATION_PARENTALE = "autorisation_parentale", "Autorisation parentale"
        FICHE_INSCRIPTION = "fiche_inscription", "Fiche d'inscription"
        REGLEMENT = "reglement", "Règlement"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    membre = models.ForeignKey(
        Membre, on_delete=models.CASCADE, related_name="documents"
    )
    type = models.CharField(max_length=30, choices=Type.choices)
    fichier = models.FileField(upload_to="documents/%Y/%m/", blank=True)
    url_fichier = models.TextField(blank=True)
    date_upload = models.DateTimeField(auto_now_add=True)
    date_expiration = models.DateField(null=True, blank=True)
    actif = models.BooleanField(default=True)

    def get_url(self):
        if self.fichier:
            return self.fichier.url
        return self.url_fichier

    def __str__(self):
        return f"{self.membre} — {self.type}"


class UploadToken(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    membre = models.ForeignKey(
        Membre, on_delete=models.CASCADE, related_name="upload_tokens"
    )
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    @classmethod
    def create_for(cls, membre):
        return cls.objects.create(
            membre=membre,
            expires_at=timezone.now() + timedelta(days=7),
        )

    @property
    def is_valid(self):
        return not self.used and timezone.now() < self.expires_at

    def __str__(self):
        return f"Token {self.id} — {self.membre}"
