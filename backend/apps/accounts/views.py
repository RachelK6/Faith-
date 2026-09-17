from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.views import TokenBlacklistView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import User
from .serializers import RegisterSerializer, UserSerializer


class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/ — open to anyone."""
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_scope = "auth"


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    SimpleJWT defaults to username+password. We log in with email,
    and embed the role in the token so the frontend can route by role
    without an extra API call.
    """
    username_field = User.USERNAME_FIELD

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["email"] = user.email
        return token


class LoginView(TokenObtainPairView):
    """POST /api/auth/login/ — body: {"email": ..., "password": ...}"""
    serializer_class = EmailTokenObtainPairSerializer
    permission_classes = [permissions.AllowAny]
    throttle_scope = "auth"


class LogoutView(TokenBlacklistView):
    """POST /api/auth/logout/ — revoke the submitted refresh token."""
    permission_classes = [permissions.IsAuthenticated]


class MeView(APIView):
    """GET /api/auth/me/ — the currently authenticated user."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)
