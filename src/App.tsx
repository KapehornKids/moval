
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import Profile from '@/pages/Profile';
import Association from '@/pages/Association';
import Justice from '@/pages/Justice';
import JusticeAdmin from '@/pages/JusticeAdmin';
import BankerAdmin from '@/pages/BankerAdmin';
import Users from '@/pages/Users';
import SendMoney from '@/pages/SendMoney';
import ReceiveMoney from '@/pages/ReceiveMoney';
import Chainbook from '@/pages/Chainbook';
import Privacy from '@/pages/Privacy';
import Terms from '@/pages/Terms';
import Loans from '@/pages/Loans';
import Voting from '@/pages/Voting';
import NotFound from '@/pages/NotFound';
import { AuthProvider } from '@/hooks/useAuth';
import AdminSetup from '@/pages/AdminSetup';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ThemeProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            
            {/* Regular user routes */}
            <Route path="/send-money" element={<SendMoney />} />
            <Route path="/receive-money" element={<ReceiveMoney />} />
            <Route path="/chainbook" element={<Chainbook />} />
            <Route path="/loans" element={<Loans />} />
            <Route path="/voting" element={<Voting />} />
            
            {/* Admin routes */}
            <Route path="/association" element={<Association />} />
            <Route path="/justice" element={<Justice />} />
            <Route path="/justice-admin" element={<JusticeAdmin />} />
            <Route path="/banker-admin" element={<BankerAdmin />} />
            <Route path="/users" element={<Users />} />
            <Route path="/admin-setup" element={<AdminSetup />} />
            
            {/* Static pages */}
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            
            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </ThemeProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
