from django.urls import path

from dj_rest_auth.registration.views import RegisterView
from dj_rest_auth.views import LoginView, LogoutView

from . import views
from .serializers import CustomRegisterSerializer

urlpatterns = [
    path('register/', RegisterView.as_view(serializer_class=CustomRegisterSerializer), name='rest_register'),
    path('login/', LoginView.as_view(), name='rest_login'),
    path('logout/', LogoutView.as_view(), name='rest_logout'),
    path('profile/', views.user_profile_view, name='user_profile'),
]