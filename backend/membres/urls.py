from django.urls import include, path
from rest_framework.routers import DefaultRouter

from membres.views import AlertesView, InscriptionView, MembreViewSet

router = DefaultRouter()
router.register(r"membres", MembreViewSet, basename="membre")

urlpatterns = [
    path("inscription/", InscriptionView.as_view(), name="inscription"),
    path("alertes/", AlertesView.as_view(), name="alertes"),
    path("", include(router.urls)),
]
