import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import { getAuthToken } from "../utils/authToken.js";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://interior-portfolio-production-4108.up.railway.app";

export function ProtectedRoute({ component }) {
  const { isSignedIn, isLoaded } = useAuth();
  const [status, setStatus] = useState("loading");
  const hasFetched = useRef(false);
  const Component = component;

  useEffect(() => {
    if (hasFetched.current || !isLoaded) return;

    if (!isSignedIn) {
      hasFetched.current = true;
      setStatus("denied");
      return;
    }

    hasFetched.current = true;
    let cancelled = false;

    (async () => {
      try {
        const token = await getAuthToken();
        if (!token) {
          if (!cancelled) setStatus("denied");
          return;
        }

        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          if (!cancelled) setStatus("denied");
          return;
        }

        const data = await res.json();
        if (!cancelled) {
          setStatus(data.isAdmin ? "admin" : "denied");
        }
      } catch {
        if (!cancelled) {
          setStatus("denied");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-luxuryBg">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-luxuryGold border-solid" />
      </div>
    );
  }

  if (status === "admin") return <Component />;
  if (isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-luxuryBg px-4">
        <div className="max-w-md w-full rounded-2xl border border-white/10 bg-luxurySurface p-8 text-center shadow-2xl shadow-black/30">
          <p className="font-display text-sm uppercase tracking-[0.35em] text-luxuryMuted mb-3">
            Restricted Area
          </p>
          <h1 className="font-display text-3xl text-white mb-2">Access Denied</h1>
          <p className="text-luxuryMuted">
            Your account is signed in, but it does not have admin access.
          </p>
        </div>
      </div>
    );
  }
  return <Navigate to="/admin" replace />;
}
