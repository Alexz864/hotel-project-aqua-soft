import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './pages/AuthPage';
import MainPage from './pages/MainPage';
import UsersPage from './pages/UsersPage';
import HotelsManagementPage from './pages/HotelsManagementPage';
import Navbar from './components/Navbar';
import DataOperatorRoute from './components/DataOperatorRoute';
import AdminRoute from './components/AdminRoute';
import { Loader2 } from 'lucide-react';
import DetailsPage from './pages/DetailsPage';
import ManagerDashboard from './pages/ManagerDashboard';


const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
 
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }
 
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

//auth only route component (redirects to main page if authenticated)
const AuthOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/" replace /> : <>{children}</>;
};

//navbar component for all pages
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      {children}
    </div>
  );
};

//app router component
const AppRouter: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* login page - only accessible when not authenticated */}
        <Route 
          path="/login" 
          element={
            <AuthOnlyRoute>
              <AuthPage />
            </AuthOnlyRoute>
          } 
        />
        
        {/* main page - accessible to everyone */}
        <Route 
          path="/" 
          element={
            <AppLayout>
              <MainPage />
            </AppLayout>
          } 
        />

        {/* hotel details page - accessible to everyone */}
        <Route 
          path="/hotels/:id" 
          element={
            <AppLayout>
              <DetailsPage />
            </AppLayout>
          } 
        />

        <Route
          path="/manager"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ManagerDashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* hotels management page - data operators and admins only */}
        <Route 
          path="/hotels-management" 
          element={
            <AppLayout>
              <DataOperatorRoute>
                <HotelsManagementPage />
              </DataOperatorRoute>
            </AppLayout>
          } 
        />

        {/* users page - admin only */}
        <Route 
          path="/users" 
          element={
            <AppLayout>
              <AdminRoute>
                <UsersPage />
              </AdminRoute>
            </AppLayout>
          } 
        />

        {/*redirect to main page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

//main app component
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
};

export default App;