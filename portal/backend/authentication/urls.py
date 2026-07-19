from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from authentication.views import (
    GoogleAuthView, OnboardStudentView, MeView, UpdateProfileView,
    AdminUserManagementView, ApproveUserView, DeleteUserView, ApproveAllUsersView,
    ToggleSuperadminView, EmailRegisterView, EmailLoginView, AuthConfigView
)

urlpatterns = [
    path('google/', GoogleAuthView.as_view(), name='google_auth'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('onboard/', OnboardStudentView.as_view(), name='student_onboard'),
    path('me/', MeView.as_view(), name='auth_me'),
    path('update-profile/', UpdateProfileView.as_view(), name='update_profile'),
    path('admin/users/', AdminUserManagementView.as_view(), name='admin_users'),
    path('admin/users/<int:pk>/approve/', ApproveUserView.as_view(), name='approve_user'),
    path('admin/users/<int:pk>/delete/', DeleteUserView.as_view(), name='delete_user'),
    path('admin/users/approve-all/', ApproveAllUsersView.as_view(), name='approve_all_users'),
    path('admin/users/<int:pk>/toggle-superadmin/', ToggleSuperadminView.as_view(), name='toggle_superadmin'),
    path('email/register/', EmailRegisterView.as_view(), name='email_register'),
    path('email/login/', EmailLoginView.as_view(), name='email_login'),
    path('config/', AuthConfigView.as_view(), name='auth_config'),
]
