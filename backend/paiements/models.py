import uuid

from django.conf import settings
from django.db import models

from membres.models import Membre


class Paiement(models.Model):
    class Moyen(models.TextChoices):
        CHEQUE = "cheque", "Chèque"
        TPE = "tpe", "TPE"
        ESPECES = "especes", "Espèces"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    membre = models.ForeignKey(
        Membre, on_delete=models.CASCADE, related_name="paiements"
    )
    date = models.DateField()
    montant = models.DecimalField(max_digits=8, decimal_places=2)
    moyen = models.CharField(max_length=10, choices=Moyen.choices)
    note = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="paiements_saisis",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date"]

    def __str__(self):
        return f"{self.membre} — {self.montant}€ ({self.moyen}) le {self.date}"
