import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/common/ProtectedRoute'
import AdminRoute from './components/admin/AdminRoute'
import queryClient from './lib/queryClient'
import Layout from './components/layout/Layout'
import AdminLayout from './components/admin/AdminLayout'
import SiteLayout from './components/site/SiteLayout'

// Auth Pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import OTPVerification from './pages/auth/OTPVerification'
import TwoFactor from './pages/auth/TwoFactor'

// Site Pages
import Home from './pages/site/Home'
import Features from './pages/site/Features'
import Pricing from './pages/site/Pricing'
import About from './pages/site/About'
import Contact from './pages/site/Contact'

// App Pages
import Dashboard from './pages/Dashboard'
import CustomerList from './pages/kyc/CustomerList'
import AddCustomer from './pages/kyc/AddCustomer'
import CustomerDetail from './pages/kyc/CustomerDetail'
import CustomerStatusCheck from './pages/kyc/CustomerStatusCheck'
import AMLScreening from './pages/aml/AMLScreening'
import AlertsTable from './pages/aml/AlertsTable'
import Watchlist from './pages/aml/Watchlist'
import Invoices from './pages/accounting/Invoices'
import Expenses from './pages/accounting/Expenses'
import Transactions from './pages/accounting/Transactions'
import ProfitLoss from './pages/accounting/ProfitLoss'
import BalanceSheet from './pages/accounting/BalanceSheet'
import VATReports from './pages/accounting/VATReports'
import CorporateTax from './pages/accounting/CorporateTax'
import TransactionMonitoring from './pages/monitoring/TransactionMonitoring'
import Reports from './pages/reports/Reports'
import UserManagement from './pages/users/UserManagement'
import Settings from './pages/Settings'
import Billing from './pages/Billing'

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminOrganizations from './pages/admin/AdminOrganizations'
import AdminUsers from './pages/admin/AdminUsers'
import AdminBilling from './pages/admin/AdminBilling'

function P({ children, perm }) {
  return (
    <ProtectedRoute permission={perm}>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Marketing */}
              <Route path="/" element={<SiteLayout><Home /></SiteLayout>} />
              <Route path="/features" element={<SiteLayout><Features /></SiteLayout>} />
              <Route path="/pricing" element={<SiteLayout><Pricing /></SiteLayout>} />
              <Route path="/about" element={<SiteLayout><About /></SiteLayout>} />
              <Route path="/contact" element={<SiteLayout><Contact /></SiteLayout>} />

              {/* Auth */}
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/register" element={<Register />} />
              <Route path="/auth/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/otp-verify" element={<OTPVerification />} />
              <Route path="/auth/2fa" element={<TwoFactor />} />

              {/* Dashboard */}
              <Route path="/dashboard" element={<P><Dashboard /></P>} />

              {/* KYC */}
              <Route path="/kyc/customers" element={<P perm="kyc:read"><CustomerList /></P>} />
              <Route path="/kyc/add-customer" element={<P perm="kyc:write"><AddCustomer /></P>} />
              <Route path="/kyc/customers/:id" element={<P perm="kyc:read"><CustomerDetail /></P>} />
              <Route path="/kyc/customers/:id/status-check" element={<P perm="kyc:read"><CustomerStatusCheck /></P>} />

              {/* AML */}
              <Route path="/aml/screening" element={<P perm="aml:read"><AMLScreening /></P>} />
              <Route path="/aml/alerts" element={<P perm="aml:read"><AlertsTable /></P>} />
              <Route path="/aml/watchlist" element={<P perm="aml:read"><Watchlist /></P>} />

              {/* Accounting */}
              <Route path="/accounting/invoices" element={<P perm="accounting:read"><Invoices /></P>} />
              <Route path="/accounting/expenses" element={<P perm="accounting:read"><Expenses /></P>} />
              <Route path="/accounting/transactions" element={<P perm="accounting:read"><Transactions /></P>} />
              <Route path="/accounting/profit-loss" element={<P perm="accounting:read"><ProfitLoss /></P>} />
              <Route path="/accounting/balance-sheet" element={<P perm="accounting:read"><BalanceSheet /></P>} />
              <Route path="/accounting/vat-reports" element={<P perm="tax:read"><VATReports /></P>} />
              <Route path="/accounting/corporate-tax" element={<P perm="tax:read"><CorporateTax /></P>} />

              {/* Monitoring */}
              <Route path="/monitoring" element={<P perm="aml:read"><TransactionMonitoring /></P>} />

              {/* Reports */}
              <Route path="/reports" element={<P perm="reports:read"><Reports /></P>} />

              {/* Admin */}
              <Route path="/users" element={<P perm="users:read"><UserManagement /></P>} />
              <Route path="/settings" element={<P perm="org:read"><Settings /></P>} />
              <Route path="/billing" element={<P perm="billing:read"><Billing /></P>} />

              {/* Admin Panel */}
              <Route path="/admin" element={<AdminRoute><AdminLayout><AdminDashboard /></AdminLayout></AdminRoute>} />
              <Route path="/admin/organizations" element={<AdminRoute><AdminLayout><AdminOrganizations /></AdminLayout></AdminRoute>} />
              <Route path="/admin/users" element={<AdminRoute><AdminLayout><AdminUsers /></AdminLayout></AdminRoute>} />
              <Route path="/admin/billing" element={<AdminRoute><AdminLayout><AdminBilling /></AdminLayout></AdminRoute>} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
