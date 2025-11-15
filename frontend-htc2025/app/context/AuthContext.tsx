"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  type User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import { getFirebaseAuth } from "@/lib/firebase";

export const backendBaseUrl = (() => {
  const fromEnv =
    process.env.NEXT_PUBLIC_BACKEND_API_URL ??
    process.env.BACKEND_API_URL ??
    "";
  if (!fromEnv) {
    return "";
  }
  return fromEnv.endsWith("/") ? fromEnv.slice(0, -1) : fromEnv;
})();

export const hasBackendConfigured = Boolean(backendBaseUrl);

export type AuthMode = "login" | "signup";

export type BackendStatus =
  | { state: "idle" }
  | { state: "syncing" }
  | { state: "success" };

export interface BackendUserPayload {
  id: number;
  email: string;
  full_name?: string | null;
  is_active: boolean;
}

interface AuthResponsePayload {
  user: BackendUserPayload;
  is_new_user?: boolean;
}

export class AuthActionError extends Error {
  kind: "credentials" | "backend";

  constructor(message: string, kind: "credentials" | "backend") {
    super(message);
    this.name = "AuthActionError";
    this.kind = kind;
  }
}

async function syncBackendWithAuth(
  mode: AuthMode,
  user: User,
  fullName?: string,
): Promise<AuthResponsePayload> {
  if (!backendBaseUrl) {
    throw new AuthActionError(
      "BACKEND_API_URL is not configured. Set NEXT_PUBLIC_BACKEND_API_URL (or BACKEND_API_URL) before logging in.",
      "backend",
    );
  }

  const endpoint = `${backendBaseUrl}/auth/${mode === "signup" ? "signup" : "login"}`;
  const idToken = await user.getIdToken();

  const payload: Record<string, string> = {
    id_token: idToken,
  };

  if (mode === "signup") {
    if (!fullName?.trim()) {
      throw new AuthActionError("A full name is required to finish signing up.", "credentials");
    }
    payload.full_name = fullName.trim();
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = "Backend authentication failed.";
    try {
      const data = await response.clone().json();
      if (typeof (data as { message?: string })?.message === "string") {
        message = data.message;
      }
    } catch {
      const fallback = await response.text();
      if (fallback) {
        message = fallback;
      }
    }
    throw new AuthActionError(message, "backend");
  }

  try {
    const data = (await response.json()) as AuthResponsePayload;
    if (!data?.user) {
      throw new Error("Backend response is missing the user payload.");
    }
    return data;
  } catch (error) {
    throw new AuthActionError(
      error instanceof Error
        ? error.message
        : "Unable to parse backend authentication response.",
      "backend",
    );
  }
}

interface AuthContextValue {
  auth: ReturnType<typeof getFirebaseAuth>;
  user: User | null;
  backendAuth: {
    user: BackendUserPayload;
    isNewUser: boolean;
  } | null;
  backendStatus: BackendStatus;
  backendError: string | null;
  initializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  retryBackendSync: () => Promise<void>;
  hasBackendConfigured: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useMemo(() => getFirebaseAuth(), []);
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [backendAuth, setBackendAuth] = useState<AuthContextValue["backendAuth"]>(null);
  const [backendStatus, setBackendStatus] = useState<BackendStatus>({ state: "idle" });
  const [backendError, setBackendError] = useState<string | null>(null);
  const backendSyncInFlight = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setInitializing(false);
      if (!nextUser) {
        setBackendAuth(null);
        setBackendStatus({ state: "idle" });
        setBackendError(null);
      }
    });

    return unsubscribe;
  }, [auth]);

  const syncBackendForUser = useCallback(
    async (mode: AuthMode, nextUser: User, fullName?: string) => {
      if (!hasBackendConfigured) {
        throw new AuthActionError(
          "Set NEXT_PUBLIC_BACKEND_API_URL (or BACKEND_API_URL) before signing in.",
          "backend",
        );
      }

      if (backendSyncInFlight.current) {
        return;
      }

      backendSyncInFlight.current = true;
      setBackendStatus({ state: "syncing" });
      setBackendError(null);

      try {
        const data = await syncBackendWithAuth(mode, nextUser, fullName);
        setBackendAuth({
          user: data.user,
          isNewUser: Boolean(data.is_new_user),
        });
        setBackendStatus({ state: "success" });
        return data;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to reach the backend.";
        setBackendError(message);
        setBackendStatus({ state: "idle" });
        setBackendAuth(null);
        throw new AuthActionError(message, "backend");
      } finally {
        backendSyncInFlight.current = false;
      }
    },
    [],
  );

  useEffect(() => {
    if (!user || !hasBackendConfigured) {
      return;
    }

    if (backendAuth || backendSyncInFlight.current) {
      return;
    }

    syncBackendForUser("login", user).catch(() => {
      // Surface errors through backendError state only
    });
  }, [backendAuth, syncBackendForUser, user]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const credentials = await signInWithEmailAndPassword(auth, email, password);
        await syncBackendForUser("login", credentials.user);
      } catch (error) {
        if (error instanceof AuthActionError) {
          throw error;
        }
        const message =
          error instanceof Error ? error.message : "Unable to finish authentication.";
        throw new AuthActionError(message, "credentials");
      }
    },
    [auth, syncBackendForUser],
  );

  const signup = useCallback(
    async (email: string, password: string, fullName: string) => {
      try {
        const credentials = await createUserWithEmailAndPassword(auth, email, password);
        await syncBackendForUser("signup", credentials.user, fullName);
      } catch (error) {
        if (error instanceof AuthActionError) {
          throw error;
        }
        const message =
          error instanceof Error ? error.message : "Unable to finish authentication.";
        throw new AuthActionError(message, "credentials");
      }
    },
    [auth, syncBackendForUser],
  );

  const logout = useCallback(async () => {
    await signOut(auth);
    setBackendAuth(null);
    setBackendStatus({ state: "idle" });
    setBackendError(null);
  }, [auth]);

  const retryBackendSync = useCallback(async () => {
    if (!user) {
      throw new AuthActionError("No signed-in user to sync.", "backend");
    }
    await syncBackendForUser("login", user);
  }, [syncBackendForUser, user]);

  const value: AuthContextValue = {
    auth,
    user,
    backendAuth,
    backendStatus,
    backendError,
    initializing,
    login,
    signup,
    logout,
    retryBackendSync,
    hasBackendConfigured,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
