from django.urls import include, path
from rest_framework.routers import DefaultRouter

from paiements.views import PaiementViewSet

router = DefaultRouter()
router.register(r"paiements", PaiementViewSet, basename="paiement")

urlpatterns = [
    path("", include(router.urls)),
]
