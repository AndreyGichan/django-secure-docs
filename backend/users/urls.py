from django.urls import path

from dj_rest_auth.registration.views import RegisterView
from dj_rest_auth.jwt_auth import get_refresh_view

from . import views
from .serializers import CustomRegisterSerializer

urlpatterns = [
    path('register/', RegisterView.as_view(serializer_class=CustomRegisterSerializer), name='rest_register'),
    path('login/', views.LoginView.as_view(), name='rest_login'),
    path('logout/', views.LogoutView.as_view(), name='rest_logout'),
    path('profile/', views.UserProfileView.as_view(), name='user_profile'),
    path('search/', views.UserSearchView.as_view(), name='user_search'),
    path('token/refresh/', get_refresh_view().as_view(), name='token_refresh'),
    path("stats/", views.UserStatsView.as_view(), name="user_stats"),
    path("change-password/", views.ChangePasswordView.as_view(), name="change_password"),
]