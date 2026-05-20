from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from paiements.models import Paiement
from paiements.serializers import PaiementSerializer


class PaiementViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = PaiementSerializer

    def get_queryset(self):
        return Paiement.objects.select_related("membre", "created_by").order_by("-date")
