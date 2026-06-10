import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth, useClerk, useSignIn } from "@clerk/clerk-react";

const getAuthErrorMessage = (search) => {
  const params = new URLSearchParams(search);

  if (params.get("error") === "sso_failed") {
    return "Google sign-in could not be completed. Please try again.";
  }

  return null;
};

export default function AdminLogin() {
  const navigate = useNavigate();
  const { signIn, isLoaded } = useSignIn();
  const { isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const location = useLocation();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(
    location.state?.authError || getAuthErrorMessage(location.search),
  );

  useEffect(() => {
    if (isSignedIn) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [isSignedIn, navigate]);

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

  if (isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-luxuryBg px-4">
        <div className="max-w-md w-full">
          <div className="rounded-2xl p-8 bg-luxurySurface border border-white/10 shadow-2xl shadow-black/30 text-center">
            <p className="font-display text-sm uppercase tracking-[0.35em] text-luxuryMuted mb-3">
              Secure Access
            </p>
            <h1 className="font-display text-3xl text-white mb-2">Redirecting</h1>
            <p className="text-luxuryMuted mb-6">Taking you to the admin dashboard.</p>
            <button
              type="button"
              onClick={() => signOut()}
              className="w-full rounded-full border border-gray-200 bg-white px-6 py-4 font-display text-base text-gray-900 shadow-sm transition duration-300 hover:bg-gray-50"
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            <div className="mb-6 rounded-xl border border-red-500/50 bg-red-950/60 px-4 py-3 text-sm text-red-400">
              {errorMessage}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isButtonDisabled}
            className="group flex w-full items-center justify-center gap-3 rounded-full border border-gray-200 bg-white px-6 py-4 font-display text-base text-gray-900 shadow-sm transition duration-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isRedirecting ? (
              <>
                <span className="h-5 w-5 rounded-full border-2 border-gray-300 border-t-gray-900 animate-spin" />
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
