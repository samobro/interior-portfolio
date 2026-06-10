import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { setAuthTokenGetter } from "../utils/authToken.js";

export function ClerkAuthBridge({ children }) {
  const { isLoaded, getToken, userId } = useAuth();
  const [authReady, setAuthReady] = useState(false);
  const prevUserIdRef = useRef(undefined);

  useEffect(() => {
    if (!isLoaded) {
      setAuthReady(false);
      return;
    }

    setAuthTokenGetter(async () => {
      try {
        return (await getToken()) ?? null;
      } catch {
        return null;
      }
    });

    setAuthReady(true);

    return () => {
      setAuthTokenGetter(null);
      setAuthReady(false);
    };
  }, [getToken, isLoaded]);

  useEffect(() => {
    if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
      // Reserved for clearing any future auth-related client cache on account switch.
    }

    prevUserIdRef.current = userId ?? null;
  }, [userId]);

  if (!isLoaded || !authReady) return null;
  return <>{children}</>;
}
