import React, { useState, useEffect } from "react";
import type { ConfirmationResult } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  clearPhoneRecaptcha,
  firebasePhoneErrorMessage,
  sendPhoneOtp,
} from "@/lib/phone-otp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Loader2, Phone, ShieldCheck, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const RECAPTCHA_CONTAINER = "phone-login-recaptcha";

interface PhoneAuthProps {
  onSuccess: (user: any) => void;
}

export function PhoneAuth({ onSuccess }: PhoneAuthProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"PHONE" | "OTP">("PHONE");
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  useEffect(() => {
    return () => clearPhoneRecaptcha();
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phoneNumber.replace(/\D/g, "");
    if (!/^\d{10}$/.test(digits)) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);
    try {
      const confirmation = await sendPhoneOtp(auth, digits, RECAPTCHA_CONTAINER);
      setConfirmationResult(confirmation);
      setStep("OTP");
      toast.success("OTP sent to your mobile via SMS");
    } catch (error: unknown) {
      console.error(error);
      toast.error(firebasePhoneErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Please enter a 6-digit OTP");
      return;
    }

    if (!confirmationResult) {
      toast.error("Session expired. Please request a new OTP.");
      setStep("PHONE");
      return;
    }

    setLoading(true);
    try {
      const result = await confirmationResult.confirm(otp);
      const user = result.user;

      localStorage.setItem("userAuth", JSON.stringify({
        uid: user.uid,
        phoneNumber: user.phoneNumber,
        token: await user.getIdToken()
      }));

      toast.success("Successfully authenticated!");
      onSuccess(user);
    } catch (error: unknown) {
      console.error(error);
      toast.error(firebasePhoneErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep("PHONE");
    setConfirmationResult(null);
    clearPhoneRecaptcha();
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border-primary/10">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto bg-primary/10 w-12 h-12 flex items-center justify-center rounded-full mb-2">
          {step === "PHONE" ? <Phone className="text-primary w-6 h-6" /> : <ShieldCheck className="text-primary w-6 h-6" />}
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          {step === "PHONE" ? "Welcome Back" : "Verify Phone"}
        </CardTitle>
        <CardDescription>
          {step === "PHONE"
            ? "Enter your phone number to sign in to your account"
            : `We sent an SMS code to ${countryCode} ${phoneNumber}`}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {step === "PHONE" ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-[80px] text-center font-medium"
                  placeholder="+91"
                />
                <Input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  placeholder="10-digit mobile"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                  className="flex-1"
                  maxLength={10}
                  required
                />
              </div>
            </div>

            <div id={RECAPTCHA_CONTAINER} className="sr-only" aria-hidden="true" />

            <Button
              type="submit"
              className="w-full"
              disabled={loading || phoneNumber.length !== 10}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending SMS…
                </>
              ) : (
                <>
                  Send OTP
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="flex flex-col space-y-3 items-center">
              <Label htmlFor="otp">Enter 6-digit code from SMS</Label>
              <InputOTP
                id="otp"
                maxLength={6}
                value={otp}
                onChange={(value) => setOtp(value.replace(/\D/g, ""))}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                type="submit"
                className="w-full"
                disabled={loading || otp.length !== 6}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Login"
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={handleBack}
                disabled={loading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Phone
              </Button>
            </div>
          </form>
        )}
      </CardContent>
      <CardFooter className="text-center text-xs text-muted-foreground">
        Use Chrome or Safari on a real phone. If SMS fails, check Firebase Phone + Blaze billing.
      </CardFooter>
    </Card>
  );
}
