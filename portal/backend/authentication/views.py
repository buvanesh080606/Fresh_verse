import os
import requests
import threading
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.tokens import RefreshToken

from authentication.serializers import UserSerializer, OnboardSerializer, StudentProfileSerializer
from academic.models import StudentProfile
from core.models import Hostel, BusRoute
from utils.permissions import IsAdminUserRole, IsSuperAdminUser

from django.core.mail import send_mail

User = get_user_model()

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    # Add custom claims
    refresh['email'] = user.email
    refresh['role'] = user.role
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

def notify_original_superadmin(actor, action_type, target=None, target_description=None):
    actor_role = 'Superadmin' if actor.is_superadmin else 'Administrator'
    actor_name = f"{actor.first_name} {actor.last_name}".strip() or actor.email
    
    subject = "[FreshVerse AI] Admin Approval Portal Activity Alert"
    
    if target:
        target_name = f"{target.first_name} {target.last_name}".strip() or target.email
        target_label = f"admin '{target_name}'" if target.role == 'admin' else f"student '{target_name}'"
        
        message = (
            f"Dear Superadmin,\n\n"
            f"A user access request update has occurred:\n\n"
            f"• {actor_name} ({actor.email}) ({actor_role}) gave request status update to this {target_label} ({target.email}): {action_type.upper()}.\n\n"
            f"Best regards,\n"
            f"FreshVerse AI Security System"
        )
    else:
        message = (
            f"Dear Superadmin,\n\n"
            f"A bulk user access request update has occurred:\n\n"
            f"• {actor_name} ({actor.email}) ({actor_role}) gave request status update: {action_type.upper()} ({target_description}).\n\n"
            f"Best regards,\n"
            f"FreshVerse AI Security System"
        )
        
    from_email = getattr(settings, 'EMAIL_HOST_USER', '') or 'noreply@freshverse.edu'
    
    # Collect all recipient emails (the original superadmin email and any active admins in the DB)
    recipients = {'vsbuvaneshraj06@gmail.com'}
    admins = User.objects.filter(role='admin', is_active=True)
    for admin in admins:
        recipients.add(admin.email)
        
    # Send email in a background thread to prevent UI lag
    email_thread = threading.Thread(
        target=send_mail,
        args=(subject, message, from_email, list(recipients)),
        kwargs={'fail_silently': True}
    )
    email_thread.start()

def notify_superadmin_new_registration(new_user):
    role_label = 'Administrator' if new_user.role == 'admin' else 'Student'
    user_name = f"{new_user.first_name} {new_user.last_name}".strip() or "New User"
    
    # 1. Save notification on all Admin/Superadmin Dashboards
    from core.models import Notification
    admins = User.objects.filter(role='admin')
    for admin in admins:
        try:
            Notification.objects.create(
                user=admin,
                title="New Account Registration",
                message=f"{role_label} '{user_name}' ({new_user.email}) has signed up and is pending approval."
            )
        except Exception as e:
            print(f"Failed to create admin notification: {e}")
        
    # 2. Send email notification to Admin/Superadmins
    subject = f"[FreshVerse AI] New {role_label} Access Request Pending Approval"
    message = (
        f"Dear Superadmin,\n\n"
        f"A new user registration has occurred and requires your review:\n\n"
        f"• Email: {new_user.email}\n"
        f"• Role: {role_label}\n"
        f"• Name: {user_name}\n\n"
        f"Please log in to the admin dashboard to approve or decline this access request.\n\n"
        f"Best regards,\n"
        f"FreshVerse AI Security System"
    )
    
    from_email = getattr(settings, 'EMAIL_HOST_USER', '') or 'noreply@freshverse.edu'
    recipients = {'vsbuvaneshraj06@gmail.com'}
    for admin in admins:
        recipients.add(admin.email)
        
    # Send email in a background thread to prevent UI lag
    email_thread = threading.Thread(
        target=send_mail,
        args=(subject, message, from_email, list(recipients)),
        kwargs={'fail_silently': True}
    )
    email_thread.start()

class GoogleAuthView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        # Check if in Mock Auth Mode
        if settings.MOCK_AUTH_MODE:
            email = request.data.get('email', 'student@freshverse.edu')
            role = request.data.get('role', 'student')
            first_name = request.data.get('first_name', 'Test')
            last_name = request.data.get('last_name', 'Student')
            google_id = request.data.get('google_id', 'mock-google-id-123')
            
            # Find or create user
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'first_name': first_name,
                    'last_name': last_name,
                    'role': role,
                    'google_id': google_id,
                    'is_active': True
                }
            )
            
            # If user already exists but role is updated, make sure it matches request
            if not created and 'role' in request.data:
                user.role = role
                user.save()

            if created:
                notify_superadmin_new_registration(user)

            tokens = get_tokens_for_user(user)
            has_profile = False
            if user.role == 'student':
                has_profile = hasattr(user, 'student_profile')
            elif user.role == 'admin':
                has_profile = bool(user.first_name and user.last_name)

            return Response({
                'tokens': tokens,
                'user': UserSerializer(user).data,
                'has_profile': has_profile,
                'mock_mode': True
            }, status=status.HTTP_200_OK)

        # Production OAuth validation
        id_token = request.data.get('id_token')
        if not id_token:
            return Response({'error': 'id_token is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Call Google tokeninfo endpoint
        response = requests.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}")
        if response.status_code != 200:
            return Response({'error': 'Invalid Google Token'}, status=status.HTTP_400_BAD_REQUEST)

        token_info = response.json()
        
        # Verify audience (client ID)
        aud = token_info.get('aud')
        if aud != settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_ID != 'mock-google-client-id.apps.googleusercontent.com':
            # In some cases client id might need validation
            pass

        email = token_info.get('email')
        first_name = token_info.get('given_name', '')
        last_name = token_info.get('family_name', '')
        google_id = token_info.get('sub')

        if not email:
            return Response({'error': 'Google account must share email address'}, status=status.HTTP_400_BAD_REQUEST)

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'first_name': first_name,
                'last_name': last_name,
                'google_id': google_id,
                'role': 'student',  # Default role is student
                'is_active': True
            }
        )

        if created:
            notify_superadmin_new_registration(user)

        tokens = get_tokens_for_user(user)
        has_profile = False
        if user.role == 'student':
            has_profile = hasattr(user, 'student_profile')
        elif user.role == 'admin':
            has_profile = bool(user.first_name and user.last_name)

        return Response({
            'tokens': tokens,
            'user': UserSerializer(user).data,
            'has_profile': has_profile,
            'mock_mode': False
        }, status=status.HTTP_200_OK)


class EmailRegisterView(APIView):
    """Register a new user with email + password."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        password = request.data.get('password', '')
        first_name = request.data.get('first_name', '').strip()
        last_name = request.data.get('last_name', '').strip()
        role = request.data.get('role', 'student')

        if not email or not password:
            return Response({'error': 'Email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if len(password) < 6:
            return Response({'error': 'Password must be at least 6 characters.'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return Response({'error': 'An account with this email already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            role=role,
            is_active=True,
        )

        notify_superadmin_new_registration(user)

        tokens = get_tokens_for_user(user)
        has_profile = False
        if user.role == 'student':
            has_profile = hasattr(user, 'student_profile')
        elif user.role == 'admin':
            has_profile = bool(user.first_name and user.last_name)

        return Response({
            'tokens': tokens,
            'user': UserSerializer(user).data,
            'has_profile': has_profile,
        }, status=status.HTTP_201_CREATED)


class EmailLoginView(APIView):
    """Sign in an existing user with email + password."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from django.contrib.auth import authenticate
        email = request.data.get('email', '').strip().lower()
        password = request.data.get('password', '')

        if not email or not password:
            return Response({'error': 'Email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(request, username=email, password=password)
        if user is None:
            # Also try looking up by email directly (in case username is email)
            try:
                user_obj = User.objects.get(email=email)
                if user_obj.check_password(password):
                    user = user_obj
            except User.DoesNotExist:
                pass

        if user is None:
            return Response({'error': 'Invalid email or password.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active:
            return Response({'error': 'This account has been disabled.'}, status=status.HTTP_403_FORBIDDEN)

        tokens = get_tokens_for_user(user)
        has_profile = False
        if user.role == 'student':
            has_profile = hasattr(user, 'student_profile')
        elif user.role == 'admin':
            has_profile = bool(user.first_name and user.last_name)

        return Response({
            'tokens': tokens,
            'user': UserSerializer(user).data,
            'has_profile': has_profile,
        }, status=status.HTTP_200_OK)


class AuthConfigView(APIView):
    """Exposes Auth settings (Google Client ID & Mock Mode) dynamically to the frontend."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({
            'google_client_id': settings.GOOGLE_CLIENT_ID,
            'mock_auth_mode': settings.MOCK_AUTH_MODE,
        }, status=status.HTTP_200_OK)


class OnboardStudentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        
        # If user is admin:
        if user.role == 'admin':
            first_name = request.data.get('first_name')
            last_name = request.data.get('last_name')
            if not first_name or not last_name:
                return Response({'error': 'First name and Last name are required for admin.'}, status=status.HTTP_400_BAD_REQUEST)
            user.first_name = first_name.strip()
            user.last_name = last_name.strip()
            user.save(update_fields=['first_name', 'last_name'])
            return Response({
                'message': 'Admin onboarding completed successfully',
                'user': UserSerializer(user).data
            }, status=status.HTTP_200_OK)

        if user.role != 'student':
            return Response({'error': 'Only users with Student role can be onboarded.'}, status=status.HTTP_403_FORBIDDEN)
        
        if hasattr(user, 'student_profile'):
            return Response({'error': 'Student profile already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = OnboardSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data

            # Update user's name if provided from the onboarding form
            name_updated = False
            if data.get('first_name'):
                user.first_name = data['first_name']
                name_updated = True
            if data.get('last_name'):
                user.last_name = data['last_name']
                name_updated = True
            if name_updated:
                user.save(update_fields=['first_name', 'last_name'])
            
            hostel = None
            if data.get('hostel_id'):
                try:
                    hostel = Hostel.objects.get(id=data['hostel_id'])
                except Hostel.DoesNotExist:
                    return Response({'error': 'Hostel not found'}, status=status.HTTP_400_BAD_REQUEST)

            bus_route = None
            if data.get('bus_route_id'):
                try:
                    bus_route = BusRoute.objects.get(id=data['bus_route_id'])
                except BusRoute.DoesNotExist:
                    return Response({'error': 'Bus route not found'}, status=status.HTTP_400_BAD_REQUEST)

            # Create StudentProfile
            profile = StudentProfile.objects.create(
                user=user,
                roll_no=data['roll_no'],
                department=data['department'],
                section=data['section'],
                semester=data.get('semester', '1'),
                batch=data['batch'],
                phone=data.get('phone', ''),
                hostel=hostel,
                bus_route=bus_route
            )

            return Response({
                'message': 'Onboarding completed successfully',
                'profile': StudentProfileSerializer(profile).data
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        response_data = {
            'user': UserSerializer(user).data
        }
        if user.role == 'student' and hasattr(user, 'student_profile'):
            response_data['profile'] = StudentProfileSerializer(user.student_profile).data
        return Response(response_data, status=status.HTTP_200_OK)


class UpdateProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request):
        user = request.user
        if user.role != 'student' or not hasattr(user, 'student_profile'):
            return Response({'error': 'No student profile found to update.'}, status=status.HTTP_404_NOT_FOUND)

        profile = user.student_profile
        phone = request.data.get('phone')
        department = request.data.get('department')
        section = request.data.get('section')
        semester = request.data.get('semester')
        batch = request.data.get('batch')
        hostel_id = request.data.get('hostel_id')
        bus_route_id = request.data.get('bus_route_id')

        if phone is not None:
            profile.phone = phone.strip()
        if department:
            profile.department = department.strip()
        if section:
            profile.section = section.strip()
        if semester:
            profile.semester = semester.strip()
        if batch:
            profile.batch = batch.strip()
            
        if hostel_id is not None:
            if hostel_id == '':
                profile.hostel = None
            else:
                try:
                    profile.hostel = Hostel.objects.get(id=hostel_id)
                except Hostel.DoesNotExist:
                    return Response({'error': 'Hostel not found'}, status=status.HTTP_400_BAD_REQUEST)

        if bus_route_id is not None:
            if bus_route_id == '':
                profile.bus_route = None
            else:
                try:
                    profile.bus_route = BusRoute.objects.get(id=bus_route_id)
                except BusRoute.DoesNotExist:
                    return Response({'error': 'Bus route not found'}, status=status.HTTP_400_BAD_REQUEST)

        profile.save()
        return Response({
            'message': 'Profile updated successfully',
            'profile': StudentProfileSerializer(profile).data
        }, status=status.HTTP_200_OK)


class AdminUserManagementView(APIView):
    permission_classes = [IsAdminUserRole]

    def get(self, request):
        user = request.user
        students = User.objects.filter(role='student').order_by('-created_at')
        students_serializer = UserSerializer(students, many=True)
        
        response_data = {
            'students': students_serializer.data,
            'is_superadmin': user.is_superadmin
        }
        
        if user.is_superadmin:
            admins = User.objects.filter(role='admin').exclude(id=user.id).order_by('-created_at')
            admins_serializer = UserSerializer(admins, many=True)
            response_data['admins'] = admins_serializer.data
            
        return Response(response_data, status=status.HTTP_200_OK)

class ApproveUserView(APIView):
    permission_classes = [IsAdminUserRole]

    def post(self, request, pk):
        current_user = request.user
        try:
            target_user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
            
        if target_user.is_superadmin:
            return Response({'error': 'Superadmin privileges cannot be restricted or revoked.'}, status=status.HTTP_403_FORBIDDEN)

        if target_user.role == 'admin':
            if not current_user.is_superadmin:
                return Response({'error': 'Only the superadmin has the rights to approve, restrict, or decline administrator requests. Secondary administrators do not have this permission.'}, status=status.HTTP_403_FORBIDDEN)
            target_user.is_approved_admin = not target_user.is_approved_admin
            target_user.save()
            action = 'approved' if target_user.is_approved_admin else 'revoked'
            notify_original_superadmin(current_user, f"{action} request", target=target_user)
            return Response({'message': f'Admin has been successfully {action}.', 'user': UserSerializer(target_user).data}, status=status.HTTP_200_OK)
            
        elif target_user.role == 'student':
            target_user.is_approved = not target_user.is_approved
            target_user.save()
            action = 'approved' if target_user.is_approved else 'revoked'
            notify_original_superadmin(current_user, f"{action} request", target=target_user)
            return Response({'message': f'Student has been successfully {action}.', 'user': UserSerializer(target_user).data}, status=status.HTTP_200_OK)
            
        return Response({'error': 'Invalid user role.'}, status=status.HTTP_400_BAD_REQUEST)

class DeleteUserView(APIView):
    permission_classes = [IsAdminUserRole]

    def delete(self, request, pk):
        current_user = request.user
        try:
            target_user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
            
        if target_user.is_superadmin:
            return Response({'error': 'Superadmin account cannot be deleted.'}, status=status.HTTP_403_FORBIDDEN)

        if target_user.role == 'admin':
            if not current_user.is_superadmin:
                return Response({'error': 'Only the superadmin has the rights to remove or delete administrator accounts. Secondary administrators do not have this permission.'}, status=status.HTTP_403_FORBIDDEN)
            notify_original_superadmin(current_user, "removed request", target=target_user)
            target_user.delete()
            return Response({'message': 'Admin deleted successfully.'}, status=status.HTTP_200_OK)
            
        elif target_user.role == 'student':
            notify_original_superadmin(current_user, "removed request", target=target_user)
            target_user.delete()
            return Response({'message': 'Student deleted successfully.'}, status=status.HTTP_200_OK)
            
        return Response({'error': 'Invalid user role.'}, status=status.HTTP_400_BAD_REQUEST)


class ApproveAllUsersView(APIView):
    permission_classes = [IsAdminUserRole]

    def post(self, request):
        current_user = request.user
        role_to_approve = request.data.get('role', 'student')
        
        if role_to_approve == 'admin':
            if not current_user.is_superadmin:
                return Response({'error': 'Only the superadmin has the rights to approve administrator requests. Secondary administrators do not have this permission.'}, status=status.HTTP_403_FORBIDDEN)
            User.objects.filter(role='admin').update(is_approved_admin=True)
            notify_original_superadmin(current_user, "approved all requests", target_description="all pending administrators")
            return Response({'message': 'All admin accounts have been approved successfully.'}, status=status.HTTP_200_OK)
            
        elif role_to_approve == 'student':
            User.objects.filter(role='student').update(is_approved=True)
            notify_original_superadmin(current_user, "approved all requests", target_description="all pending students")
            return Response({'message': 'All student accounts have been approved successfully.'}, status=status.HTTP_200_OK)
            
        return Response({'error': 'Invalid role.'}, status=status.HTTP_400_BAD_REQUEST)


class ToggleSuperadminView(APIView):
    permission_classes = [IsSuperAdminUser]

    def post(self, request, pk):
        try:
            target_user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
            
        if target_user.role != 'admin':
            return Response({'error': 'Only administrators can be promoted to superadmin.'}, status=status.HTTP_400_BAD_REQUEST)
            
        if target_user.email == 'vsbuvaneshraj06@gmail.com':
            return Response({'error': 'The primary superadmin account privileges cannot be modified.'}, status=status.HTTP_403_FORBIDDEN)
            
        target_user.is_superadmin = not target_user.is_superadmin
        # When promoted to superadmin, they should also automatically be approved admins/users
        if target_user.is_superadmin:
            target_user.is_approved_admin = True
            target_user.is_approved = True
        target_user.save()
        
        status_str = 'promoted to superadmin' if target_user.is_superadmin else 'demoted from superadmin'
        notify_original_superadmin(current_user, f"{status_str} status", target=target_user)
        
        return Response({
            'message': f'Administrator {target_user.email} has been successfully {status_str}.',
            'user': UserSerializer(target_user).data
        }, status=status.HTTP_200_OK)
