import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Container, Box } from '@mui/material';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './features/auth/LoginPage';
import OrdersPage from './features/orders/OrdersPage';
import ProductsPage from './features/products/ProductsPage';
import CustomersPage from './features/customers/CustomersPage';
import StoresPage from './features/stores/StoresPage';

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box display="flex" height="100vh">
      <Sidebar />
      <Box flexGrow={1} ml="260px" display="flex" flexDirection="column">
        <Topbar />
        <Box
          component="main"
          sx={{
            flex: 1,
            overflow: 'auto',
            backgroundColor: '#f8fafc',
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
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout>
                <OrdersPage />
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
          path="/clientes"
          element={
            <ProtectedRoute>
              <AppLayout>
                <CustomersPage />
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
      </Routes>
    </BrowserRouter>
  );
}
