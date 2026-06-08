import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { sendSmtpEmailOtp, verifyOtp as verifyEmailOtp } from "@/lib/otp.functions";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { StepProgress } from "./StepProgress";
import { PreferencePicker } from "./PreferencePicker";
import {
  STREAMS,
  ENGINEERING_COLLEGES,
  ENGINEERING_BRANCHES,
  NURSING_COLLEGES,
  NURSING_BRANCHES,
  AGRICULTURE_COURSES,
  AGRICULTURE_COLLEGES,
  PHARMACY_COURSES,
  PHARMACY_COLLEGES,
  MEDICAL_COURSES,
  MEDICAL_COLLEGES,
  CATEGORIES,
  STATES,
  CONTACT_PHONE,
  CENTER_NAME,
  DOCUMENTS,
  SERVICE_OPTIONS,
} from "@/lib/constants";
import { downloadReceipt } from "@/lib/pdf";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Phone,
  Mail,
  ShieldCheck,
  ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TOTAL_STEPS = 8;

type DocStatus = Record<string, boolean>;

type FormState = {
  email: string;
  mobile: string;
  otpVerified: boolean;
  full_name: string;
  father_name: string;
  mother_name: string;
  gender: string;
  dob: string;
  category: string;
  aadhaar_number: string;
  alternate_mobile: string;
  address: string;
  district: string;
  state: string;
  pincode: string;
  tenth_board: string;
  tenth_percentage: string;
  tenth_year: string;
  twelfth_board: string;
  twelfth_percentage: string;
  twelfth_year: string;
  twelfth_stream: string;
  pcm_pcb_percentage: string;
  gap_year: string;
  scholarship_details: string;
  documents_status: DocStatus;
  stream: string;
  city_preference: string;
  college_preferences: string[];
  branch_preferences: string[];
  // Terms
  parent_signature_name: string;
  witness_name: string;
  service_selected: string;
  terms_read: boolean;
  terms_info_correct: boolean;
  terms_consent: boolean;
  confirm: boolean;
};

const EMPTY: FormState = {
  email: "",
  mobile: "",
  otpVerified: false,
  full_name: "",
  father_name: "",
  mother_name: "",
  gender: "",
  dob: "",
  category: "",
  aadhaar_number: "",
  alternate_mobile: "",
  address: "",
  district: "",
  state: "Maharashtra",
  pincode: "",
  tenth_board: "",
  tenth_percentage: "",
  tenth_year: "",
  twelfth_board: "",
  twelfth_percentage: "",
  twelfth_year: "",
  twelfth_stream: "",
  pcm_pcb_percentage: "",
  gap_year: "No",
  scholarship_details: "",
  documents_status: {},
  stream: "",
  city_preference: "Nagpur",
  college_preferences: [],
  branch_preferences: [],
  parent_signature_name: "",
  witness_name: "",
  service_selected: "",
  terms_read: false,
  terms_info_correct: false,
  terms_consent: false,
  confirm: false,
};

const STORAGE_KEY = "ycc-application-draft-v2";
const REGISTRATION_RECAPTCHA_ID = "registration-recaptcha";

export function RegistrationForm() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpResendIn, setOtpResendIn] = useState(0);
  const [sessionActive, setSessionActive] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successApp, setSuccessApp] = useState<any | null>(null);
  const [termsScrolled, setTermsScrolled] = useState(false);

  // Hydrate draft
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setData({ ...EMPTY, ...parsed, otpVerified: false });
      }
    } catch {}
  }, []);

  // Persist draft
  useEffect(() => {
    try {
      const { otpVerified: _o, ...persistable } = data;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
    } catch {}
  }, [data]);

  // OTP resend timer
  useEffect(() => {
    if (otpResendIn <= 0) return;
    const t = setTimeout(() => setOtpResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [otpResendIn]);

  useEffect(() => {
    // Cleanup if needed
  }, [step]);

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setData((d) => ({ ...d, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const collegeOptions = useMemo(() => {
    switch (data.stream) {
      case "Engineering": return ENGINEERING_COLLEGES;
      case "Nursing": return NURSING_COLLEGES;
      case "Pharmacy": return PHARMACY_COLLEGES;
      case "Agriculture": return AGRICULTURE_COLLEGES;
      case "Medical": return MEDICAL_COLLEGES;
      default: return [];
    }
  }, [data.stream]);

  const branchOptions = useMemo(() => {
    switch (data.stream) {
      case "Engineering": return ENGINEERING_BRANCHES;
      case "Nursing": return NURSING_BRANCHES;
      case "Agriculture": return AGRICULTURE_COURSES;
      case "Pharmacy": return PHARMACY_COURSES;
      case "Medical": return MEDICAL_COURSES;
      default: return [];
    }
  }, [data.stream]);

  // --- Validation per step ---
  const validateStep = (s: number): boolean => {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (!/^\d{10}$/.test(data.mobile)) e.mobile = "Enter a valid 10-digit mobile number";
      if (!z.string().email().safeParse(data.email).success) e.email = "Enter a valid email address";
      if (!data.otpVerified) e.otp = "Please verify the OTP sent to your mobile via SMS";
    }
    if (s === 2) {
      if (!data.full_name.trim()) e.full_name = "Required";
      if (!data.father_name.trim()) e.father_name = "Required";
      if (!data.mother_name.trim()) e.mother_name = "Required";
      if (!data.gender) e.gender = "Select gender";
      if (!data.dob) e.dob = "Date of birth required";
      if (!data.category) e.category = "Select category";
      if (!/^\d{12}$/.test(data.aadhaar_number)) e.aadhaar_number = "Aadhaar must be 12 digits";
      if (!data.address.trim()) e.address = "Required";
      if (!data.district.trim()) e.district = "Required";
      if (!data.state) e.state = "Required";
      if (!/^\d{6}$/.test(data.pincode)) e.pincode = "Pin code must be 6 digits";
      if (data.alternate_mobile && !/^\d{10}$/.test(data.alternate_mobile)) e.alternate_mobile = "Invalid mobile";
    }
    if (s === 3) {
      if (!data.tenth_board.trim()) e.tenth_board = "Required";
      if (!data.tenth_percentage.trim()) e.tenth_percentage = "Required";
      if (!/^\d{4}$/.test(data.tenth_year)) e.tenth_year = "Year (YYYY)";
      if (!data.twelfth_board.trim()) e.twelfth_board = "Required";
      if (!data.twelfth_percentage.trim()) e.twelfth_percentage = "Required";
      if (!/^\d{4}$/.test(data.twelfth_year)) e.twelfth_year = "Year (YYYY)";
      if (!data.twelfth_stream) e.twelfth_stream = "Required";
    }
    // step 4: Documents — no required check (partial allowed)
    if (s === 5) {
      if (!data.stream) e.stream = "Select a stream";
      if (collegeOptions.length && data.college_preferences.length === 0)
        e.college_preferences = "Select at least 1 college preference";
      if (branchOptions.length && data.branch_preferences.length === 0)
        e.branch_preferences = "Select at least 1 branch preference";
    }
    if (s === 6) {
      if (!data.terms_read) e.terms_read = "Please scroll & accept terms";
      if (!data.terms_info_correct) e.terms_info_correct = "Please confirm information is correct";
      if (!data.terms_consent) e.terms_consent = "Consent required";
      if (!data.parent_signature_name.trim()) e.parent_signature_name = "Required";
      if (!data.service_selected) e.service_selected = "Select a service";
    }
    if (s === 7) {
      if (!data.confirm) e.confirm = "Please confirm your details";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (validateStep(step)) setStep((s) => s + 1);
    else toast.error("Please fix the highlighted errors");
  };
  const back = () => setStep((s) => Math.max(1, s - 1));

  const handleGoogleLogin = async () => {
    if (!/^\d{10}$/.test(data.mobile)) {
      setErrors((e) => ({ ...e, mobile: "Please enter your 10-digit mobile number first" }));
      toast.error("Please enter your mobile number before continuing with Google");
      return;
    }
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      setData((d) => ({
        ...d,
        email: user.email || "",
        full_name: user.displayName || "",
        otpVerified: true,
      }));
      
      toast.success(`Google verification successful for ${user.email}`);
      setStep(2); // Auto-advance to step 2
    } catch (err: any) {
      toast.error(err.message || "Google Login failed. Try again.");
    }
  };

  // --- Email OTP (SMTP) ---
  const sendOtp = async () => {
    if (!/^\d{10}$/.test(data.mobile)) {
      setErrors((e) => ({ ...e, mobile: "Please enter your 10-digit mobile number first" }));
      toast.error("Please enter a valid 10-digit mobile number before sending OTP");
      return;
    }
    if (!z.string().email().safeParse(data.email).success) {
      setErrors((e) => ({ ...e, email: "Enter a valid email address" }));
      return;
    }
    setSending(true);
    setErrors((e) => ({ ...e, otp: "" }));
    try {
      const response = await sendSmtpEmailOtp({ data: { email: data.email } });
      if (!response.ok) throw new Error(response.message || "Failed to send OTP");
      
      setSessionActive(true);
      setOtp("");
      setOtpSent(true);
      setOtpResendIn(60);
      toast.success(`Email OTP sent to ${data.email}`);
    } catch (err: any) {
      setErrors((e) => ({ ...e, otp: err.message }));
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  const verifyOtp = async () => {
    if (!/^\d{6}$/.test(otp)) {
      setErrors((e) => ({ ...e, otp: "Enter the 6-digit code" }));
      return;
    }
    if (!sessionActive) {
      setErrors((e) => ({ ...e, otp: "Session expired. Send OTP again." }));
      setOtpSent(false);
      return;
    }
    setVerifying(true);
    try {
      const response = await verifyEmailOtp({ data: { email: data.email, otp } });
      if (!response.ok) throw new Error(response.message || "Invalid OTP");
      
      update("otpVerified", true);
      setSessionActive(false);
      setErrors((e) => ({ ...e, otp: "" }));
      toast.success("Email address verified successfully");
      setStep(2); // Auto-advance to step 2
    } catch (err: any) {
      setErrors((e) => ({ ...e, otp: err.message }));
      toast.error(err.message);
      if (err.message.includes("expired")) {
        setOtpSent(false);
        setSessionActive(false);
      }
    } finally {
      setVerifying(false);
    }
  };

  // Documents helpers
  const toggleDoc = (key: string) => {
    setData((d) => ({
      ...d,
      documents_status: { ...d.documents_status, [key]: !d.documents_status[key] },
    }));
    // mark email_provided automatically based on email validity
  };
  const docCount = useMemo(
    () => DOCUMENTS.filter((d) => data.documents_status[d.key]).length,
    [data.documents_status],
  );

  // Auto-tick "Email ID (Provided)" if email is verified
  useEffect(() => {
    if (data.otpVerified && !data.documents_status.email_provided) {
      setData((d) => ({
        ...d,
        documents_status: { ...d.documents_status, email_provided: true },
      }));
    }
  }, [data.otpVerified]); // eslint-disable-line

  // Auto-fill parent signature student name not needed (we show student auto)
  // Terms scroll detection
  const termsScrollRef = useRef<HTMLDivElement | null>(null);
  const onTermsScroll = (el: HTMLDivElement) => {
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) {
      setTermsScrolled(true);
    }
  };

  // --- Submit ---
  const submit = async () => {
    if (!validateStep(7)) return;
    setSubmitting(true);
    const { data: idResp, error: idErr } = await supabase.rpc("generate_application_id");
    if (idErr || !idResp) {
      setSubmitting(false);
      toast.error("Could not generate application ID");
      return;
    }
    const firstCollege = data.college_preferences[0] ?? "";
    const firstBranch = data.branch_preferences[0] ?? "";
    const payload = {
      application_id: idResp as string,
      full_name: data.full_name,
      father_name: data.father_name,
      mother_name: data.mother_name,
      gender: data.gender,
      dob: data.dob,
      category: data.category,
      aadhaar_number: data.aadhaar_number,
      mobile: data.mobile,
      alternate_mobile: data.alternate_mobile || null,
      email: data.email,
      address: data.address,
      district: data.district,
      state: data.state,
      pincode: data.pincode,
      tenth_board: data.tenth_board,
      tenth_percentage: data.tenth_percentage,
      tenth_year: data.tenth_year,
      twelfth_board: data.twelfth_board,
      twelfth_percentage: data.twelfth_percentage,
      twelfth_year: data.twelfth_year,
      twelfth_stream: data.twelfth_stream,
      pcm_pcb_percentage: data.pcm_pcb_percentage || null,
      gap_year: data.gap_year,
      scholarship_details: data.scholarship_details || null,
      stream: data.stream,
      city_preference: data.city_preference,
      college_name: firstCollege,
      branch_name: firstBranch,
      college_preferences: data.college_preferences,
      branch_preferences: data.branch_preferences,
      documents_status: data.documents_status,
      terms_accepted: data.terms_read && data.terms_info_correct && data.terms_consent,
      terms_accepted_at: new Date().toISOString(),
      parent_signature_name: data.parent_signature_name,
      witness_name: data.witness_name || null,
      service_selected: data.service_selected,
    };
    const { data: inserted, error } = await supabase
      .from("applications")
      .insert(payload as any)
      .select()
      .single();
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSuccessApp(inserted);
    setStep(8);
    localStorage.removeItem(STORAGE_KEY);
  };

  const resetForAnother = () => {
    setData(EMPTY);
    setSuccessApp(null);
    setStep(1);
    setOtp("");
    setOtpSent(false);
    setSessionActive(false);
    setTermsScrolled(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="mx-auto w-full max-w-3xl rounded-2xl border border-border bg-card p-5 shadow-lg sm:p-8">
      <StepProgress current={step} />

      {/* STEP 1: OTP or Google */}
      {step === 1 && (
        <Section title="Verify Contact" subtitle="Sign in with Google for instant verification, or use Email OTP.">
          {!data.otpVerified && (
            <div className="mb-6 space-y-4">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 h-12 text-base shadow-sm font-semibold flex items-center justify-center gap-3"
                onClick={handleGoogleLogin}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </Button>
              
            </div>
          )}

          <Field label="Mobile Number" error={errors.mobile} required>
            <Input
              inputMode="numeric"
              maxLength={10}
              placeholder="10-digit mobile"
              value={data.mobile}
              onChange={(e) => update("mobile", e.target.value.replace(/\D/g, ""))}
              disabled={data.otpVerified}
            />
          </Field>

          <Field label="Email Address" error={errors.email} required>
            <Input
              type="email"
              placeholder="Enter your email address"
              value={data.email}
              onChange={(e) => update("email", e.target.value)}
              disabled={data.otpVerified || sessionActive}
            />
          </Field>

          {!data.otpVerified && (
            <div className="mt-4">
              {!sessionActive ? (
                <Button 
                  type="button" 
                  onClick={sendOtp} 
                  disabled={sending || !data.email || !data.mobile}
                  className="w-full bg-accent hover:bg-accent/90 text-white"
                >
                  {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                  Send Email OTP
                </Button>
              ) : (
                <div className="space-y-3 rounded-lg border border-accent/20 bg-accent/5 p-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-accent">Enter 6-digit Email OTP</Label>
                    <span className="text-xs font-medium text-muted-foreground">
                      {otpResendIn > 0 ? `Resend in ${otpResendIn}s` : ""}
                    </span>
                  </div>
                  <InputOTP maxLength={6} value={otp} onChange={setOtp} disabled={verifying}>
                    <InputOTPGroup className="w-full justify-between">
                      {[...Array(6)].map((_, i) => (
                        <InputOTPSlot key={i} index={i} className="h-10 w-10 border-accent/30 bg-white sm:h-12 sm:w-12" />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                  {errors.otp && <p className="text-xs text-destructive">{errors.otp}</p>}
                  
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      onClick={verifyOtp} 
                      disabled={verifying || otp.length !== 6}
                      className="flex-1 bg-success hover:bg-success/90 text-white"
                    >
                      {verifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                      Verify
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={sendOtp} 
                      disabled={sending || otpResendIn > 0}
                      className="w-auto border-accent/30 text-accent hover:bg-accent/10"
                    >
                      Resend
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {data.otpVerified && (
            <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">
              <CheckCircle2 className="h-5 w-5" />
              Verified successfully! You can now proceed.
            </div>
          )}

          <Nav onNext={next} disableNext={!data.otpVerified} />
        </Section>
      )}

      {/* STEP 2: Personal Details */}
      {step === 2 && (
        <Section title="Personal Details">
          <Grid>
            <Field label="Full Name" error={errors.full_name} required>
              <Input value={data.full_name} onChange={(e) => update("full_name", e.target.value)} />
            </Field>
            <Field label="Father's Name" error={errors.father_name} required>
              <Input value={data.father_name} onChange={(e) => update("father_name", e.target.value)} />
            </Field>
            <Field label="Mother's Name" error={errors.mother_name} required>
              <Input value={data.mother_name} onChange={(e) => update("mother_name", e.target.value)} />
            </Field>
            <Field label="Date of Birth" error={errors.dob} required>
              <Input type="date" value={data.dob} onChange={(e) => update("dob", e.target.value)} />
            </Field>
            <Field label="Gender" error={errors.gender} required>
              <RadioGroup value={data.gender} onValueChange={(v) => update("gender", v)} className="flex gap-4 pt-2">
                {["Male", "Female", "Other"].map((g) => (
                  <label key={g} className="flex items-center gap-2 text-sm">
                    <RadioGroupItem value={g} id={`g-${g}`} /> {g}
                  </label>
                ))}
              </RadioGroup>
            </Field>
            <Field label="Category" error={errors.category} required>
              <Select value={data.category} onValueChange={(v) => update("category", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Aadhaar Number" error={errors.aadhaar_number} required>
              <Input inputMode="numeric" maxLength={12} placeholder="12-digit Aadhaar"
                value={data.aadhaar_number}
                onChange={(e) => update("aadhaar_number", e.target.value.replace(/\D/g, ""))} />
            </Field>
            <Field label="Mobile (verified)">
              <Input value={data.mobile} disabled />
            </Field>
            <Field label="Alternate Mobile" error={errors.alternate_mobile}>
              <Input inputMode="numeric" maxLength={10}
                value={data.alternate_mobile}
                onChange={(e) => update("alternate_mobile", e.target.value.replace(/\D/g, ""))} />
            </Field>
            <Field label="Email (verified)">
              <Input value={data.email} disabled />
            </Field>
          </Grid>
          <Field label="Full Address" error={errors.address} required>
            <Textarea rows={2} value={data.address} onChange={(e) => update("address", e.target.value)} />
          </Field>
          <Grid cols={3}>
            <Field label="District" error={errors.district} required>
              <Input value={data.district} onChange={(e) => update("district", e.target.value)} />
            </Field>
            <Field label="State" error={errors.state} required>
              <Select value={data.state} onValueChange={(v) => update("state", v)}>
                <SelectTrigger><SelectValue placeholder="State" /></SelectTrigger>
                <SelectContent>
                  {STATES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Pin Code" error={errors.pincode} required>
              <Input inputMode="numeric" maxLength={6}
                value={data.pincode}
                onChange={(e) => update("pincode", e.target.value.replace(/\D/g, ""))} />
            </Field>
          </Grid>
          <Nav onBack={back} onNext={next} />
        </Section>
      )}

      {/* STEP 3: Academic */}
      {step === 3 && (
        <Section title="Academic Details">
          <h3 className="mb-2 text-sm font-semibold text-primary">10th Standard</h3>
          <Grid cols={3}>
            <Field label="Board Name" error={errors.tenth_board} required>
              <Input value={data.tenth_board} onChange={(e) => update("tenth_board", e.target.value)} />
            </Field>
            <Field label="Percentage / CGPA" error={errors.tenth_percentage} required>
              <Input value={data.tenth_percentage} onChange={(e) => update("tenth_percentage", e.target.value)} />
            </Field>
            <Field label="Passing Year" error={errors.tenth_year} required>
              <Input inputMode="numeric" maxLength={4}
                value={data.tenth_year}
                onChange={(e) => update("tenth_year", e.target.value.replace(/\D/g, ""))} />
            </Field>
          </Grid>

          <h3 className="mb-2 mt-4 text-sm font-semibold text-primary">12th Standard</h3>
          <Grid cols={3}>
            <Field label="Board Name" error={errors.twelfth_board} required>
              <Input value={data.twelfth_board} onChange={(e) => update("twelfth_board", e.target.value)} />
            </Field>
            <Field label="Percentage / CGPA" error={errors.twelfth_percentage} required>
              <Input value={data.twelfth_percentage} onChange={(e) => update("twelfth_percentage", e.target.value)} />
            </Field>
            <Field label="Passing Year" error={errors.twelfth_year} required>
              <Input inputMode="numeric" maxLength={4}
                value={data.twelfth_year}
                onChange={(e) => update("twelfth_year", e.target.value.replace(/\D/g, ""))} />
            </Field>
            <Field label="Stream" error={errors.twelfth_stream} required>
              <Select value={data.twelfth_stream} onValueChange={(v) => update("twelfth_stream", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {["Science", "Commerce", "Arts"].map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="PCM / PCB %">
              <Input value={data.pcm_pcb_percentage}
                onChange={(e) => update("pcm_pcb_percentage", e.target.value)}
                placeholder="if applicable" />
            </Field>
            <Field label="Any Gap Year?">
              <Select value={data.gap_year} onValueChange={(v) => update("gap_year", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="No">No</SelectItem>
                  <SelectItem value="Yes">Yes</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </Grid>
          <Field label="Scholarship Details (if any)">
            <Textarea rows={2} value={data.scholarship_details}
              onChange={(e) => update("scholarship_details", e.target.value)} />
          </Field>
          <Nav onBack={back} onNext={next} />
        </Section>
      )}

      {/* STEP 4: Documents Checklist */}
      {step === 4 && (
        <Section title="Documents Verification"
          subtitle="Tick the documents the student has brought. Partial submission is allowed.">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-accent/30 bg-accent/5 p-3">
            <div className="text-sm font-semibold text-primary">
              {docCount} of {DOCUMENTS.length} documents collected
            </div>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="outline"
                onClick={() => {
                  const all: DocStatus = {};
                  DOCUMENTS.forEach((d) => (all[d.key] = true));
                  update("documents_status", all);
                }}>
                Mark All
              </Button>
              <Button type="button" size="sm" variant="outline"
                onClick={() => update("documents_status", {})}>
                Clear
              </Button>
            </div>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {DOCUMENTS.map((d) => {
              const checked = !!data.documents_status[d.key];
              return (
                <label key={d.key}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3 text-sm transition",
                    checked
                      ? "border-success bg-success/10"
                      : "border-border bg-card hover:border-accent/50",
                  )}>
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleDoc(d.key)}
                  />
                  <span className="flex-1 font-medium">{d.label}</span>
                  {checked ? (
                    <span className="flex items-center gap-1 rounded-full bg-success/20 px-2 py-0.5 text-[10px] font-bold text-success">
                      <CheckCircle2 className="h-3 w-3" /> PRESENT
                    </span>
                  ) : (
                    <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-bold text-destructive">
                      MISSING
                    </span>
                  )}
                </label>
              );
            })}
          </div>
          <Nav onBack={back} onNext={next} />
        </Section>
      )}

      {/* STEP 5: Stream + multi-college/branch */}
      {step === 5 && (
        <Section title="Stream & College Preferences"
          subtitle="Add colleges and branches in your CAP-round preference order.">
          <Label className="mb-2 block text-xs font-medium text-muted-foreground">
            Select Stream
          </Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {STREAMS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  update("stream", s.id);
                  update("college_preferences", []);
                  update("branch_preferences", []);
                }}
                className={cn(
                  "rounded-xl border-2 p-3 text-center transition",
                  data.stream === s.id
                    ? "border-accent bg-accent/10 shadow-sm"
                    : "border-border hover:border-accent/50",
                )}>
                <div className="text-2xl">{s.icon}</div>
                <div className="mt-1 text-xs font-semibold">{s.label}</div>
              </button>
            ))}
          </div>
          {errors.stream && <p className="mt-1 text-xs text-destructive">{errors.stream}</p>}

          {data.stream && (
            <div className="mt-4 space-y-5">
              <Field label="City Preference">
                <RadioGroup value={data.city_preference}
                  onValueChange={(v) => update("city_preference", v)}
                  className="flex gap-4 pt-2">
                  {["Nagpur", "Pune"].map((c) => (
                    <label key={c} className="flex items-center gap-2 text-sm">
                      <RadioGroupItem value={c} id={`c-${c}`} /> {c}
                    </label>
                  ))}
                </RadioGroup>
              </Field>

              {collegeOptions.length > 0 && (
                <div>
                  <PreferencePicker
                    label="College Preferences (CAP Round Order)"
                    available={collegeOptions}
                    selected={data.college_preferences}
                    onChange={(v) => update("college_preferences", v)}
                  />
                  {errors.college_preferences && (
                    <p className="mt-1 text-xs text-destructive">{errors.college_preferences}</p>
                  )}
                </div>
              )}

              {branchOptions.length > 0 && (
                <div>
                  <PreferencePicker
                    label="Branch / Course Preferences"
                    available={branchOptions}
                    selected={data.branch_preferences}
                    onChange={(v) => update("branch_preferences", v)}
                  />
                  {errors.branch_preferences && (
                    <p className="mt-1 text-xs text-destructive">{errors.branch_preferences}</p>
                  )}
                </div>
              )}
            </div>
          )}
          <Nav onBack={back} onNext={next} />
        </Section>
      )}

      {/* STEP 6: Terms & Conditions */}
      {step === 6 && (
        <Section title="Declaration & Consent Form"
          subtitle="Please read carefully before submitting.">
          <div className="flex items-center justify-between rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 text-xs font-semibold text-primary">
            <span>Scroll to read all terms</span>
            <ArrowDown className={cn("h-4 w-4 transition", termsScrolled && "opacity-30")} />
          </div>
          <div
            ref={termsScrollRef}
            onScroll={(e) => onTermsScroll(e.currentTarget)}
            className="max-h-[400px] overflow-y-auto rounded-xl border border-border bg-muted/20 p-4 text-sm leading-relaxed"
          >
            <h3 className="mb-2 font-bold text-primary">DECLARATION & CONSENT</h3>
            <p className="mb-3">
              I have submitted the required original documents and/or verified
              photocopies for my ward's admission process. I have been properly
              informed and explained about the admission procedure, college
              selection, CAP process, merit system, category rules, document
              verification, government regulations, and seat availability.
            </p>
            <p className="mb-3">
              I hereby confirm that I am giving consent for my ward's admission
              process after making proper inquiries, without any misunderstanding,
              pressure, or coercion of any kind.
            </p>

            <h3 className="mb-2 mt-4 font-bold text-primary">TERMS & CONDITIONS</h3>
            <ol className="list-decimal space-y-2 pl-5">
              <li>The Admission Counseling Center only provides Career Guidance, Documentation Support, and Admission Process Assistance services.</li>
              <li>The admission process depends on the student's marks, merit, category, CAP rounds, government rules, and seat availability.</li>
              <li>No guarantee has been provided regarding admission into any specific college.</li>
              <li>The admission process will be carried out according to the availability of seats based on the TOP College Preferences provided by the student/parent.</li>
              <li>Registration, Documentation, Processing, and Counseling Charges paid for the admission process are non-refundable once the process has started under any circumstances.</li>
              <li>If the student or parent voluntarily cancels the admission process, the amount paid will not be refunded. Cancellation may attract Administrative/Cancellation Charges up to ₹5000.</li>
              <li>Original documents submitted for verification may be temporarily retained for Provisional Admission / Seat Booking purposes and will be returned during College Confirmation Reporting.</li>
              <li>Guidance and assistance related to Form Registration and FC Center / ARC Center processes will be provided through the Counseling Center.</li>
              <li>In case of any dispute, efforts will be made to resolve the matter mutually through discussion and as per applicable law.</li>
              <li>The consultancy does not engage in any illegal admission process, donation-based admission, or any process against government rules and regulations.</li>
              <li>After carefully considering the best interests of my ward, I voluntarily grant permission to proceed with the admission process.</li>
              <li>No private agent, relative, or third party will interfere in my ward's admission process.</li>
              <li>I have read and understood this declaration and voluntarily grant my consent for the admission process.</li>
            </ol>

            <h3 className="mb-2 mt-4 font-bold text-primary">FEE STRUCTURE</h3>
            <ul className="space-y-1">
              <li>• Form Registration Charges – ₹100/-</li>
              <li>• Counseling Charges + Registration – ₹150/-</li>
              <li>• Documentation + Registration – ₹1,000/-</li>
              <li>• CAP Round Processing Charges – ₹2,000/-</li>
              <li>• Total Admission Assistance Package – ₹5,000/-</li>
            </ul>

            <h3 className="mb-2 mt-4 font-bold text-primary">OTHER COUNSELING FEE STRUCTURE</h3>
            <ul className="space-y-1">
              <li>• Agriculture & Pharmacy – ₹10,000/-</li>
              <li>• GNM Government College CAP Counseling – ₹20,000/-</li>
              <li>• Private GNM & ANM Spot Admission – ₹10,000/-</li>
              <li>• B.Sc Nursing CAP Counseling – ₹20,000/-</li>
              <li>• BPTH / BHMS CAP – ₹25,000/-</li>
              <li>• B.Tech Low Fees Admission Assistance – ₹25,000/-</li>
              <li>• BAMS / BDS CAP – ₹30,000/-</li>
              <li>• MBBS CAP State or ILQ Allotment Fees – ₹40,000/-</li>
              <li>• All Stream Management Quota – ₹50,000/-</li>
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">— End of terms —</p>
          </div>

          {!termsScrolled && (
            <p className="text-xs text-accent">Please scroll to the bottom to enable consent.</p>
          )}

          {/* Signatures */}
          <div className="rounded-xl border border-border bg-card p-3">
            <h4 className="mb-2 text-sm font-semibold text-primary">Signatures</h4>
            <Grid>
              <Field label="Parent / Guardian Name" required error={errors.parent_signature_name}>
                <Input value={data.parent_signature_name}
                  onChange={(e) => update("parent_signature_name", e.target.value)} />
              </Field>
              <Field label="Student Name (auto)">
                <Input value={data.full_name} disabled />
              </Field>
              <Field label="Witness Name">
                <Input value={data.witness_name}
                  onChange={(e) => update("witness_name", e.target.value)} />
              </Field>
              <Field label="Consultant In-charge">
                <Input value="YCC Education" disabled />
              </Field>
              <Field label="Date">
                <Input value={new Date().toLocaleDateString("en-IN")} disabled />
              </Field>
            </Grid>
          </div>

          {/* Service selected */}
          <div className="rounded-xl border border-border bg-card p-3">
            <h4 className="mb-2 text-sm font-semibold text-primary">Service Selected</h4>
            <RadioGroup value={data.service_selected}
              onValueChange={(v) => update("service_selected", v)}
              className="space-y-1">
              {SERVICE_OPTIONS.map((s) => (
                <label key={s} className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-2 text-sm hover:bg-muted/30">
                  <RadioGroupItem value={s} />
                  <span>{s}</span>
                </label>
              ))}
            </RadioGroup>
            {errors.service_selected && (
              <p className="mt-1 text-xs text-destructive">{errors.service_selected}</p>
            )}
          </div>

          {/* Consent checkboxes */}
          <div className="space-y-2 rounded-xl border-2 border-accent/30 bg-accent/5 p-3">
            <label className="flex items-start gap-2 text-sm">
              <Checkbox checked={data.terms_read}
                disabled={!termsScrolled}
                onCheckedChange={(v) => update("terms_read", Boolean(v))} />
              <span>I have read and agree to all the Terms & Conditions mentioned above.</span>
            </label>
            <label className="flex items-start gap-2 text-sm">
              <Checkbox checked={data.terms_info_correct}
                onCheckedChange={(v) => update("terms_info_correct", Boolean(v))} />
              <span>I confirm that all information provided is correct and true.</span>
            </label>
            <label className="flex items-start gap-2 text-sm">
              <Checkbox checked={data.terms_consent}
                onCheckedChange={(v) => update("terms_consent", Boolean(v))} />
              <span>I give full consent for the admission process to proceed.</span>
            </label>
            {(errors.terms_read || errors.terms_info_correct || errors.terms_consent) && (
              <p className="text-xs text-destructive">Please accept all terms to proceed.</p>
            )}
          </div>

          <Nav onBack={back} onNext={next}
            disableNext={!data.terms_read || !data.terms_info_correct || !data.terms_consent} />
        </Section>
      )}

      {/* STEP 7: Review & Submit */}
      {step === 7 && (
        <Section title="Review & Submit">
          <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4 text-sm">
            <Row k="Name" v={data.full_name} />
            <Row k="Father / Mother" v={`${data.father_name} / ${data.mother_name}`} />
            <Row k="DOB / Gender / Category" v={`${data.dob} · ${data.gender} · ${data.category}`} />
            <Row k="Aadhaar" v={data.aadhaar_number} />
            <Row k="Mobile / Email" v={`${data.mobile} · ${data.email}`} />
            <Row k="Address" v={`${data.address}, ${data.district}, ${data.state} - ${data.pincode}`} />
            <Row k="10th" v={`${data.tenth_board} · ${data.tenth_percentage}% · ${data.tenth_year}`} />
            <Row k="12th" v={`${data.twelfth_board} · ${data.twelfth_percentage}% · ${data.twelfth_year} (${data.twelfth_stream})`} />
            <Row k="Documents Collected" v={`${docCount} of ${DOCUMENTS.length}`} />
            <Row k="Stream" v={data.stream} />
            <Row k="City Preference" v={data.city_preference} />
            <Row k="College Preferences" v={data.college_preferences.map((c, i) => `${i + 1}. ${c}`).join(" | ") || "-"} />
            <Row k="Branch Preferences" v={data.branch_preferences.map((c, i) => `${i + 1}. ${c}`).join(" | ") || "-"} />
            <Row k="Service Selected" v={data.service_selected || "-"} />
            <Row k="Parent Signature" v={data.parent_signature_name || "-"} />
            <Row k="Terms Accepted" v={data.terms_read && data.terms_info_correct && data.terms_consent ? "YES" : "NO"} />
          </div>

          <label className="mt-4 flex items-start gap-2 text-sm">
            <Checkbox checked={data.confirm}
              onCheckedChange={(v) => update("confirm", Boolean(v))} />
            <span>I confirm all the details provided above are true and correct.</span>
          </label>
          {errors.confirm && <p className="text-xs text-destructive">{errors.confirm}</p>}

          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button type="button" variant="outline" onClick={back}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            <Button type="button" onClick={submit} disabled={submitting}
              className="bg-success text-success-foreground hover:bg-success/90">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Application
            </Button>
          </div>
        </Section>
      )}

      {/* STEP 8: Success */}
      {step === 8 && successApp && (
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/15 ring-4 ring-success/30">
            <CheckCircle2 className="h-12 w-12 animate-in zoom-in-50 text-success" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-primary">Application Submitted!</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your admission registration has been received successfully.
          </p>

          <div className="mx-auto mt-6 max-w-md rounded-xl border-2 border-dashed border-accent/40 bg-accent/5 p-4 text-left">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Application ID</div>
            <div className="text-xl font-bold text-accent">{successApp.application_id}</div>
            <div className="mt-3 grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
              <Row k="Student" v={successApp.full_name} />
              <Row k="Stream" v={successApp.stream} />
              <Row k="1st College" v={(successApp.college_preferences?.[0]) || successApp.college_name || "-"} />
              <Row k="Submitted" v={new Date(successApp.created_at).toLocaleString("en-IN")} />
            </div>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            A confirmation has been logged. For queries call: {CONTACT_PHONE}
          </p>

          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <Button onClick={() => downloadReceipt(successApp)} className="bg-primary">
              Download PDF Receipt
            </Button>
            <Button variant="outline" onClick={resetForAnother}>
              Register Another Student
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Helpers ---
function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-primary">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, error, required, children }: { label: string; error?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium">
        {label}{required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function Grid({ children, cols = 2 }: { children: React.ReactNode; cols?: 2 | 3 }) {
  return (
    <div className={cn("grid gap-3", cols === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
      {children}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-border/50 py-1 last:border-0">
      <span className="font-medium text-muted-foreground">{k}</span>
      <span className="break-words text-right">{v}</span>
    </div>
  );
}

function Nav({ onBack, onNext, disableNext }: { onBack?: () => void; onNext: () => void; disableNext?: boolean }) {
  return (
    <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
      {onBack ? (
        <Button type="button" variant="outline" onClick={onBack}>
          <ChevronLeft className="mr-1 h-4 w-4" /> Back
        </Button>
      ) : <div />}
      <Button type="button" onClick={onNext} disabled={disableNext} className="bg-primary">
        Next <ChevronRight className="ml-1 h-4 w-4" />
      </Button>
    </div>
  );
}
