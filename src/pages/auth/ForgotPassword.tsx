// @ts-nocheck
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { toastSuccess, toastWarning, toastError } from "../../helper/toasterNotification";
import { showSuccess } from "../../helper/sweetAlertNotification";

import {
    useSendOtpMutation,
    useVerifyOtpMutation,
    useResetPasswordMutation,
} from "../../rtk/slices/apiSlice";

const ForgotPassword = () => {
    const navigate = useNavigate();

    const [step, setStep] = useState(1);

    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [sendOtp] = useSendOtpMutation();
    const [verifyOtp] = useVerifyOtpMutation();
    const [resetPassword] = useResetPasswordMutation();

    const validateEmail = (email: string) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    // --------------------- STEP 1 → SEND OTP -----------------------
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
            const message = err?.data?.message || "Failed to send OTP.";
            toastError(message);
        }
    };

    // --------------------- STEP 2 → VERIFY OTP -----------------------
    const handleOtpChange = (value: string, index: number) => {
        if (!/^\d?$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const otpCode = otp.join("");
        if (otpCode.length !== 6) {
            toastWarning("Please enter a 6-digit OTP.");
            return;
        }

        try {
            await verifyOtp({ email, otp: otpCode }).unwrap();
            toastSuccess("OTP verified successfully.");
            setStep(3);
        } catch (err: any) {
            const message = err?.data?.message || "Invalid OTP.";
            toastError(message);
        }
    };

    // --------------------- STEP 3 → RESET PASSWORD -----------------------
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
            const message = err?.data?.message || "Unable to reset password.";
            toastError(message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
            <Card className="w-full max-w-md shadow-lg">

                {/* -------------------------------- EMAIL STEP -------------------------------- */}
                {step === 1 && (
                    <>
                        <CardHeader className="text-center">
                            <CardTitle className="text-2xl font-bold">Forgot Password</CardTitle>
                            <CardDescription>
                                Enter your email to receive an OTP.
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            <form onSubmit={handleSendOtp} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input
                                        type="email"
                                        placeholder="example@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>

                                <Button className="w-full" type="submit" variant="hero">
                                    Send OTP
                                </Button>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="w-full"
                                    onClick={() => navigate("/auth")}
                                >
                                    Back to Login
                                </Button>
                            </form>
                        </CardContent>
                    </>
                )}

                {/* -------------------------------- OTP STEP -------------------------------- */}
                {step === 2 && (
                    <>
                        <CardHeader className="text-center">
                            <CardTitle className="text-2xl font-bold">Verify OTP</CardTitle>
                            <CardDescription>Enter the 6-digit OTP sent to your email.</CardDescription>
                        </CardHeader>

                        <CardContent>
                            <form onSubmit={handleVerifyOtp} className="space-y-4">
                                <div className="flex justify-between gap-2">
                                    {otp.map((digit, index) => (
                                        <Input
                                            key={index}
                                            id={`otp-${index}`}
                                            className="w-12 text-center text-lg"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(e.target.value, index)}
                                        />
                                    ))}
                                </div>

                                <Button className="w-full" variant="hero" type="submit">
                                    Verify OTP
                                </Button>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="w-full"
                                    onClick={() => setStep(1)}
                                >
                                    Back
                                </Button>
                            </form>
                        </CardContent>
                    </>
                )}

                {/* -------------------------------- RESET PASSWORD STEP -------------------------------- */}
                {step === 3 && (
                    <>
                        <CardHeader className="text-center">
                            <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
                            <CardDescription>Enter your new password.</CardDescription>
                        </CardHeader>

                        <CardContent>
                            <form onSubmit={handleResetPassword} className="space-y-4">

                                <div className="space-y-2">
                                    <Label>New Password</Label>
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Confirm Password</Label>
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                </div>

                                <Button className="w-full" variant="hero" type="submit">
                                    Reset Password
                                </Button>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="w-full"
                                    onClick={() => navigate("/auth")}
                                >
                                    Back to Login
                                </Button>
                            </form>
                        </CardContent>
                    </>
                )}
            </Card>
        </div>
    );
};

export default ForgotPassword;
