import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { adminUpdateStatus } from "@/lib/admin.functions";
import { downloadReceipt, exportApplicationsToExcel } from "@/lib/pdf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Search, Download, FileText, Loader2, ChevronLeft, ChevronRight, Inbox,
} from "lucide-react";

const searchSchema = z.object({
  status: z.enum(["all", "pending", "under_review", "approved", "rejected"]).optional(),
  export: z.string().optional(),
});

export const Route = createFileRoute("/admin/applications")({
  validateSearch: searchSchema,
  component: ApplicationsPage,
});

const PAGE_SIZE = 20;

function ApplicationsPage() {
  const search = Route.useSearch();
  const [rows, setRows] = useState<any[] | null>(null);
  const [q, setQ] = useState("");
  const [streamFilter, setStreamFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<string>(search.status ?? "all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<any | null>(null);
  const updateFn = useServerFn(adminUpdateStatus);

  useEffect(() => {
    setStatusFilter(search.status ?? "all");
    setPage(1);
  }, [search.status]);

  const load = async () => {
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) return toast.error(error.message);
    setRows(data ?? []);
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  const filtered = useMemo(() => {
    return (rows ?? []).filter((r) => {
      if (streamFilter !== "all" && r.stream !== streamFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (from && new Date(r.created_at) < new Date(from)) return false;
      if (to && new Date(r.created_at) > new Date(to + "T23:59:59")) return false;
      if (q) {
        const s = q.toLowerCase();
        if (
          !r.full_name?.toLowerCase().includes(s) &&
          !r.mobile?.includes(s) &&
          !r.email?.toLowerCase().includes(s) &&
          !r.application_id?.toLowerCase().includes(s)
        ) return false;
      }
      return true;
    });
  }, [rows, q, streamFilter, statusFilter, from, to]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [q, streamFilter, statusFilter, from, to]);

  const updateStatus = async (appId: string, status: string) => {
    const pw = localStorage.getItem("ycc-admin-pw") ?? "";
    const tId = toast.loading("Updating…");
    try {
      await updateFn({ data: { password: pw, applicationId: appId, status: status as any } });
      toast.success("Status updated", { id: tId });
      load();
      if (selected?.application_id === appId) setSelected({ ...selected, status });
    } catch (e: any) {
      toast.error(e.message ?? "Failed", { id: tId });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-primary">All Applications</h1>
        <Button variant="outline" onClick={() => exportApplicationsToExcel(filtered)}>
          <Download className="mr-2 h-4 w-4" /> Export Excel
        </Button>
      </div>

      {/* Filters */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name, mobile, email, App ID…"
            className="pl-9"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Select value={streamFilter} onValueChange={setStreamFilter}>
          <SelectTrigger><SelectValue placeholder="Stream" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Streams</SelectItem>
            {["Engineering", "Nursing", "Agriculture", "Pharmacy", "Medical"].map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">App ID</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Mobile</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Stream</th>
                <th className="px-3 py-2">College</th>
                <th className="px-3 py-2">Branch</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">City</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows === null && (
                <tr>
                  <td colSpan={12} className="p-3">
                    <Skeleton className="h-8" />
                  </td>
                </tr>
              )}
              {rows !== null && paged.length === 0 && (
                <tr>
                  <td colSpan={12} className="p-12 text-center text-muted-foreground">
                    <Inbox className="mx-auto mb-2 h-10 w-10 opacity-40" />
                    No applications found.
                  </td>
                </tr>
              )}
              {paged.map((r, i) => (
                <tr
                  key={r.id}
                  className={`border-t hover:bg-muted/40 ${i % 2 ? "bg-muted/20" : ""}`}
                >
                  <td className="cursor-pointer px-3 py-2 font-mono text-xs" onClick={() => setSelected(r)}>{r.application_id}</td>
                  <td className="cursor-pointer px-3 py-2 font-medium" onClick={() => setSelected(r)}>{r.full_name}</td>
                  <td className="px-3 py-2">{r.mobile}</td>
                  <td className="px-3 py-2 max-w-[160px] truncate">{r.email}</td>
                  <td className="px-3 py-2">{r.stream}</td>
                  <td className="px-3 py-2 max-w-[160px] truncate">{r.college_name}</td>
                  <td className="px-3 py-2 max-w-[120px] truncate">{r.branch_name || "-"}</td>
                  <td className="px-3 py-2">{r.category}</td>
                  <td className="px-3 py-2">{r.city_preference || "-"}</td>
                  <td className="px-3 py-2 text-xs">
                    {new Date(r.created_at).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-3 py-2"><StatusPill s={r.status} /></td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <Select
                        value={r.status}
                        onValueChange={(v) => updateStatus(r.application_id, v)}
                      >
                        <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="under_review">Under Review</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                      <button
                        onClick={() => downloadReceipt(r)}
                        title="Download PDF"
                        className="rounded p-1 hover:bg-muted"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
            <div>
              Showing {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-2">Page {page} / {pageCount}</span>
              <Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => setPage(page + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Details modal */}
      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-primary">
                  {selected.full_name} · {selected.application_id}
                </DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                {Object.entries(selected).map(([k, v]) => (
                  <div key={k} className="border-b border-border/40 py-1">
                    <div className="text-[10px] uppercase text-muted-foreground">{k}</div>
                    <div className="break-words">{String(v ?? "-")}</div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 pt-3">
                <Select
                  value={selected.status}
                  onValueChange={(v) => updateStatus(selected.application_id, v)}
                >
                  <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => downloadReceipt(selected)} variant="outline">
                  <FileText className="mr-2 h-4 w-4" /> Download PDF
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusPill({ s }: { s: string }) {
  const map: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 border border-yellow-300",
    under_review: "bg-blue-100 text-blue-800 border border-blue-300",
    approved: "bg-green-100 text-green-800 border border-green-300",
    rejected: "bg-red-100 text-red-800 border border-red-300",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${map[s] ?? ""}`}>
      {s?.replace("_", " ")}
    </span>
  );
}
