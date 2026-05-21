from datetime import date, timedelta

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from django.core.mail import send_mail
from django.conf import settings

from membres.models import Document, Membre, UploadToken
from membres.serializers import (
    CeintureCreateSerializer,
    CeintureSerializer,
    InscriptionSerializer,
    MembreDetailSerializer,
    MembreListSerializer,
    MembreUpdateSerializer,
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


class MembreViewSet(viewsets.ModelViewSet):
    http_method_names = ["get", "patch", "head", "options"]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Membre.objects.prefetch_related(
            "documents", "ceintures", "abonnements", "licences", "paiements", "upload_tokens"
        )
        archive = self.request.query_params.get("archive", "false")
        if archive.lower() != "true":
            qs = qs.filter(archive=False)
        return qs

    def get_serializer_class(self):
        if self.action == "retrieve":
            return MembreDetailSerializer
        if self.action in ("update", "partial_update"):
            return MembreUpdateSerializer
        return MembreListSerializer

    @action(detail=True, methods=["get", "post"], url_path="paiements")
    def add_paiement(self, request, pk=None):
        membre = self.get_object()
        if request.method == "GET":
            return Response(PaiementSerializer(membre.paiements.order_by("-date"), many=True).data)
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

    @action(detail=True, methods=["patch"], url_path="valider")
    def valider(self, request, pk=None):
        membre = self.get_object()
        membre.dossier_valide = True
        membre.save()
        return Response({"statut": get_statut_membre(membre)})

    @action(detail=True, methods=["patch"], url_path="archiver")
    def archiver(self, request, pk=None):
        membre = self.get_object()
        membre.archive = True
        membre.save()
        return Response({"statut": "ANCIEN"})


class SendDocumentLinkView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            membre = Membre.objects.get(pk=pk, archive=False)
        except Membre.DoesNotExist:
            return Response({"detail": "Membre introuvable."}, status=status.HTTP_404_NOT_FOUND)

        token = UploadToken.create_for(membre)
        base_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000")
        lien = f"{base_url}/upload/{token.id}"

        send_mail(
            subject="MK Team Paris — Complétez votre dossier",
            message=(
                f"Bonjour {membre.prenom},\n\n"
                f"Veuillez déposer vos documents via ce lien (valable 7 jours) :\n{lien}\n\n"
                "Documents requis :\n"
                "- Photo d'identité\n"
                "- Certificat médical (avec date d'expiration)\n"
                "- Règlement intérieur signé\n"
                + ("- Autorisation parentale\n" if membre.est_mineur else "")
                + "\nMK Team Paris"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[membre.email],
            fail_silently=False,
        )
        return Response({"detail": "Lien envoyé.", "expires_at": token.expires_at})


class DocumentUploadView(APIView):
    permission_classes = []

    def _get_token(self, token_id):
        try:
            token = UploadToken.objects.select_related("membre").get(pk=token_id)
        except (UploadToken.DoesNotExist, Exception):
            return None, Response({"detail": "Lien invalide."}, status=status.HTTP_404_NOT_FOUND)
        if not token.is_valid:
            return None, Response({"detail": "Lien expiré ou déjà utilisé."}, status=status.HTTP_410_GONE)
        return token, None

    def get(self, request, token_id):
        token, err = self._get_token(token_id)
        if err:
            return err
        membre = token.membre
        requis = ["certif_medical", "photo_identite", "reglement"]
        if membre.est_mineur:
            requis.append("autorisation_parentale")
        actifs = set(membre.documents.filter(actif=True).values_list("type", flat=True))
        manquants = [t for t in requis if t not in actifs]
        return Response({
            "membre": {"prenom": membre.prenom, "nom": membre.nom, "est_mineur": membre.est_mineur},
            "manquants": manquants,
            "expires_at": token.expires_at,
        })

    def post(self, request, token_id):
        from datetime import date, timedelta
        token, err = self._get_token(token_id)
        if err:
            return err
        membre = token.membre
        created = []

        # Photo d'identité
        photo = request.FILES.get("photo_identite")
        if photo:
            membre.documents.filter(type="photo_identite", actif=True).update(actif=False)
            Document.objects.create(
                membre=membre,
                type="photo_identite",
                fichier=photo,
                actif=True,
            )
            created.append("photo_identite")

        # Certif médical — date exp auto = aujourd'hui + 1 an
        certif = request.FILES.get("certif_medical")
        if certif:
            membre.documents.filter(type="certif_medical", actif=True).update(actif=False)
            Document.objects.create(
                membre=membre,
                type="certif_medical",
                fichier=certif,
                date_expiration=date.today() + timedelta(days=365),
                actif=True,
            )
            created.append("certif_medical")

        # Règlement — checkbox, pas de fichier
        if request.data.get("reglement_accepte") == "true":
            membre.documents.filter(type="reglement", actif=True).update(actif=False)
            Document.objects.create(
                membre=membre,
                type="reglement",
                url_fichier="accepté_en_ligne",
                actif=True,
            )
            created.append("reglement")

        # Autorisation parentale
        autori = request.FILES.get("autorisation_parentale")
        if autori:
            membre.documents.filter(type="autorisation_parentale", actif=True).update(actif=False)
            Document.objects.create(
                membre=membre,
                type="autorisation_parentale",
                fichier=autori,
                actif=True,
            )
            created.append("autorisation_parentale")

        if not created:
            return Response({"detail": "Aucun document reçu."}, status=status.HTTP_400_BAD_REQUEST)

        token.used = True
        token.save()
        return Response({"detail": "Documents reçus.", "uploaded": created})


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
        suspendus = []
        for m in membres_qs:
            docs_actifs = {d.type for d in m.documents.all() if d.actif}
            requis = {"certif_medical", "photo_identite", "reglement"}
            if m.est_mineur:
                requis.add("autorisation_parentale")
            if not requis.issubset(docs_actifs):
                continue
            certif = next((d for d in m.documents.all() if d.type == "certif_medical" and d.actif), None)
            certif_expire = not certif or not certif.date_expiration or certif.date_expiration < today
            abonnement = next((a for a in m.abonnements.all() if a.actif), None)
            dernier_paiement = max((p for p in m.paiements.all()), key=lambda p: p.date, default=None)
            if abonnement and dernier_paiement:
                intervalle = 365 if abonnement.type == "annuel" else 30
                retard = (today - dernier_paiement.date).days - intervalle
            else:
                retard = 0
            if certif_expire or retard > 30:
                suspendus.append(m)

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
