import uuid

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.db import models


class StaffManager(BaseUserManager):
    def create_user(self, email, nom, password=None, **extra):
        if not email:
            raise ValueError("Email requis")
        user = self.model(email=self.normalize_email(email), nom=nom, **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, nom, password=None, **extra):
        extra.setdefault("role", Staff.Role.SUPER_ADMIN)
        extra.setdefault("actif", True)
        return self.create_user(email, nom, password, **extra)


class Staff(AbstractBaseUser):
    class Role(models.TextChoices):
        SUPER_ADMIN = "super_admin", "Super Admin"
        STAFF = "staff", "Staff"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    nom = models.CharField(max_length=150)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.STAFF)
    actif = models.BooleanField(default=True)

    objects = StaffManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["nom"]

    class Meta:
        verbose_name = "staff"
        verbose_name_plural = "staff"

    @property
    def is_active(self):
        return self.actif

    @property
    def is_staff(self):
        return self.role == self.Role.SUPER_ADMIN

    def __str__(self):
        return f"{self.nom} ({self.email})"
