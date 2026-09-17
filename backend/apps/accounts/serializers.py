from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    """
    Public self-registration. Deliberately does NOT expose `role` —
    anyone POSTing here becomes a student, full stop. Instructor and
    admin accounts are created through Django admin (/admin/) by
    someone who already has admin access, not through this open
    endpoint. (Earlier testing caught this: without this restriction,
    anyone could register with role=admin in the request body.)
    """
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "password"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data, role="student")
        user.set_password(password)
        user.save()
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "role"]
