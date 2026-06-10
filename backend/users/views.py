from dj_rest_auth.views import LoginView as BaseLoginView
from dj_rest_auth.views import LogoutView as BaseLogoutView
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.generics import ListAPIView
from rest_framework.filters import SearchFilter
from rest_framework.decorators import action
from rest_framework import viewsets, filters
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.exceptions import InvalidToken
from django_filters.rest_framework import DjangoFilterBackend
from .models import User
from .serializers import UserProfileSerializer
from documents.models import Document, DocumentAccess
from django.db.models import Q
from django.utils import timezone
from rest_framework.generics import UpdateAPIView
from .serializers import ChangePasswordSerializer, AdminResetPasswordSerializer
from .utils.pagination import UsersLimitOffsetPagination
from .permissions import IsAdminRole
from datetime import timedelta
from django.db.models import F
from rest_framework.exceptions import ValidationError


class UsersViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserProfileSerializer
    pagination_class = UsersLimitOffsetPagination
    permission_classes = [IsAuthenticated]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    search_fields = ["email", "full_name"]
    filterset_fields = ["role", "is_active"]
    ordering_fields = ["date_joined", "last_login"]

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()

        if user == request.user:
            return Response(
                {"error": "Нельзя удалить самого себя"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return super().destroy(request, *args, **kwargs)

    def get_permissions(self):
        if self.action in ["update", "partial_update", "destroy", "create"]:
            return [IsAdminRole()]
        return [IsAuthenticated()]
    

    @action(detail=True, methods=["post"], permission_classes=[IsAdminRole])
    def reset_password(self, request, pk=None):
        user = self.get_object()

        serializer = AdminResetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            user.set_password(serializer.validated_data["new_password"])
            user.save()

            return Response(
                {"detail": "Пароль пользователя сброшен"},
                status=status.HTTP_200_OK
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(BaseLoginView):
    def post(self, request, *args, **kwargs): # type: ignore
        email = request.data.get('email')
        user = None
        
        if email:
            try:
                user = User.objects.get(email__iexact=email)
            except User.DoesNotExist:
                pass
            
            if user:
                if user.locked_until and user.locked_until > timezone.now():
                    return Response(
                        {"detail": "Учетная запись временно заблокирована из-за превышения количества попыток входа. Пожалуйста, попробуйте позже."},
                        status=status.HTTP_403_FORBIDDEN
                    )
                
                if user.locked_until and user.locked_until <= timezone.now():
                    user.failed_login_attempts = 0
                    user.locked_until = None
                    user.save(update_fields=['failed_login_attempts', 'locked_until'])

        try:
            response = super().post(request, *args, **kwargs)
        except ValidationError as e:
            if user:
                User.objects.filter(pk=user.pk).update(
                    failed_login_attempts=F('failed_login_attempts') + 1
                )
                user.refresh_from_db()
                
                if user.failed_login_attempts >= 5 and not user.locked_until:
                    user.locked_until = timezone.now() + timedelta(minutes=30)
                    user.save(update_fields=['locked_until'])
            
            return Response(
                {"detail": "Неверный email или пароль"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            if user:
                User.objects.filter(pk=user.pk).update(
                    failed_login_attempts=F('failed_login_attempts') + 1
                )
                user.refresh_from_db()
                
                if user.failed_login_attempts >= 5 and not user.locked_until:
                    user.locked_until = timezone.now() + timedelta(minutes=30)
                    user.save(update_fields=['locked_until'])
            
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if user:
            if user.failed_login_attempts > 0 or user.locked_until:
                user.failed_login_attempts = 0
                user.locked_until = None
                user.save(update_fields=['failed_login_attempts', 'locked_until'])
        

        # response = super().create(request, *args, **kwargs)  # type: ignore

        access_token = response.data.get("access")
        refresh_token = response.data.get("refresh")

        remember_me = request.data.get("remember_me", False)

        access_max_age = 60 * 60 

        refresh_max_age = (
            60 * 60 * 24 * 7 if remember_me else None
        )

        if access_token:
            response.set_cookie(
                key="access_token",
                value=access_token,
                httponly=True,
                secure=False,
                samesite="Lax",
                path="/",
                max_age=access_max_age,
            )

            response.data.pop("access", None)

        if refresh_token:
            cookie_params = {
                "key": "refresh_token",
                "value": refresh_token,
                "httponly": True,
                "secure": False,
                "samesite": "Lax",
                "path": "/",
            }

            if remember_me:
                cookie_params["max_age"] = 60 * 60 * 24 * 7  

            response.set_cookie(**cookie_params)

        return response


class LogoutView(BaseLogoutView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        response.delete_cookie("access_token", path="/")
        response.delete_cookie("refresh_token", path="/")
        return response


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        serializer = UserProfileSerializer(
            request.user, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request):
        public_key = request.data.get("public_key")
        if not public_key:
            return Response(
                {"error": "public_key is required"}, status=status.HTTP_400_BAD_REQUEST
            )
        request.user.public_key = public_key
        request.user.save()
        return Response({"public_key": public_key}, status=status.HTTP_200_OK)


class UserStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        documents_created = Document.objects.filter(owner=user).count()
        documents_shared_count = (
            DocumentAccess.objects.filter(document__owner=user, revoked_at__isnull=True)
            .filter(Q(expires_at__isnull=True) | Q(expires_at__gte=timezone.now()))
            .exclude(user=user)
            .count()
        )
        documents_accessible = (
            DocumentAccess.objects.filter(user=user, revoked_at__isnull=True)
            .filter(Q(expires_at__isnull=True) | Q(expires_at__gte=timezone.now()))
            .count()
        )

        return Response(
            {
                "documents_created": documents_created,
                "documents_shared": documents_shared_count,
                "documents_accessible": documents_accessible,
            }
        )


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data, context={"request": request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"detail": "Пароль успешно обновлён"}, status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CookieTokenRefreshView(TokenRefreshView):

    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get("refresh_token")

        if not refresh_token:
            return Response(
                {"detail": "Refresh token not found"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        serializer = TokenRefreshSerializer(
            data={"refresh": refresh_token}
        )

        try:
            serializer.is_valid(raise_exception=True)
        except InvalidToken:
            return Response(
                {"detail": "Invalid refresh token"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        access_token = serializer.validated_data["access"] # type: ignore

        new_refresh_token = serializer.validated_data.get("refresh") # type: ignore

        response = Response(
            {"detail": "Token refreshed"},
            status=status.HTTP_200_OK
        )

        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=False,
            samesite="Lax",
            path="/",
            max_age=60 * 60,
        )

        if new_refresh_token:
            cookie_params = {
                "key": "refresh_token",
                "value": new_refresh_token,
                "httponly": True,
                "secure": False,
                "samesite": "Lax",
                "path": "/",
            }

            response.set_cookie(**cookie_params)

        return response
    

from .serializers import ForgotPasswordSerializer
from notifications.services import create_notification  

class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        
        if serializer.is_valid():
            email = serializer.validated_data['email'] # type: ignore
            user = User.objects.filter(email__iexact=email).first()
            
            if user:
                admins = User.objects.filter(
                    role='admin',
                    is_active=True
                )
                
                for admin in admins:
                    create_notification(
                        user=admin,
                        type="password_reset_request", 
                        title="Запрос сброса пароля",
                        message=f'Пользователь "{user.full_name}" ({user.email}) запросил сброс пароля',
                    )
                
            return Response(
                {"detail": "Если пользователь с таким email существует, администраторы получили уведомление"},
                status=status.HTTP_200_OK
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)