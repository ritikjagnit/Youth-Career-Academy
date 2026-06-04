import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendEmailJS } from "@/lib/emailjs.server";

const EmailSchema = z.string().email().max(254).toLowerCase();

function generateOtp(): string {
  // Cryptographically-random 6-digit OTP
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return (100000 + (buf[0] % 900000)).toString();
}

function otpHtml(otp: string) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#ffffff;color:#0f172a">
      <h2 style="color:#1a3c6e;margin:0 0 8px">YCC Education Admission Help Center</h2>
      <p style="margin:0 0 16px;color:#475569">Your One-Time Password for admission registration:</p>
      <div style="font-size:34px;font-weight:700;letter-spacing:10px;color:#f97316;background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:18px;text-align:center">${otp}</div>
      <p style="margin:18px 0 6px;color:#475569">This OTP is valid for <b>10 minutes</b>.</p>
      <p style="margin:0;color:#94a3b8;font-size:12px">Do not share this OTP with anyone. If you did not request it, ignore this email.</p>
    </div>`;
}

export const sendOtp = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ email: EmailSchema }).parse(input))
  .handler(async ({ data }) => {
    const email = data.email;

    // Invalidate previous unused OTPs for this email
    await supabaseAdmin
      .from("otp_verifications")
      .update({ is_used: true })
      .eq("email", email)
      .eq("is_used", false);

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from("otp_verifications")
      .insert({ email, otp_code: otp, expires_at: expiresAt })
      .select("id")
      .single();
    if (insertErr) throw new Error(insertErr.message);

    const sent = await sendEmailJS({
      to: email,
      subject: "Your OTP - YCC Education Admission Help Center",
      html: otpHtml(otp),
      passcode: otp,
    });

    if (!sent.ok) {
      if (inserted?.id) {
        await supabaseAdmin
          .from("otp_verifications")
          .update({ is_used: true })
          .eq("id", inserted.id);
      }
      return { ok: false as const, message: sent.message };
    }

    return { ok: true as const };
  });

export const verifyOtp = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        email: EmailSchema,
        otp: z.string().regex(/^\d{6}$/),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("otp_verifications")
      .select("*")
      .eq("email", data.email)
      .eq("otp_code", data.otp)
      .eq("is_used", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!row) {
      return { ok: false as const, message: "Invalid or expired OTP" };
    }

    const { error: updErr } = await supabaseAdmin
      .from("otp_verifications")
      .update({ is_used: true })
      .eq("id", row.id);
    if (updErr) throw new Error(updErr.message);

    return { ok: true as const, message: "OTP verified successfully" };
  });
