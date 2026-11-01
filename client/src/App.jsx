import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Categories from './pages/Categories/Categories';
import Suppliers from './pages/Suppliers/Suppliers';
import Products from './pages/Products/Products';
import Customers from './pages/Customers/Customers';
import PurchaseOrders from './pages/PurchaseOrders/PurchaseOrders';
import Sales from './pages/Sales/Sales';
import Reports from './pages/Reports/Reports';
import Staff from './pages/Staff/Staff';
import InvoicePrint from './components/sales/Invoiceprint'; 

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* ✅ Invoice outside MainLayout — clean print page, no sidebar */}
      <Route
        path="/sales/:id/invoice"
        element={
          <ProtectedRoute>
            <InvoicePrint />
          </ProtectedRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <MainLayout title="POS System" />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/reports" element={<ProtectedRoute adminOnly><Reports /></ProtectedRoute>} />
        <Route path="/staff" element={<ProtectedRoute adminOnly><Staff /></ProtectedRoute>} />
        <Route path="/products" element={<Products />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/purchase-orders" element={<ProtectedRoute adminOnly><PurchaseOrders /></ProtectedRoute>} />
        <Route path="/categories" element={<ProtectedRoute adminOnly><Categories /></ProtectedRoute>} />
        <Route path="/suppliers" element={<ProtectedRoute adminOnly><Suppliers /></ProtectedRoute>} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}