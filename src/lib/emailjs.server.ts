// Server-side EmailJS REST API helper.
// Uses EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY.
// NOTE: For non-browser requests EmailJS requires "Allow EmailJS API for
// non-browser applications" to be enabled in your EmailJS account
// (Account → Security). Otherwise the API returns 403.

export type EmailJSResult =
  | { ok: true }
  | { ok: false; status?: number; message: string };

export async function sendEmailJS(params: {
  to: string;
  subject: string;
  html: string;
  passcode?: string;
  extra?: Record<string, string>;
}): Promise<EmailJSResult> {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    return {
      ok: false,
      message:
        "Email service is not configured. Please contact the academy office.",
    };
  }

  const template_params: Record<string, string> = {
    to_email: params.to,
    email: params.to,
    subject: params.subject,
    message: params.html,
    message_html: params.html,
    ...(params.passcode ? { passcode: params.passcode, otp: params.passcode } : {}),
    ...(params.extra ?? {}),
  };

  try {
    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[emailjs] send failed [${res.status}]: ${body}`);
      let message = "Failed to send email. Please try again shortly.";
      if (res.status === 403) {
        message =
          "EmailJS rejected the request (403). Enable 'Allow EmailJS API for non-browser apps' in your EmailJS Account → Security settings, then retry.";
      }
      return { ok: false, status: res.status, message };
    }

    return { ok: true };
  } catch (err) {
    console.error("[emailjs] network error:", err);
    return { ok: false, message: "Network error while sending email." };
  }
}
