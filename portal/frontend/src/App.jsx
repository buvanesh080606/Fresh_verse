import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { PrivateRoute, OnboardingRoute, MainAppRoute } from './components/common/RouteGuard';

// Layouts
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';

// Views
import Login from './features/auth/views/Login';
import Onboard from './features/auth/views/Onboard';
import PendingApproval from './features/auth/views/PendingApproval';
import StudentDashboard from './features/dashboard/views/StudentDashboard';
import AdminDashboard from './features/dashboard/views/AdminDashboard';
import TimetableGrid from './features/timetable/views/TimetableGrid';
import EventsHub from './features/events/views/EventsHub';
import TransportView from './features/transport/views/TransportView';
import FacultyDirectory from './features/faculty/views/FacultyDirectory';
import CampusInfoView from './features/campus/views/CampusInfoView';
import ChatAssistant from './features/chat/views/ChatAssistant';
import ClubsHub from './features/clubs/views/ClubsHub';
import AnnouncementsView from './features/events/views/AnnouncementsView';
import SettingsView from './features/dashboard/views/SettingsView';

// Admin Views
import AdminApprovals from './features/admin-panel/views/AdminApprovals';
import AdminParser from './features/admin-panel/views/AdminParser';
import AdminEvents from './features/admin-panel/views/AdminEvents';
import AdminAnnouncements from './features/admin-panel/views/AdminAnnouncements';
import AdminTransport from './features/admin-panel/views/AdminTransport';
import AdminCampusDirectory from './features/admin-panel/views/AdminCampusDirectory';
import AdminAcademicCalendar from './features/admin-panel/views/AdminAcademicCalendar';
import AdminHostels from './features/admin-panel/views/AdminHostels';
import AdminClubs from './features/admin-panel/views/AdminClubs';
import AdminFaculty from './features/admin-panel/views/AdminFaculty';

import './App.css';

// Master Layout for Authenticated Pages
const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-brand-bg dark:bg-brand-bg-dark transition-colors duration-300">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            
            {/* Public Login Route */}
            <Route path="/login" element={<Login />} />

            {/* Pending Approval Route */}
            <Route path="/pending-approval" element={<PendingApproval />} />

            {/* Onboarding View (Authenticated but not Onboarded) */}
            <Route 
              path="/onboard" 
              element={
                <OnboardingRoute>
                  <Onboard />
                </OnboardingRoute>
              } 
            />

            {/* Master Application Layout (Private & Onboard Check) */}
            <Route element={<AppLayout />}>
              
              {/* Student Routes */}
              <Route 
                path="/dashboard" 
                element={
                  <PrivateRoute allowedRoles={['student']}>
                    <MainAppRoute>
                      <StudentDashboard />
                    </MainAppRoute>
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/timetable" 
                element={
                  <PrivateRoute allowedRoles={['student']}>
                    <MainAppRoute>
                      <TimetableGrid />
                    </MainAppRoute>
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/events" 
                element={
                  <PrivateRoute allowedRoles={['student']}>
                    <MainAppRoute>
                      <EventsHub />
                    </MainAppRoute>
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/announcements" 
                element={
                  <PrivateRoute allowedRoles={['student']}>
                    <MainAppRoute>
                      <AnnouncementsView />
                    </MainAppRoute>
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <PrivateRoute allowedRoles={['student']}>
                    <MainAppRoute>
                      <SettingsView />
                    </MainAppRoute>
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/transport" 
                element={
                  <PrivateRoute allowedRoles={['student']}>
                    <MainAppRoute>
                      <TransportView />
                    </MainAppRoute>
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/faculty" 
                element={
                  <PrivateRoute allowedRoles={['student']}>
                    <MainAppRoute>
                      <FacultyDirectory />
                    </MainAppRoute>
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/hostel-campus" 
                element={
                  <PrivateRoute allowedRoles={['student']}>
                    <MainAppRoute>
                      <CampusInfoView />
                    </MainAppRoute>
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/hostels" 
                element={
                  <PrivateRoute allowedRoles={['student']}>
                    <MainAppRoute>
                      <CampusInfoView />
                    </MainAppRoute>
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/calendar" 
                element={
                  <PrivateRoute allowedRoles={['student']}>
                    <MainAppRoute>
                      <CampusInfoView />
                    </MainAppRoute>
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/assistant" 
                element={
                  <PrivateRoute allowedRoles={['student']}>
                    <MainAppRoute>
                      <ChatAssistant />
                    </MainAppRoute>
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/clubs" 
                element={
                  <PrivateRoute allowedRoles={['student']}>
                    <MainAppRoute>
                      <ClubsHub />
                    </MainAppRoute>
                  </PrivateRoute>
                } 
              />

              {/* Admin Routes */}
               <Route 
                path="/admin/dashboard" 
                element={
                  <PrivateRoute allowedRoles={['admin']}>
                    <MainAppRoute>
                      <AdminDashboard />
                    </MainAppRoute>
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/admin/approvals" 
                element={
                  <PrivateRoute allowedRoles={['admin']}>
                    <MainAppRoute>
                      <AdminApprovals />
                    </MainAppRoute>
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/admin/timetable-manage" 
                element={
                  <PrivateRoute allowedRoles={['admin']}>
                    <MainAppRoute>
                      <AdminParser />
                    </MainAppRoute>
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/admin/events" 
                element={
                  <PrivateRoute allowedRoles={['admin']}>
                    <MainAppRoute>
                      <AdminEvents />
                    </MainAppRoute>
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/admin/announcements" 
                element={
                  <PrivateRoute allowedRoles={['admin']}>
                    <MainAppRoute>
                      <AdminAnnouncements />
                    </MainAppRoute>
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/admin/transport" 
                element={
                  <PrivateRoute allowedRoles={['admin']}>
                    <MainAppRoute>
                      <AdminTransport />
                    </MainAppRoute>
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/admin/campus-directory" 
                element={
                  <PrivateRoute allowedRoles={['admin']}>
                    <MainAppRoute>
                      <AdminCampusDirectory />
                    </MainAppRoute>
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/admin/calendar" 
                element={
                  <PrivateRoute allowedRoles={['admin']}>
                    <MainAppRoute>
                      <AdminAcademicCalendar />
                    </MainAppRoute>
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/admin/hostels" 
                element={
                  <PrivateRoute allowedRoles={['admin']}>
                    <MainAppRoute>
                      <AdminHostels />
                    </MainAppRoute>
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/admin/clubs" 
                element={
                  <PrivateRoute allowedRoles={['admin']}>
                    <MainAppRoute>
                      <AdminClubs />
                    </MainAppRoute>
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/admin/faculty" 
                element={
                  <PrivateRoute allowedRoles={['admin']}>
                    <MainAppRoute>
                      <AdminFaculty />
                    </MainAppRoute>
                  </PrivateRoute>
                } 
              />

            </Route>

            {/* Fallback redirection */}
            <Route path="*" element={<Navigate to="/login" replace />} />

          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
