import { createFileRoute, Outlet, useNavigate, useRouterState, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, ListChecks, CheckCircle2, Clock, XCircle, Download, LogOut, Menu, X,
} from "lucide-react";
import { ACADEMY_NAME, ACADEMY_TAGLINE } from "@/lib/constants";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Panel — YCC Education" }] }),
  component: AdminLayout,
});

export const ADMIN_TOKEN_KEY = "ycc-admin-token";

function AdminLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem(ADMIN_TOKEN_KEY) : null;
    if (!token && pathname !== "/admin/login") {
      navigate({ to: "/admin/login", replace: true });
    } else if (token && pathname === "/admin") {
      navigate({ to: "/admin/dashboard", replace: true });
    }
    setReady(true);
  }, [pathname, navigate]);

  if (pathname === "/admin/login") {
    return <Outlet />;
  }

  if (!ready) return null;

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-primary text-primary-foreground transition-transform md:relative md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
          <div>
            <div className="text-sm font-bold">{ACADEMY_NAME}</div>
            <div className="text-[10px] opacity-70">{ACADEMY_TAGLINE}</div>
          </div>
          <button className="md:hidden" onClick={() => setOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="space-y-1 p-3 text-sm">
          <NavItem to="/admin/dashboard" icon={LayoutDashboard}>Dashboard</NavItem>
          <NavItem to="/admin/applications" icon={ListChecks}>All Applications</NavItem>
          <NavItem to="/admin/applications" search={{ status: "approved" }} icon={CheckCircle2}>Approved</NavItem>
          <NavItem to="/admin/applications" search={{ status: "pending" }} icon={Clock}>Pending</NavItem>
          <NavItem to="/admin/applications" search={{ status: "rejected" }} icon={XCircle}>Rejected</NavItem>
          <NavItem to="/admin/applications" search={{ export: "1" }} icon={Download}>Export Data</NavItem>
          <button
            onClick={() => {
              localStorage.removeItem(ADMIN_TOKEN_KEY);
              navigate({ to: "/admin/login", replace: true });
            }}
            className="mt-4 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-4 shadow-sm">
          <div className="flex items-center gap-3">
            <button className="md:hidden" onClick={() => setOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <div className="text-sm font-bold text-primary">YCC Education — Admin Panel</div>
              <div className="text-[11px] text-muted-foreground">JEE | NEET | MHT-CET | Admission Guidance</div>
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem(ADMIN_TOKEN_KEY);
              navigate({ to: "/admin/login", replace: true });
            }}
            className="flex items-center gap-2 rounded-lg border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
          >
            <LogOut className="h-3.5 w-3.5" /> Logout
          </button>
        </header>
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavItem({
  to, search, icon: Icon, children,
}: {
  to: string;
  search?: Record<string, string>;
  icon: any;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      search={search as any}
      className="flex items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-white/10"
      activeProps={{ className: "bg-white/15" }}
    >
      <Icon className="h-4 w-4" />
      <span>{children}</span>
    </Link>
  );
}
