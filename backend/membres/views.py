from datetime import date, timedelta

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from membres.models import Document, Membre
from membres.serializers import (
    CeintureCreateSerializer,
    CeintureSerializer,
    InscriptionSerializer,
    MembreDetailSerializer,
    MembreListSerializer,
)
from membres.services import get_statut_membre
from paiements.serializers import PaiementCreateSerializer, PaiementSerializer


class InscriptionView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = InscriptionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Dossier soumis. Le staff vous contactera sous peu."},
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MembreViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Membre.objects.prefetch_related(
            "documents", "ceintures", "abonnements", "licences", "paiements"
        )
        archive = self.request.query_params.get("archive", "false")
        if archive.lower() != "true":
            qs = qs.filter(archive=False)
        return qs

    def get_serializer_class(self):
        if self.action == "retrieve":
            return MembreDetailSerializer
        return MembreListSerializer

    @action(detail=True, methods=["post"], url_path="paiements")
    def add_paiement(self, request, pk=None):
        membre = self.get_object()
        serializer = PaiementCreateSerializer(
            data=request.data, context={"membre": membre, "request": request}
        )
        if serializer.is_valid():
            paiement = serializer.save()
            return Response(
                PaiementSerializer(paiement).data, status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"], url_path="ceintures")
    def add_ceinture(self, request, pk=None):
        membre = self.get_object()
        serializer = CeintureCreateSerializer(
            data=request.data, context={"membre": membre}
        )
        if serializer.is_valid():
            ceinture = serializer.save()
            return Response(
                CeintureSerializer(ceinture).data, status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["patch"], url_path="archiver")
    def archiver(self, request, pk=None):
        membre = self.get_object()
        membre.archive = True
        membre.save()
        return Response({"statut": "ANCIEN"})


class AlertesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = date.today()
        j30 = today + timedelta(days=30)

        certifs_expirants = (
            Document.objects.filter(
                type=Document.Type.CERTIF_MEDICAL,
                actif=True,
                date_expiration__lte=j30,
                membre__archive=False,
            )
            .select_related("membre")
            .order_by("date_expiration")
        )

        certifs_expires = [d for d in certifs_expirants if d.date_expiration < today]
        certifs_bientot = [d for d in certifs_expirants if d.date_expiration >= today]

        membres_qs = Membre.objects.filter(archive=False).prefetch_related(
            "documents", "abonnements", "paiements"
        )
        suspendus = [m for m in membres_qs if get_statut_membre(m) == "SUSPENDU"]

        return Response(
            {
                "certifs_expires": [
                    {
                        "membre_id": str(d.membre.id),
                        "membre_nom": str(d.membre),
                        "date_expiration": d.date_expiration,
                    }
                    for d in certifs_expires
                ],
                "certifs_bientot": [
                    {
                        "membre_id": str(d.membre.id),
                        "membre_nom": str(d.membre),
                        "date_expiration": d.date_expiration,
                    }
                    for d in certifs_bientot
                ],
                "membres_suspendus": MembreListSerializer(suspendus, many=True).data,
            }
        )
