"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { Loader2, RefreshCw, Users2 } from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { Input } from "@/components/ui/input";
import { getFirebaseAuth } from "@/lib/firebase";
import { cn } from "@/lib/utils";

const backendBaseUrl = (() => {
  const fromEnv =
    process.env.NEXT_PUBLIC_BACKEND_API_URL ?? process.env.BACKEND_API_URL ?? "";
  if (!fromEnv) {
    return "";
  }
  return fromEnv.endsWith("/") ? fromEnv.slice(0, -1) : fromEnv;
})();

const hasBackendConfigured = Boolean(backendBaseUrl);

type AuthMode = "login" | "signup";
type BackendStatus =
  | { state: "idle" }
  | { state: "syncing" }
  | { state: "success" };

interface BackendUserPayload {
  id: number;
  email: string;
  full_name?: string | null;
  is_active: boolean;
}

interface AuthResponsePayload {
  user: BackendUserPayload;
  is_new_user?: boolean;
}

async function syncBackendWithAuth(
  mode: AuthMode,
  user: User,
  fullName?: string,
): Promise<AuthResponsePayload> {
  if (!backendBaseUrl) {
    throw new Error(
      "BACKEND_API_URL is not configured. Set NEXT_PUBLIC_BACKEND_API_URL (or BACKEND_API_URL) before logging in.",
    );
  }

  const endpoint = `${backendBaseUrl}/auth/${mode === "signup" ? "signup" : "login"}`;
  const idToken = await user.getIdToken();

  const payload: Record<string, string> = {
    id_token: idToken,
  };

  if (mode === "signup") {
    if (!fullName?.trim()) {
      throw new Error("A full name is required to finish signing up.");
    }
    payload.full_name = fullName.trim();
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = "Backend authentication failed.";
    try {
      const data = await response.json();
      if (typeof data?.message === "string") {
        message = data.message;
      }
    } catch {
      const fallback = await response.text();
      if (fallback) {
        message = fallback;
      }
    }
    throw new Error(message);
  }

  try {
    const data = (await response.json()) as AuthResponsePayload;
    if (!data?.user) {
      throw new Error("Backend response is missing the user payload.");
    }
    return data;
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : "Unable to parse backend authentication response.",
    );
  }
}

export function FriendsPanel() {
  const auth = useMemo(() => getFirebaseAuth(), []);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [formValues, setFormValues] = useState({ email: "", password: "", fullName: "" });
  const [user, setUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<BackendStatus>({ state: "idle" });
  const [backendError, setBackendError] = useState<string | null>(null);
  const [backendAuth, setBackendAuth] = useState<{ user: BackendUserPayload; isNewUser: boolean } | null>(null);
  const backendSyncInFlight = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setInitializing(false);
    });

    return unsubscribe;
  }, [auth]);

  const isSyncingBackend = backendStatus.state === "syncing";

  useEffect(() => {
    if (!hasBackendConfigured || !user || backendAuth || backendSyncInFlight.current) {
      return;
    }

    backendSyncInFlight.current = true;
    setBackendStatus({ state: "syncing" });
    setBackendError(null);

    let isMounted = true;

    syncBackendWithAuth("login", user)
      .then((data) => {
        if (!isMounted) {
          return;
        }
        setBackendStatus({ state: "success" });
        setBackendAuth({
          user: data.user,
          isNewUser: Boolean(data.is_new_user),
        });
      })
      .catch((err) => {
        if (!isMounted) {
          return;
        }
        const message = err instanceof Error ? err.message : "Unable to reach the backend.";
        setBackendError(message);
        setBackendStatus({ state: "idle" });
        setBackendAuth(null);
      })
      .finally(() => {
        backendSyncInFlight.current = false;
      });

    return () => {
      isMounted = false;
    };
  }, [backendAuth, user]);

  const updateField =
    (field: keyof typeof formValues) => (event: ChangeEvent<HTMLInputElement>) => {
      setFormValues((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formValues.email || !formValues.password) {
      setFormError("Email and password are required.");
      return;
    }

    if (authMode === "signup" && !formValues.fullName.trim()) {
      setFormError("Please share your full name so we can finish signing you up.");
      return;
    }

    if (!hasBackendConfigured) {
      setFormError("Set NEXT_PUBLIC_BACKEND_API_URL (or BACKEND_API_URL) before signing in.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setBackendError(null);

    let createdUser: User | null = null;

    try {
      if (authMode === "login") {
        const credentials = await signInWithEmailAndPassword(auth, formValues.email, formValues.password);
        createdUser = credentials.user;
      } else {
        const credentials = await createUserWithEmailAndPassword(auth, formValues.email, formValues.password);
        createdUser = credentials.user;
      }

      setBackendStatus({ state: "syncing" });

      const data = await syncBackendWithAuth(
        authMode,
        createdUser,
        authMode === "signup" ? formValues.fullName : undefined,
      );

      setBackendAuth({
        user: data.user,
        isNewUser: Boolean(data.is_new_user),
      });
      setBackendStatus({ state: "success" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to finish authentication.";
      if (createdUser) {
        setBackendError(message);
      } else {
        setFormError(message);
      }
      setBackendStatus({ state: "idle" });
      setBackendAuth(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    setIsSubmitting(true);
    setFormError(null);
    setBackendError(null);

    try {
      await signOut(auth);
      setBackendStatus({ state: "idle" });
      setBackendError(null);
      setBackendAuth(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unable to sign out right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const retryBackendSync = async () => {
    if (!user) {
      return;
    }

    setBackendError(null);
    setBackendStatus({ state: "syncing" });

    try {
      const data = await syncBackendWithAuth("login", user);
      setBackendStatus({ state: "success" });
      setBackendAuth({
        user: data.user,
        isNewUser: Boolean(data.is_new_user),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to reach the backend.";
      setBackendError(message);
      setBackendStatus({ state: "idle" });
    }
  };

  const isActionDisabled =
    isSubmitting ||
    !formValues.email ||
    !formValues.password ||
    (authMode === "signup" && !formValues.fullName.trim());

  if (initializing) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <p>Preparing sign-in…</p>
      </div>
    );
  }

  if (user && backendAuth) {
    const displayName = user.displayName ?? user.email ?? "Friend";
    const backendName = backendAuth?.user.full_name?.trim() || backendAuth?.user.email || displayName;

    return (
      <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
        <div className="rounded-2xl border bg-card/70 p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Signed in as</p>
              <p className="text-base font-semibold">{displayName}</p>
              {backendAuth ? (
                <p className="text-xs text-muted-foreground">
                  Backend user #{backendAuth.user.id}: {backendName}
                </p>
              ) : null}
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Sign out
            </Button>
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-muted bg-muted/40 p-6 text-center">
          <Users2 className="h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-lg font-semibold">Friends are on the way</p>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            {backendAuth?.isNewUser
              ? "Welcome aboard! We just created your account in the backend."
              : "Now that the backend trusts your token, we can pull the friends list here next."}
          </p>
        </div>
      </div>
    );
  }

  if (user && !backendAuth) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <div>
          <p className="text-base font-semibold">Finishing sign-in…</p>
          <p className="mt-1 text-sm text-muted-foreground">
            We&apos;re waiting for the backend to confirm your credentials.
          </p>
        </div>
        {backendError ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <p className="font-medium">{backendError}</p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-3 gap-1.5"
              onClick={retryBackendSync}
              disabled={isSubmitting || isSyncingBackend}
            >
              <RefreshCw className="h-4 w-4" />
              Retry sync
            </Button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Step 1</p>
          <h3 className="text-lg font-semibold">Sign in to unlock friends</h3>
          <p className="text-sm text-muted-foreground">
            We authenticate with Firebase first, then exchange your ID token with the backend to unlock the
            friends API.
          </p>
        </div>
        <div className="inline-flex items-center rounded-full border bg-muted/40 p-0.5 text-xs font-medium">
          {(["login", "signup"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              className={cn(
                "rounded-full px-3 py-1 capitalize transition-colors",
                authMode === mode ? "bg-background shadow-sm" : "text-muted-foreground",
              )}
              onClick={() => setAuthMode(mode)}
              disabled={isSubmitting}
            >
              {mode === "login" ? "Log in" : "Sign up"}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border bg-card/70 p-5 shadow-sm">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="friends-email">
            Email
          </label>
          <Input
            id="friends-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={formValues.email}
            onChange={updateField("email")}
            required
          />
        </div>

        {authMode === "signup" ? (
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="friends-name">
              Full name
            </label>
            <Input
              id="friends-name"
              type="text"
              placeholder="Ami Volunteer"
              value={formValues.fullName}
              onChange={updateField("fullName")}
              required
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="friends-password">
            Password
          </label>
          <Input
            id="friends-password"
            type="password"
            autoComplete={authMode === "signup" ? "new-password" : "current-password"}
            placeholder="••••••••"
            value={formValues.password}
            onChange={updateField("password")}
            required
          />
        </div>

        {formError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {formError}
          </div>
        ) : null}

        <Button type="submit" className="w-full" disabled={isActionDisabled}>
          {isSubmitting || isSyncingBackend ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {authMode === "login" ? "Log in" : "Create account"}
        </Button>
      </form>

      <div className="rounded-2xl border border-dashed bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
        Your Firebase credentials stay on this device. We only transmit the ID token to the backend for
        verification.
      </div>
    </div>
  );
}
