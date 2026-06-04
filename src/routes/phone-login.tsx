import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PhoneAuth } from "@/components/auth/phone-auth";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/phone-login")({
  component: PhoneLoginPage,
});

function PhoneLoginPage() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate({ to: "/phone-dashboard", replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  const handleSuccess = (user: any) => {
    toast.success("Successfully logged in!");
    navigate({ to: "/phone-dashboard", replace: true });
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8">
        <h2 className="text-center text-3xl font-extrabold text-slate-900">
          Sign in to your account
        </h2>
      </div>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <PhoneAuth onSuccess={handleSuccess} />
      </div>
    </div>
  );
}
