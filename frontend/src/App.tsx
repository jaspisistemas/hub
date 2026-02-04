import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Container, Box } from '@mui/material';
import { ThemeContextProvider } from './contexts/ThemeContext';
import { SidebarContextProvider } from './contexts/SidebarContext';
import { useSidebar } from './contexts/SidebarContext';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './features/auth/LoginPage';
import DashboardPage from './features/dashboard/DashboardPage';
import OrdersPage from './features/orders/OrdersPage';
import ProductsPage from './features/products/ProductsPage';
import StoresPage from './features/stores/StoresPage';
import SupportPage from './features/support/SupportPage';

function AppLayout({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();
  const sidebarWidth = isCollapsed ? '80px' : '260px';

  return (
    <Box display="flex" height="100vh">
      <Sidebar />
      <Box flexGrow={1} ml={sidebarWidth} display="flex" flexDirection="column" sx={{ transition: 'margin-left 0.3s ease' }}>
        <Topbar />
        <Box
          component="main"
          sx={{
            flex: 1,
            overflow: 'auto',
            bgcolor: 'background.default',
            p: 3,
          }}
        >
          <Container maxWidth="lg">{children}</Container>
        </Box>
      </Box>
    </Box>
  );
}

export default function App() {
  return (
    <ThemeContextProvider>
      <SidebarContextProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout>
                <DashboardPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLayout>
                <DashboardPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/pedidos"
          element={
            <ProtectedRoute>
              <AppLayout>
                <OrdersPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/produtos"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ProductsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/lojas"
          element={
            <ProtectedRoute>
              <AppLayout>
                <StoresPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/atendimento"
          element={
            <ProtectedRoute>
              <AppLayout>
                <SupportPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  </SidebarContextProvider>
  </ThemeContextProvider>
  );
}
