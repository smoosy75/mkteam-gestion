from datetime import date

from rest_framework import serializers

from membres.models import Abonnement, Ceinture, Document, Licence, Membre
from membres.services import get_statut_membre


class DocumentSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = [
            "id",
            "type",
            "url",
            "date_upload",
            "date_expiration",
            "actif",
        ]
        read_only_fields = ["id", "date_upload", "url"]

    def get_url(self, obj):
        if obj.fichier:
            request = self.context.get("request")
            return (
                request.build_absolute_uri(obj.fichier.url)
                if request
                else obj.fichier.url
            )
        return obj.url_fichier


class CeintureSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ceinture
        fields = ["id", "grade", "nom_prof", "date_obtention", "created_at"]
        read_only_fields = ["id", "created_at"]


class AbonnementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Abonnement
        fields = ["id", "type", "date_debut", "nombre_mois", "actif"]
        read_only_fields = ["id"]


class LicenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Licence
        fields = ["id", "federation", "numero", "date_expiration"]
        read_only_fields = ["id"]


class MembreListSerializer(serializers.ModelSerializer):
    statut = serializers.SerializerMethodField()
    est_mineur = serializers.BooleanField(read_only=True)

    class Meta:
        model = Membre
        fields = [
            "id",
            "nom",
            "prenom",
            "email",
            "telephone",
            "date_inscription",
            "est_mineur",
            "archive",
            "dossier_valide",
            "statut",
        ]

    def get_statut(self, obj):
        return get_statut_membre(obj)


class MembreDetailSerializer(serializers.ModelSerializer):
    statut = serializers.SerializerMethodField()
    est_mineur = serializers.BooleanField(read_only=True)
    has_active_token = serializers.SerializerMethodField()
    active_token_id = serializers.SerializerMethodField()
    documents = DocumentSerializer(many=True, read_only=True)
    ceintures = CeintureSerializer(many=True, read_only=True)
    abonnements = AbonnementSerializer(many=True, read_only=True)
    licences = LicenceSerializer(many=True, read_only=True)

    class Meta:
        model = Membre
        fields = [
            "id",
            "nom",
            "prenom",
            "date_naissance",
            "est_mineur",
            "nationalite",
            "adresse",
            "telephone",
            "email",
            "instagram",
            "nom_responsable",
            "tel_responsable",
            "date_inscription",
            "archive",
            "dossier_valide",
            "statut",
            "has_active_token",
            "active_token_id",
            "documents",
            "ceintures",
            "abonnements",
            "licences",
            "created_at",
            "updated_at",
        ]

    def get_statut(self, obj):
        return get_statut_membre(obj)

    def get_has_active_token(self, obj):
        from django.utils import timezone

        return obj.upload_tokens.filter(
            used=False, expires_at__gt=timezone.now()
        ).exists()

    def get_active_token_id(self, obj):
        from django.utils import timezone

        token = obj.upload_tokens.filter(
            used=False, expires_at__gt=timezone.now()
        ).first()
        return str(token.id) if token else None


class InscriptionSerializer(serializers.ModelSerializer):
    type_abonnement = serializers.ChoiceField(
        choices=Abonnement.Type.choices, write_only=True
    )
    date_debut = serializers.DateField(write_only=True)
    nombre_mois = serializers.IntegerField(
        required=False, allow_null=True, write_only=True, min_value=1
    )

    class Meta:
        model = Membre
        fields = [
            "nom",
            "prenom",
            "date_naissance",
            "nationalite",
            "adresse",
            "telephone",
            "email",
            "instagram",
            "nom_responsable",
            "tel_responsable",
            "type_abonnement",
            "date_debut",
            "nombre_mois",
        ]

    def validate(self, data):
        ddn = data.get("date_naissance")
        if ddn:
            today = date.today()
            age = (
                today.year
                - ddn.year
                - ((today.month, today.day) < (ddn.month, ddn.day))
            )
            est_mineur = age < 18
            if est_mineur:
                if not data.get("nom_responsable"):
                    raise serializers.ValidationError(
                        {"nom_responsable": "Obligatoire pour un mineur."}
                    )
                if not data.get("tel_responsable"):
                    raise serializers.ValidationError(
                        {"tel_responsable": "Obligatoire pour un mineur."}
                    )

        if data.get("type_abonnement") == Abonnement.Type.MENSUEL:
            if not data.get("nombre_mois"):
                raise serializers.ValidationError(
                    {"nombre_mois": "Obligatoire pour un abonnement mensuel."}
                )
        return data

    def create(self, validated_data):
        type_abonnement = validated_data.pop("type_abonnement")
        date_debut = validated_data.pop("date_debut")
        nombre_mois = validated_data.pop("nombre_mois", None)

        membre = Membre.objects.create(**validated_data)
        Abonnement.objects.create(
            membre=membre,
            type=type_abonnement,
            date_debut=date_debut,
            nombre_mois=nombre_mois,
            actif=True,
        )
        return membre


class MembreUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Membre
        fields = [
            "nom",
            "prenom",
            "date_naissance",
            "nationalite",
            "adresse",
            "telephone",
            "email",
            "instagram",
            "nom_responsable",
            "tel_responsable",
        ]


class CeintureCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ceinture
        fields = ["grade", "nom_prof", "date_obtention"]

    def create(self, validated_data):
        membre = self.context["membre"]
        return Ceinture.objects.create(membre=membre, **validated_data)
