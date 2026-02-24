from dj_rest_auth.views import LoginView as BaseLoginView
from dj_rest_auth.views import LogoutView as BaseLogoutView
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.generics import ListAPIView
from rest_framework.filters import SearchFilter
from rest_framework.decorators import action
from .models import User
from .serializers import UserProfileSerializer


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
    
    @action(detail=False, methods=['patch'], permission_classes=[IsAuthenticated])
    def update_public_key(self, request):
        public_key = request.data.get("public_key")
        if not public_key:
            return Response({"error": "public_key is required"}, status=status.HTTP_400_BAD_REQUEST)
        request.user.public_key = public_key
        request.user.save()
        return Response({"public_key": public_key}, status=status.HTTP_200_OK)


class UserSearchView(ListAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [SearchFilter]
    search_fields = ["email", "full_name"]

    queryset = User.objects.all()

    def get_queryset(self): # type: ignore
        return User.objects.exclude(id=self.request.user.pk)
