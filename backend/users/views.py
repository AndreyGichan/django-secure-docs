from dj_rest_auth.views import LoginView as BaseLoginView
from dj_rest_auth.views import LogoutView as BaseLogoutView
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.generics import ListAPIView
from rest_framework.filters import SearchFilter
from rest_framework.decorators import action
from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import User
from .serializers import UserProfileSerializer
from documents.models import Document, DocumentAccess
from django.db.models import Q
from django.utils import timezone
from rest_framework.generics import UpdateAPIView
from .serializers import ChangePasswordSerializer
from .utils.pagination import UsersLimitOffsetPagination
from .permissions import IsAdminRole


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


class LoginView(BaseLoginView):
    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)  # type: ignore

        access_token = response.data.get("access")
        refresh_token = response.data.get("refresh")

        if access_token:
            response.set_cookie(
                key="access_token",
                value=access_token,
                httponly=True,
                secure=False,
                samesite="None",
                path="/",
            )

            response.data.pop("access", None)

        if refresh_token:
            response.set_cookie(
                key="refresh_token",
                value=refresh_token,
                httponly=True,
                secure=False,
                samesite="None",
                path="/token/refresh/",
            )
            response.data.pop("refresh", None)

        return response


class LogoutView(BaseLogoutView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        response.delete_cookie("access_token", path="/")
        response.delete_cookie("refresh_token", path="/token/refresh/")
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
