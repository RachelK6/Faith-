from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsAdmin

from . import services


class AllocationRecommendationsView(APIView):
    """
    GET /api/allocation/recommendations/
    Admin-only. See services.py for the full algorithm write-up.
    """
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        return Response(services.get_allocation_plan())
