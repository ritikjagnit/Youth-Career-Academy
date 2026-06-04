import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { adminLogin } from "@/lib/admin.functions";
import { ADMIN_TOKEN_KEY } from "./admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, GraduationCap } from "lucide-react";
import { ACADEMY_NAME, ACADEMY_TAGLINE, ADMIN_USERNAME, ADMIN_PASSWORD } from "@/lib/constants";

export const Route = createFileRoute("/admin/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const loginFn = useServerFn(adminLogin);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem(ADMIN_TOKEN_KEY)) {
      navigate({ to: "/admin/dashboard", replace: true });
    }
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      toast.error("Invalid username or password");
      return;
    }
    setLoading(true);
    try {
      const res = await loginFn({ data: { password } });
      if (!res.ok) {
        toast.error("Server rejected credentials");
        return;
      }
      localStorage.setItem(ADMIN_TOKEN_KEY, res.token);
      localStorage.setItem("ycc-admin-pw", password);
      toast.success("Welcome");
      navigate({ to: "/admin/dashboard", replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary to-primary-glow p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b pb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <div className="text-base font-bold text-primary">{ACADEMY_NAME}</div>
            <div className="text-[11px] text-muted-foreground">{ACADEMY_TAGLINE}</div>
          </div>
        </div>
        <h2 className="mt-4 text-lg font-semibold text-primary">Admin Login</h2>
        <p className="text-xs text-muted-foreground">Sign in to manage applications.</p>
        <div className="mt-4 space-y-3">
          <div>
            <Label className="text-xs">Username</Label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
          </div>
          <div>
            <Label className="text-xs">Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-primary">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Login
          </Button>
        </div>
      </form>
    </div>
  );
}
