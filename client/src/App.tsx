import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/LoginPage";
import PosterGenerator from "@/pages/PosterGenerator";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

function PrivateRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();

  // Show loading spinner while auth state is being determined
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Redirect to="/login" />;
  }

  return <Component />;
}

function Router() {
  const [, setLocation] = useLocation();

  // Listen for auth redirect events from api-client
  useEffect(() => {
    const handleAuthRedirect = (event: CustomEvent) => {
      setLocation(event.detail);
    };

    window.addEventListener('auth-redirect', handleAuthRedirect as EventListener);
    return () => {
      window.removeEventListener('auth-redirect', handleAuthRedirect as EventListener);
    };
  }, [setLocation]);

  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/poster-generator">
        <PrivateRoute component={PosterGenerator} />
      </Route>
      
      {/* Default Redirect */}
      <Route path="/">
        <Redirect to="/poster-generator" />
      </Route>

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();
  const [location] = useLocation();

  // Show global loading only on initial app load and not on login page
  if (isLoading && location !== "/login") {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Initializing...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default App;
