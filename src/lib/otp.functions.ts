import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendEmailJS } from "@/lib/emailjs.server";

const EmailSchema = z.string().trim().email().max(254).toLowerCase();
const PhoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number");

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
    let row = null;
    let dbError = null;

    try {
      const { data: dbRow, error } = await supabaseAdmin
        .from("otp_verifications")
        .select("*")
        .eq("email", data.email)
        .eq("otp_code", data.otp)
        .eq("is_used", false)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      row = dbRow;
      if (error) dbError = error;
    } catch (err) {
      dbError = err;
    }

    if (!row) {
      // Check fallback store
      const fallback = fallbackStore.get(data.email);
      if (fallback && fallback.code === data.otp && new Date(fallback.expiresAt) > new Date()) {
        fallbackStore.delete(data.email);
        return { ok: true as const, message: "OTP verified successfully (Memory fallback)" };
      }
      return { ok: false as const, message: "Invalid or expired OTP" };
    }

    // Mark as used in DB
    try {
      await supabaseAdmin
        .from("otp_verifications")
        .update({ is_used: true })
        .eq("id", row.id);
    } catch (e) {
      console.warn("Could not mark OTP as used in DB");
    }

    return { ok: true as const, message: "OTP verified successfully" };
  });

import fs from "fs";
import path from "path";
import os from "os";

const TEMP_OTP_FILE = path.join(os.tmpdir(), "ycc_otp_fallback.json");

const fallbackStore = {
  get(email: string): { code: string; expiresAt: string } | undefined {
    try {
      if (fs.existsSync(TEMP_OTP_FILE)) {
        const data = JSON.parse(fs.readFileSync(TEMP_OTP_FILE, "utf-8"));
        return data[email];
      }
    } catch (e) {
      console.warn("Could not read fallback store");
    }
    return undefined;
  },
  set(email: string, val: { code: string; expiresAt: string }) {
    try {
      let data: any = {};
      if (fs.existsSync(TEMP_OTP_FILE)) {
        data = JSON.parse(fs.readFileSync(TEMP_OTP_FILE, "utf-8"));
      }
      data[email] = val;
      fs.writeFileSync(TEMP_OTP_FILE, JSON.stringify(data));
    } catch (e) {
      console.warn("Could not write fallback store");
    }
  },
  delete(email: string) {
    try {
      if (fs.existsSync(TEMP_OTP_FILE)) {
        const data = JSON.parse(fs.readFileSync(TEMP_OTP_FILE, "utf-8"));
        delete data[email];
        fs.writeFileSync(TEMP_OTP_FILE, JSON.stringify(data));
      }
    } catch (e) {}
  }
};

export const sendSmtpEmailOtp = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ email: EmailSchema }).parse(input))
  .handler(async ({ data }) => {
    const email = data.email;

    // Invalidate previous unused OTPs for this email
    try {
      await supabaseAdmin
        .from("otp_verifications")
        .update({ is_used: true })
        .eq("email", email)
        .eq("is_used", false);
    } catch (e) {
      console.warn("Could not update previous OTPs");
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    let insertId = null;
    try {
      const { data: inserted, error: insertErr } = await supabaseAdmin
        .from("otp_verifications")
        .insert({ email, otp_code: otp, expires_at: expiresAt })
        .select("id")
        .maybeSingle();
        
      if (insertErr) {
        console.warn("DB insert failed, using memory store:", insertErr.message);
        fallbackStore.set(email, { code: otp, expiresAt });
      } else if (inserted) {
        insertId = inserted.id;
      }
    } catch (dbCrash: any) {
      console.warn("DB connection failed, using memory store:", dbCrash.message);
      fallbackStore.set(email, { code: otp, expiresAt });
    }

    const SMTP_HOST = process.env.SMTP_HOST;
    const SMTP_PORT = process.env.SMTP_PORT || "465";
    const SMTP_USER = process.env.SMTP_USER;
    const SMTP_PASS = process.env.SMTP_PASS;

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      console.warn("SMTP credentials not found, using console log for OTP (Development Mode)");
      console.log(`[SMTP DEV MODE] OTP for ${email} is ${otp}`);
      return { ok: true as const, message: "Dev Mode: OTP logged to console" };
    }

    try {
      const nodemailer = (await import("nodemailer")).default;

      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT),
        secure: Number(SMTP_PORT) === 465, // true for 465, false for other ports
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      await transporter.sendMail({
        from: `"YCC Admission" <${SMTP_USER}>`,
        to: email,
        subject: "Your OTP - YCC Education Admission Help Center",
        html: otpHtml(otp),
      });

    } catch (err: any) {
      if (insertId) {
        try {
          await supabaseAdmin
            .from("otp_verifications")
            .update({ is_used: true })
            .eq("id", insertId);
        } catch (updateErr) {
          console.warn("Could not invalidate OTP on send failure");
        }
      } else {
        fallbackStore.delete(email);
      }
      return { ok: false as const, message: err.message };
    }

    return { ok: true as const };
  });

export const sendWhatsAppOtp = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ phone: PhoneSchema }).parse(input))
  .handler(async ({ data }) => {
    const phone = data.phone.replace("+", ""); // Meta API expects no '+'
    const pseudoEmail = `${phone}@whatsapp.com`;

    // Invalidate previous unused OTPs for this phone
    await supabaseAdmin
      .from("otp_verifications")
      .update({ is_used: true })
      .eq("email", pseudoEmail)
      .eq("is_used", false);

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    let insertId = null;
    try {
      const { data: inserted, error: insertErr } = await supabaseAdmin
        .from("otp_verifications")
        .insert({ email: pseudoEmail, otp_code: otp, expires_at: expiresAt })
        .select("id")
        .single();
        
      if (insertErr) {
        console.warn("WhatsApp DB insert failed:", insertErr.message);
      } else if (inserted) {
        insertId = inserted.id;
      }
    } catch (e: any) {
      console.warn("WhatsApp DB connection crashed:", e.message);
    }

    // Send WhatsApp Message via Meta Cloud API
    const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
    const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
      console.warn("WhatsApp credentials not found, using console log for OTP (Development Mode)");
      console.log(`[WHATSAPP DEV MODE] OTP for ${phone} is ${otp}`);
      return { ok: true as const, message: "Dev Mode: OTP logged to console" };
    }

    const messagePayload = {
      messaging_product: "whatsapp",
      to: phone,
      type: "text",
      text: {
        body: `Your YCC Education Admission Help Center One-Time Password (OTP) is: *${otp}*. It is valid for 10 minutes.`
      }
    };

    try {
      const response = await fetch(
        `https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(messagePayload),
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error?.message || "Failed to send WhatsApp message");
      }
    } catch (err: any) {
      if (insertId) {
        try {
          await supabaseAdmin
            .from("otp_verifications")
            .update({ is_used: true })
            .eq("id", insertId);
        } catch (updateErr) {
          console.warn("Could not invalidate WhatsApp OTP on send failure");
        }
      }
      return { ok: false as const, message: err.message };
    }

    return { ok: true as const };
  });

export const verifyWhatsAppOtp = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        phone: PhoneSchema,
        otp: z.string().regex(/^\d{6}$/),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const phone = data.phone.replace("+", "");
    const pseudoEmail = `${phone}@whatsapp.com`;

    const { data: row, error } = await supabaseAdmin
      .from("otp_verifications")
      .select("*")
      .eq("email", pseudoEmail)
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

    // After success, we might want to return some dummy user identifier or token
    // Normally you'd register the user or get a JWT here.
    return { ok: true as const, message: "OTP verified successfully", phone: phone };
  });
