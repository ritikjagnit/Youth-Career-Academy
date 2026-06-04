// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid email address" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    await supabase
      .from("otp_verifications")
      .update({ is_used: true })
      .eq("email", email)
      .eq("is_used", false);

    await supabase.from("otp_verifications").insert({
      email,
      otp_code: otp,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      is_used: false,
    });

    const GMAIL_USER = Deno.env.get("GMAIL_USER")!;
    const GMAIL_APP_PASSWORD = Deno.env.get("GMAIL_APP_PASSWORD")!;

    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 465,
        tls: true,
        auth: { username: GMAIL_USER, password: GMAIL_APP_PASSWORD },
      },
    });

    await client.send({
      from: `YCC Education <${GMAIL_USER}>`,
      to: email,
      subject: "Your OTP - YCC Education Admission Help Center",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#ffffff;color:#0f172a;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
          <div style="background:#1a3c6e;padding:20px;text-align:center;color:#fff">
            <h2 style="margin:0;font-size:20px">YCC Education</h2>
            <p style="margin:4px 0 0;font-size:13px;opacity:.9">Youth Career Academy, Bhandara</p>
          </div>
          <div style="padding:24px;text-align:center">
            <p style="margin:0 0 8px;color:#475569">Your OTP for Admission Registration:</p>
            <div style="display:inline-block;font-size:34px;font-weight:700;letter-spacing:10px;color:#f97316;background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:16px 28px;margin:12px 0">${otp}</div>
            <p style="margin:8px 0 0;color:#475569;font-size:13px">Valid for <b>10 minutes</b> only.</p>
            <p style="margin:6px 0 0;color:#94a3b8;font-size:12px">Do not share this OTP with anyone.</p>
          </div>
          <div style="background:#f8fafc;padding:12px;text-align:center;color:#64748b;font-size:12px">
            YCC Education Admission Help Center | Bhandara, Maharashtra
          </div>
        </div>
      `,
    });

    await client.close();

    return new Response(
      JSON.stringify({ success: true, message: "OTP sent to " + email }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("OTP Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to send OTP. Please try again. " + (error?.message || String(error)),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
