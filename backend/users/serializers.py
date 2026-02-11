from rest_framework import serializers
from .models import User
from dj_rest_auth.registration.serializers import RegisterSerializer

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "full_name"]


class CustomRegisterSerializer(RegisterSerializer):
    username = None 
    full_name = serializers.CharField(required=True)
    email = serializers.EmailField(required=True) 

    def validate_email(self, email):
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError("Пользователь с таким email уже существует")
        return email

    def get_cleaned_data(self):
        return {
            'email': self.validated_data.get('email', ''), # type: ignore
            'password1': self.validated_data.get('password1', ''), # type: ignore
            'full_name': self.validated_data.get('full_name', ''), # type: ignore
        }

    def save(self, request):
        user = super().save(request)
        user.full_name = self.validated_data.get('full_name') # type: ignore
        user.save()
        return user