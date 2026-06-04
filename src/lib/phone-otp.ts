import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type Auth,
  type ConfirmationResult,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";

let activeVerifier: RecaptchaVerifier | null = null;

/** Remove existing reCAPTCHA widget (Firebase requires a fresh verifier per SMS). */
export function clearPhoneRecaptcha() {
  if (activeVerifier) {
    try {
      activeVerifier.clear();
    } catch {
      /* already destroyed */
    }
    activeVerifier = null;
  }
  if (typeof document !== "undefined") {
    document.querySelectorAll(".grecaptcha-badge").forEach((el) => el.remove());
  }
}

/** E.164 India: +91 + 10 digits (no leading 0). */
export function toIndianE164(mobile10: string): string {
  const digits = mobile10.replace(/\D/g, "").replace(/^0+/, "");
  if (!/^\d{10}$/.test(digits)) {
    throw new Error("Enter a valid 10-digit mobile number");
  }
  return `+91${digits}`;
}

/**
 * Send SMS OTP: invisible reCAPTCHA + signInWithPhoneNumber.
 * Do NOT call initializeRecaptchaConfig — it throws "recaptchaKey undefined"
 * when reCAPTCHA Enterprise is not set up in Firebase Console.
 */
export async function sendPhoneOtp(
  auth: Auth,
  mobile10: string,
  containerId: string,
): Promise<ConfirmationResult> {
  clearPhoneRecaptcha();

  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error("reCAPTCHA container not found. Please refresh the page.");
  }
  container.innerHTML = "";
  container.removeAttribute("aria-hidden");

  const phone = toIndianE164(mobile10);

  const verifier = new RecaptchaVerifier(auth, containerId, {
    size: "invisible",
    callback: () => {},
    "expired-callback": () => clearPhoneRecaptcha(),
    "error-callback": () => clearPhoneRecaptcha(),
  });

  await verifier.render();
  activeVerifier = verifier;

  try {
    return await signInWithPhoneNumber(auth, phone, verifier);
  } catch (err) {
    clearPhoneRecaptcha();
    if (err instanceof FirebaseError) {
      console.error("[firebase-auth]", {
        code: err.code,
        message: err.message,
        customData: err.customData,
      });
    }
    throw err;
  }
}

export function firebasePhoneErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    const { code, message: msg } = error;

    switch (code) {
      case "auth/invalid-phone-number":
        return "Invalid mobile number. Enter 10 digits only (no +91, no leading 0).";
      case "auth/too-many-requests":
        return "Too many attempts. Wait 15 minutes and try again.";
      case "auth/quota-exceeded":
        return "Daily SMS limit reached on Firebase. Try tomorrow or contact support.";
      case "auth/captcha-check-failed":
        return "reCAPTCHA failed. Refresh the page, use Chrome/Safari, and try again.";
      case "auth/invalid-app-credential":
        return (
          "Firebase rejected SMS (400). In Console: enable Phone sign-in, add this site to Authorized domains, " +
          "enable Identity Toolkit API, allow localhost on your API key, and use Blaze billing for real SMS."
        );
      case "auth/operation-not-allowed":
        return "Phone sign-in is OFF. Firebase Console → Authentication → Phone → Enable.";
      case "auth/billing-not-enabled":
        return "Enable Blaze (pay-as-you-go) billing in Firebase for SMS OTP.";
      case "auth/app-not-authorized":
      case "auth/unauthorized-domain":
        return "This website URL is not in Firebase Authorized domains. Add it in Authentication → Settings.";
      case "auth/invalid-verification-code":
        return "Wrong OTP. Check the SMS and try again.";
      case "auth/code-expired":
        return "OTP expired. Tap Send OTP again.";
      default:
        if (msg.includes("INVALID_APP_CREDENTIAL") || msg.includes("400")) {
          return firebasePhoneErrorMessage(
            new FirebaseError("auth/invalid-app-credential", msg),
          );
        }
        return msg || `Firebase error: ${code}`;
    }
  }

  if (error instanceof Error) return error.message;
  return "Could not send OTP. Use Chrome/Safari and check Firebase Phone + billing settings.";
}
