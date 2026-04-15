import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from '@/components/layout/Layout';

// Pages
import Home from '@/pages/Home';
import Cabins from '@/pages/Cabins';
import CabinDetail from '@/pages/CabinDetail';
import Transport from '@/pages/Transport';
import TransportDetail from '@/pages/TransportDetail';
import Dashboard from '@/pages/Dashboard';
import CreateListing from '@/pages/CreateListing';
import RequestTransport from '@/pages/RequestTransport';
import RequestCabin from '@/pages/RequestCabin';
import Profile from '@/pages/Profile';
import BookingSuccess from '@/pages/BookingSuccess';
import BookingCancelled from '@/pages/BookingCancelled';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/cabins" element={<Cabins />} />
        <Route path="/cabins/:id" element={<CabinDetail />} />
        <Route path="/transport" element={<Transport />} />
        <Route path="/transport/:id" element={<TransportDetail />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/create-listing" element={<CreateListing />} />
        <Route path="/request-transport" element={<RequestTransport />} />
        <Route path="/request-cabin" element={<RequestCabin />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/booking-success" element={<BookingSuccess />} />
        <Route path="/booking-cancelled" element={<BookingCancelled />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App