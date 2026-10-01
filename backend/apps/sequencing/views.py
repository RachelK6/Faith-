from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from . import services


class MySequencingView(APIView):
    """
    GET /api/sequencing/me/
    The logged-in student's personalized next-step recommendation for
    each enrolled course — see services.py for the mastery-based logic.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({"recommendations": services.recommend_for_student(request.user)})
