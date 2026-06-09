import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useSignIn } from "@clerk/clerk-react";

const getAuthErrorMessage = (search) => {
  const params = new URLSearchParams(search);

  if (params.get("error") === "sso_failed") {
    return "Google sign-in could not be completed. Please try again.";
  }

  return null;
};

export default function AdminLogin() {
  const { signIn, isLoaded } = useSignIn();
  const location = useLocation();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(
    location.state?.authError || getAuthErrorMessage(location.search),
  );

  const handleGoogleSignIn = async () => {
    if (!isLoaded || !signIn || isRedirecting) {
      return;
    }

    setErrorMessage(null);
    setIsRedirecting(true);

    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: `${window.location.origin}/#/sso-callback`,
        redirectUrlComplete: `${window.location.origin}/#/admin/dashboard`,
      });
    } catch (error) {
      console.error("Google sign-in failed", error);
      setErrorMessage("Google sign-in could not be started. Please try again.");
      setIsRedirecting(false);
    }
  };

  const isButtonDisabled = !isLoaded || isRedirecting;

  return (
    <div className="min-h-screen flex items-center justify-center bg-luxuryBg px-4">
      <div className="max-w-md w-full">
        <div className="rounded-2xl p-8 bg-luxurySurface border border-white/10 shadow-2xl shadow-black/30">
          <div className="text-center mb-8">
            <p className="font-display text-sm uppercase tracking-[0.35em] text-luxuryMuted mb-3">
              Secure Access
            </p>
            <h1 className="font-display text-3xl text-white mb-2">Admin Login</h1>
            <p className="text-luxuryMuted">Access your portfolio dashboard</p>
          </div>

          {errorMessage && (
            <div className="mb-6 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {errorMessage}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isButtonDisabled}
            className="group flex w-full items-center justify-center gap-3 rounded-full border border-white/15 bg-luxuryBg px-6 py-4 font-display text-base text-white shadow-lg shadow-black/25 transition duration-300 hover:border-white/30 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isRedirecting ? (
              <>
                <span className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Redirecting...
              </>
            ) : (
              "Sign in with Google"
            )}
          </button>

          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-xs text-luxuryMuted text-center">
              This is a secure admin area. Only authorized users can access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
