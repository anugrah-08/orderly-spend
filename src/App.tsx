import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Vendors from "./pages/Vendors";
import Products from "./pages/Products";
import PurchaseRequests from "./pages/PurchaseRequests";
import Approvals from "./pages/Approvals";
import PurchaseOrders from "./pages/PurchaseOrders";
import Invoices from "./pages/Invoices";
import Payments from "./pages/Payments";
import Reports from "./pages/Reports";
import Notifications from "./pages/Notifications";
import SettingsPage from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="*" element={
            <AppLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/vendors" element={<Vendors />} />
                <Route path="/products" element={<Products />} />
                <Route path="/purchase-requests" element={<PurchaseRequests />} />
                <Route path="/approvals" element={<Approvals />} />
                <Route path="/purchase-orders" element={<PurchaseOrders />} />
                <Route path="/invoices" element={<Invoices />} />
                <Route path="/payments" element={<Payments />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppLayout>
          } />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
