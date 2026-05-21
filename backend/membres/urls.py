from django.urls import include, path
from rest_framework.routers import DefaultRouter

from membres.views import (
    AlertesView,
    DocumentUploadView,
    InscriptionView,
    MembreViewSet,
    SendDocumentLinkView,
)

router = DefaultRouter()
router.register(r"membres", MembreViewSet, basename="membre")

urlpatterns = [
    path("inscription/", InscriptionView.as_view(), name="inscription"),
    path("alertes/", AlertesView.as_view(), name="alertes"),
    path(
        "membres/<uuid:pk>/send_document_link/",
        SendDocumentLinkView.as_view(),
        name="send_document_link",
    ),
    path(
        "upload/<uuid:token_id>/", DocumentUploadView.as_view(), name="document_upload"
    ),
    path("", include(router.urls)),
]
