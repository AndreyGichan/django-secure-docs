from rest_framework import serializers
from .models import User
from dj_rest_auth.registration.serializers import RegisterSerializer
from django.contrib.auth import password_validation
from documents.models import Document
from django.utils import timezone

class UserProfileSerializer(serializers.ModelSerializer):
    documentsCount = serializers.SerializerMethodField()
    is_locked = serializers.SerializerMethodField()  
    failed_login_attempts = serializers.IntegerField(read_only=True)  
    locked_until = serializers.DateTimeField(read_only=True)
    
    class Meta:
        model = User
        fields = ["id", "email", "full_name", "public_key", "role", "date_joined", "last_login", "documentsCount", "is_locked", "failed_login_attempts", "locked_until",]

    def get_documentsCount(self, obj):
        return Document.objects.filter(owner=obj).count()
    
    def get_is_locked(self, obj):
        return bool(obj.locked_until and obj.locked_until > timezone.now())


class CustomRegisterSerializer(RegisterSerializer):
    username = None 
    full_name = serializers.CharField(required=True)
    email = serializers.EmailField(required=True) 
    public_key = serializers.CharField(required=True)
    role = serializers.ChoiceField(choices=["admin", "manager", "employee"], required=False)

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
        data = self.get_cleaned_data()
        role = self.validated_data.get("role", "employee") # type: ignore
        user = User.objects.create_user( # type: ignore
            email=data['email'],
            password=data['password1'],
            full_name=data['full_name'],
            role = role,
            public_key=self.validated_data.get('public_key')  # type: ignore
        )
        return user


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
    confirm_password = serializers.CharField(required=True)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Текущий пароль неверен")
        return value

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Пароли не совпадают"})
        password_validation.validate_password(attrs['new_password'], self.context['request'].user)
        return attrs

    def save(self, **kwargs):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password']) # type: ignore
        user.save()
        return user


class AdminResetPasswordSerializer(serializers.Serializer):
    new_password = serializers.CharField(required=True)

    def validate_new_password(self, value):
        password_validation.validate_password(value)
        return value


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    
    def validate_email(self, value):
        return value.lower().strip()