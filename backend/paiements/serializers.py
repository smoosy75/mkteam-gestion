from rest_framework import serializers

from paiements.models import Paiement


class PaiementSerializer(serializers.ModelSerializer):
    created_by_nom = serializers.SerializerMethodField()

    class Meta:
        model = Paiement
        fields = [
            "id",
            "date",
            "montant",
            "moyen",
            "note",
            "created_by_nom",
            "created_at",
        ]
        read_only_fields = ["id", "created_at", "created_by_nom"]

    def get_created_by_nom(self, obj):
        return obj.created_by.nom if obj.created_by else None


class PaiementCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Paiement
        fields = ["date", "montant", "moyen", "note"]

    def create(self, validated_data):
        membre = self.context["membre"]
        staff = self.context["request"].user
        return Paiement.objects.create(
            membre=membre, created_by=staff, **validated_data
        )
