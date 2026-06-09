import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";

const adminDashboardUrl = `${window.location.origin}/#/admin/dashboard`;

export default function SSOCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleRedirectError = (event) => {
      event.preventDefault();
      console.error("SSO callback failed", event.reason);
      navigate("/admin?error=sso_failed", {
        replace: true,
        state: {
          authError: "Google sign-in could not be completed. Please try again.",
        },
      });
    };

    window.addEventListener("unhandledrejection", handleRedirectError);

    return () => {
      window.removeEventListener("unhandledrejection", handleRedirectError);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-luxuryBg px-4">
      <AuthenticateWithRedirectCallback
        signInForceRedirectUrl={adminDashboardUrl}
        signUpForceRedirectUrl={adminDashboardUrl}
      />

      <div className="rounded-2xl border border-white/10 bg-luxurySurface p-8 text-center shadow-2xl shadow-black/30">
        <div className="mx-auto mb-6 h-12 w-12 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        <h1 className="font-display text-2xl text-white mb-2">Completing sign in</h1>
        <p className="text-luxuryMuted">Please wait while we secure your admin session.</p>
      </div>
    </div>
  );
}
