import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import MembershipPage from "@/pages/membership-page";
import AddMemberPage from "@/pages/add-member-page";
import FestivalPage from "@/pages/festival";
import WhatsAppLogin from "./pages/whatsapp";
import RegisterForm from "./components/auth/register-form";
import ProductCatalogPage from "@/pages/product-catalog-page";
import TrainerManagementPage from "@/pages/trainer-management-page";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/membership" component={MembershipPage} />
      <ProtectedRoute path="/add-member" component={AddMemberPage} />
      <ProtectedRoute path="/products" component={ProductCatalogPage} />
      <ProtectedRoute
        path="/trainer-management"
        component={TrainerManagementPage}
      />
      <ProtectedRoute path="/festival" component={FestivalPage} />
      <ProtectedRoute path="/whatsapp" component={() => <WhatsAppLogin />} />
      <ProtectedRoute path="/trainer" component={() => <RegisterForm />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
