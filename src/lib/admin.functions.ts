import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendEmailJS } from "@/lib/emailjs.server";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "YCC@2025Admin";

const StatusSchema = z.enum(["pending", "under_review", "approved", "rejected"]);

async function sendAdminEmail(to: string, subject: string, html: string) {
  const res = await sendEmailJS({ to, subject, html });
  if (!res.ok) {
    console.warn(`[email] admin notification skipped: ${res.message}`);
  }
}

function approvedHtml(name: string, appId: string, stream: string, college: string) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f172a">
      <h2 style="color:#1a3c6e;margin:0 0 12px">Your Application Approved</h2>
      <p>Dear ${name},</p>
      <p>Congratulations! Your admission application
        (ID: <b style="color:#f97316">${appId}</b>) has been <b>approved</b>.</p>
      <ul>
        <li><b>Selected Stream:</b> ${stream}</li>
        <li><b>Selected College:</b> ${college}</li>
      </ul>
      <p>Please contact us for the next steps.</p>
      <p style="margin-top:18px">— YCC Education Admission Help Center<br/>Contact: 9876543210</p>
    </div>`;
}

function rejectedHtml(name: string, appId: string) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f172a">
      <h2 style="color:#1a3c6e;margin:0 0 12px">Application Status Update</h2>
      <p>Dear ${name},</p>
      <p>We regret to inform you that your application
        (ID: <b>${appId}</b>) could not be processed at this time.</p>
      <p>Please contact us for more information.</p>
      <p style="margin-top:18px">— YCC Education Admission Help Center<br/>Contact: 9876543210</p>
    </div>`;
}

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ password: z.string().min(1).max(200) }).parse(input),
  )
  .handler(async ({ data }) => {
    if (data.password !== ADMIN_PASSWORD) return { ok: false as const };
    const token = btoa(`admin:${Date.now()}:${Math.random().toString(36).slice(2)}`);
    return { ok: true as const, token };
  });

export const adminUpdateStatus = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        password: z.string().min(1).max(200),
        applicationId: z.string().min(1).max(40),
        status: StatusSchema,
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    if (data.password !== ADMIN_PASSWORD) throw new Error("Unauthorized");

    const { data: row, error: fetchErr } = await supabaseAdmin
      .from("applications")
      .select("application_id, full_name, email, stream, college_name")
      .eq("application_id", data.applicationId)
      .maybeSingle();
    if (fetchErr) throw new Error(fetchErr.message);
    if (!row) throw new Error("Application not found");

    const { error } = await supabaseAdmin
      .from("applications")
      .update({ status: data.status })
      .eq("application_id", data.applicationId);
    if (error) throw new Error(error.message);

    if (data.status === "approved" && row.email) {
      await sendAdminEmail(
        row.email,
        "Your Application Approved — YCC Education Help Center",
        approvedHtml(row.full_name, row.application_id, row.stream, row.college_name),
      );
    } else if (data.status === "rejected" && row.email) {
      await sendAdminEmail(
        row.email,
        "Application Status Update — YCC Education Help Center",
        rejectedHtml(row.full_name, row.application_id),
      );
    }

    return { ok: true as const };
  });
