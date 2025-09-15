import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";



const LoginPage = () => {
  const navigate = useNavigate();
  // userType selection removed; backend response decides role
  const [step, setStep] = useState<"PHONE" | "OTP">("PHONE");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [timer, setTimer] = useState(0); // seconds remaining to resend
  const [detectedRole, setDetectedRole] = useState<string | null>(null);

  // Check for existing tokens and redirect automatically
  useEffect(() => {
    const adminToken = Cookies.get("admin_token");
    const vendorToken = Cookies.get("vendor_token");
    const userRole = Cookies.get("user_role");

    if (adminToken && userRole === "admin") {
      toast.success("Welcome back, Admin!");
      navigate("/dashboard");
    } else if (vendorToken && userRole === "vendor") {
      toast.success("Welcome back, Vendor!");
      navigate("/vendor/dashboard");
    }
  }, [navigate]);

  // countdown for resend
  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const baseUrl = import.meta.env.VITE_BASE_UR;

  const isValidPhone = (p: string) => /^\d{10}$/.test(p);
  const isValidOtp = (o: string) => /^\d{4,6}$/.test(o);

  const requestOtp = async () => {
    if (!isValidPhone(phone)) {
      toast.error("Enter valid 10 digit phone");
      return;
    }
    try {
      setSending(true);
      const body = new URLSearchParams();
      body.append("mobile", phone);
      const res = await fetch(`${baseUrl}public/vendor-login-mobile-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(data?.message || "OTP sent");
        setStep("OTP");
        setTimer(30); // 30s cooldown
      } else {
        toast.error(data?.message || "Failed to send OTP");
      }
    } catch (e) {
      console.error(e);
      toast.error("Network error");
    } finally {
      setSending(false);
    }
  };

  const verifyOtp = async () => {
    if (!isValidOtp(otp)) {
      toast.error("Enter valid OTP");
      return;
    }
    try {
      setVerifying(true);
      const body = new URLSearchParams();
      body.append("phone", phone);
      body.append("otp", otp);
      const res = await fetch(`${baseUrl}public/vendor-verify-mobile-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.token && data?.user) {
        const rawRole = (data.user.role || "").toString();
        const upperRole = rawRole.toUpperCase();
        const lowerRole = rawRole.toLowerCase();
        setDetectedRole(upperRole);
        if (upperRole === "ADMIN") {
          Cookies.set("admin_token", data.token);
        } else if (upperRole === "VENDOR") {
          Cookies.set("vendor_token", data.token);
        }
        Cookies.set("user_role", lowerRole);
        Cookies.set("user_data", JSON.stringify(data.user));
        toast.success("Logged in");
        if (upperRole === "ADMIN") navigate("/dashboard");
        else if (upperRole === "VENDOR") navigate("/vendor/dashboard");
        else toast.error("Unknown role");
      } else {
        toast.error(data?.message || "OTP verify failed");
      }
    } catch (e) {
      console.error(e);
      toast.error("Network error");
    } finally {
      setVerifying(false);
    }
  };

  // Trigger send / verify on Enter key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      if (step === "PHONE") {
        if (!sending && isValidPhone(phone)) requestOtp();
      } else if (step === "OTP") {
        if (!verifying && isValidOtp(otp)) verifyOtp();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [step, phone, otp, sending, verifying]);

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/">
            <img
              src="logo.png"
              alt="Shopinger Logo"
              className="mx-auto h-12 w-auto mb-3"
            />
            </Link>
            <p className="text-gray-600">Sign in with OTP</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Login</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                {/* Role selection removed; single OTP flow */}

                {step === "PHONE" && (
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-gray-600 text-sm">+91</span>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Enter phone number"
                        value={phone}
                        onChange={(e) => {
                          const val = e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 10);
                          setPhone(val);
                        }}
                        maxLength={10}
                        inputMode="numeric"
                        pattern="[0-9]{10}"
                        className="flex-1"
                      />
                    </div>
                  </div>
                )}

                {step === "OTP" && (
                  <div>
                    <Label htmlFor="otp">Enter OTP</Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="4-6 digit OTP"
                      value={otp}
                      onChange={(e) =>
                        setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      inputMode="numeric"
                      maxLength={6}
                      className="mt-1"
                    />
                    <div className="flex justify-between items-center mt-2 text-sm">
                      <button
                        type="button"
                        onClick={() => timer === 0 && requestOtp()}
                        disabled={timer > 0 || sending}
                        className={`text-blue-600 disabled:opacity-50`}
                      >
                        Resend {timer > 0 && `in ${timer}s`}
                      </button>
                      {detectedRole && (
                        <span className="text-gray-600">
                          Role: {detectedRole}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <Button
                  type="button"
                  className="w-full"
                  onClick={step === "PHONE" ? requestOtp : verifyOtp}
                  disabled={
                    step === "PHONE"
                      ? !isValidPhone(phone) || sending
                      : !isValidOtp(otp) || verifying
                  }
                >
                  {step === "PHONE"
                    ? sending
                      ? "Sending..."
                      : "Send OTP"
                    : verifying
                    ? "Verifying..."
                    : "Verify OTP"}
                </Button>

                {step === "OTP" && (
                  <button
                    type="button"
                    onClick={() => {
                      setStep("PHONE");
                      setOtp("");
                      setDetectedRole(null);
                    }}
                    className="text-sm text-gray-600 hover:underline"
                  >
                    <ArrowLeft className="inline h-4 w-4 mr-1" /> Change number
                  </button>
                )}

                <div className="text-center text-sm text-gray-600 pt-2">
                  Don't have an account?{" "}
                  <Link
                    to="/register"
                    className="text-blue-600 hover:underline"
                  >
                    Vendor Register
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="mt-8 text-center text-sm text-gray-500">
            © 2025 Shopinger. All rights reserved.
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
