import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FileText, Clock, CheckCircle2, CalendarDays } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const [rows, setRows] = useState<any[] | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);
    setRows(data ?? []);
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  if (!rows) {
    return (
      <div className="grid gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  const today = new Date().toDateString();
  const total = rows.length;
  const todayCount = rows.filter((r) => new Date(r.created_at).toDateString() === today).length;
  const pending = rows.filter((r) => r.status === "pending").length;
  const approved = rows.filter((r) => r.status === "approved").length;

  const streams = ["Engineering", "Nursing", "Agriculture", "Pharmacy", "Medical"];
  const chartData = streams.map((s) => ({
    stream: s,
    count: rows.filter((r) => r.stream === s).length,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">Dashboard</h1>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Applications" value={total} icon={FileText} color="bg-primary" />
        <StatCard label="Today's Applications" value={todayCount} icon={CalendarDays} color="bg-accent" />
        <StatCard label="Pending" value={pending} icon={Clock} color="bg-yellow-500" />
        <StatCard label="Approved" value={approved} icon={CheckCircle2} color="bg-green-600" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-4 lg:col-span-2">
          <h2 className="mb-3 font-semibold text-primary">Applications by Stream</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="stream" fontSize={12} />
                <YAxis fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#1a3c6e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-primary">Recent 5</h2>
            <Link to="/admin/applications" className="text-xs text-accent hover:underline">
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {rows.slice(0, 5).map((r) => (
              <div key={r.id} className="rounded-lg border p-2 text-xs">
                <div className="font-semibold">{r.full_name}</div>
                <div className="text-muted-foreground">
                  {r.application_id} · {r.stream}
                </div>
              </div>
            ))}
            {rows.length === 0 && (
              <p className="text-xs text-muted-foreground">No applications yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label, value, icon: Icon, color,
}: { label: string; value: number; icon: any; color: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
      <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${color} text-white`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-[11px] uppercase text-muted-foreground">{label}</div>
        <div className="text-2xl font-bold">{value}</div>
      </div>
    </div>
  );
}
