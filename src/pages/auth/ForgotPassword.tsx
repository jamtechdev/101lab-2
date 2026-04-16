// @ts-nocheck
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  Loader2,
} from "lucide-react";

import { toastSuccess, toastWarning, toastError } from "../../helper/toasterNotification";
import { showSuccess } from "../../helper/sweetAlertNotification";

import {
  useSendOtpMutation,
  useVerifyOtpMutation,
  useResetPasswordMutation,
} from "../../rtk/slices/apiSlice";

const FEATURES = [
  "Secure password recovery",
  "One-time code sent to your email",
  "End-to-end encrypted process",
  "Instant access after reset",
];

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [sendOtp, { isLoading: isSendingOtp }] = useSendOtpMutation();
  const [verifyOtp, { isLoading: isVerifyingOtp }] = useVerifyOtpMutation();
  const [resetPassword, { isLoading: isResetting }] = useResetPasswordMutation();

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // ─── STEP 1: Send OTP ───────────────────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      toastWarning("Please enter a valid email.");
      return;
    }
    try {
      await sendOtp({ email }).unwrap();
      toastSuccess("OTP sent to your email.");
      setStep(2);
    } catch (err: any) {
      toastError(err?.data?.message || "Failed to send OTP.");
    }
  };

  // ─── STEP 2: Verify OTP ─────────────────────────────────────────────────────
  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      toastWarning("Please enter the full 6-digit OTP.");
      return;
    }
    try {
      await verifyOtp({ email, otp: otpCode }).unwrap();
      toastSuccess("OTP verified successfully.");
      setStep(3);
    } catch (err: any) {
      toastError(err?.data?.message || "Invalid OTP. Please try again.");
    }
  };

  // ─── STEP 3: Reset Password ──────────────────────────────────────────────────
  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password.length < 6) {
      toastWarning("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      toastWarning("Passwords do not match.");
      return;
    }
    try {
      await resetPassword({ email, otp: otp.join(""), newPassword: password }).unwrap();
      toastSuccess("Password reset successful.");
      await showSuccess("Success", "Your password has been reset.");
      navigate("/auth");
    } catch (err: any) {
      toastError(err?.data?.message || "Unable to reset password.");
    }
  };

  // ─── Step meta ───────────────────────────────────────────────────────────────
  const stepMeta = [
    { icon: Mail,        title: "Forgot password",    desc: "Enter your email address and we'll send you a one-time code." },
    { icon: ShieldCheck, title: "Enter your code",    desc: `We sent a 6-digit code to ${email || "your email"}.` },
    { icon: KeyRound,    title: "Set new password",   desc: "Choose a strong password for your account." },
  ];
  const { icon: StepIcon, title: stepTitle, desc: stepDesc } = stepMeta[step - 1];

  return (
    <div className="min-h-screen flex bg-background">

      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex lg:w-[380px] xl:w-[440px] flex-col justify-between p-10 text-primary-foreground relative overflow-hidden bg-gradient-primary shrink-0">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M20 20h20v20H20zM0 0h20v20H0z'/%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />

        {/* Top */}
        <div className="relative z-10">
          <button
            onClick={() => navigate("/auth")}
            className="flex items-center gap-2 text-sm opacity-70 hover:opacity-100 transition-opacity mb-10"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </button>
          <div className="mb-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-50">
              Account recovery
            </span>
          </div>
          <h1 className="text-3xl font-bold mb-3 tracking-tight">GreenBidz</h1>
          <p className="text-sm opacity-70 leading-relaxed max-w-[300px]">
            Recover access to your marketplace account quickly and securely.
          </p>

          {/* Step indicator */}
          <div className="mt-6 flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s <= step ? "bg-white w-8" : "bg-white/30 w-4"
                }`}
              />
            ))}
            <span className="text-xs opacity-60 ml-1">Step {step} of 3</span>
          </div>
        </div>

        {/* Bottom features */}
        <div className="relative z-10 space-y-4 mt-auto">
          <div className="w-10 h-[2px] opacity-30 bg-warning" />
          {FEATURES.map((item, i) => (
            <div key={i} className="flex items-start gap-3 text-sm opacity-70">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-warning" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col overflow-y-auto">

        {/* Mobile top bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border lg:border-none lg:px-10 lg:pt-6 lg:pb-0">
          <button
            onClick={() => navigate("/auth")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground lg:hidden"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </button>
          <span className="text-sm font-semibold text-primary lg:hidden">GreenBidz</span>
        </div>

        <div className="flex-1 flex items-center justify-center py-8 px-6 lg:px-10">
          <div className="w-full max-w-md animate-fade-in">

            {/* Icon + heading */}
            <div className="text-center mb-7">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
                <StepIcon className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">{stepTitle}</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                {stepDesc}
              </p>
            </div>

            {/* ══ STEP 1: Email ══ */}
            {step === 1 && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="fp-email" className="text-sm font-medium text-foreground">
                    Email address <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="fp-email"
                      type="email"
                      placeholder="example@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                      className="h-12 pl-10 bg-muted/30 border-border focus:border-primary"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-2 mt-2"
                  disabled={isSendingOtp}
                >
                  {isSendingOtp ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Sending code...</>
                  ) : (
                    <>Send OTP</>
                  )}
                </Button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                    onClick={() => navigate("/auth")}
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            )}

            {/* ══ STEP 2: OTP ══ */}
            {step === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-foreground">
                    Verification code
                  </Label>
                  <div className="flex justify-between gap-2">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(e.target.value, index)}
                        onKeyDown={(e) => handleOtpKeyDown(e, index)}
                        autoFocus={index === 0}
                        className="w-12 h-14 text-center text-xl font-bold rounded-lg border border-border bg-muted/30 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Didn't receive it?{" "}
                    <button
                      type="button"
                      className="text-primary hover:underline font-medium"
                      onClick={async () => {
                        try {
                          await sendOtp({ email }).unwrap();
                          toastSuccess("New code sent.");
                        } catch {
                          toastError("Failed to resend.");
                        }
                      }}
                    >
                      Resend code
                    </button>
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                  disabled={isVerifyingOtp}
                >
                  {isVerifyingOtp ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
                  ) : (
                    <>Verify code</>
                  )}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                    onClick={() => { setStep(1); setOtp(["", "", "", "", "", ""]); }}
                  >
                    Use a different email
                  </button>
                </div>
              </form>
            )}

            {/* ══ STEP 3: New Password ══ */}
            {step === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="fp-password" className="text-sm font-medium text-foreground">
                    New password <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="fp-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoFocus
                      className="h-12 pl-10 pr-11 bg-muted/30 border-border focus:border-primary"
                    />
                    <button
                      type="button"
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="fp-confirm" className="text-sm font-medium text-foreground">
                    Confirm password <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="fp-confirm"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="h-12 pl-10 pr-11 bg-muted/30 border-border focus:border-primary"
                    />
                    <button
                      type="button"
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-2 mt-2"
                  disabled={isResetting}
                >
                  {isResetting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Resetting...</>
                  ) : (
                    <>Reset password</>
                  )}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                    onClick={() => navigate("/auth")}
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
