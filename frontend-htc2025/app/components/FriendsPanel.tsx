"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { FriendsList, FriendsStatus } from "@/app/components/FriendsList";
import { Input } from "@/components/ui/input";
import { getFirebaseAuth } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import type { Friend, FriendsResponse } from "@/app/types/friend";

const backendBaseUrl = (() => {
  const fromEnv =
    process.env.NEXT_PUBLIC_BACKEND_API_URL ??
    process.env.BACKEND_API_URL ??
    "";
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

interface PendingFriendRequest {
  id: number;
  sender_email: string;
  sender_name: string;
  status: string;
  created_at: string;
}

interface PendingRequestsResponse {
  pending_requests: PendingFriendRequest | PendingFriendRequest[] | null;
}

async function extractMessageFromResponse(
  response: Response,
  fallback: string
) {
  try {
    const data = await response.clone().json();
    if (typeof (data as { message?: string })?.message === "string") {
      return data.message;
    }
  } catch {
    // ignore
  }

  try {
    const text = await response.clone().text();
    if (text) {
      return text;
    }
  } catch {
    // ignore
  }

  return fallback;
}

async function syncBackendWithAuth(
  mode: AuthMode,
  user: User,
  fullName?: string
): Promise<AuthResponsePayload> {
  if (!backendBaseUrl) {
    throw new Error(
      "BACKEND_API_URL is not configured. Set NEXT_PUBLIC_BACKEND_API_URL (or BACKEND_API_URL) before logging in."
    );
  }

  const endpoint = `${backendBaseUrl}/auth/${
    mode === "signup" ? "signup" : "login"
  }`;
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
      Authorization: `Bearer ${idToken}`,
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
        : "Unable to parse backend authentication response."
    );
  }
}

async function fetchFriendsFromBackend(user: User): Promise<Friend[]> {
  if (!backendBaseUrl) {
    throw new Error("BACKEND_API_URL is not configured.");
  }

  const idToken = await user.getIdToken();

  const response = await fetch(`${backendBaseUrl}/friends`, {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${idToken}`,
    },
  });

  if (!response.ok) {
    let message = "Unable to load friends.";
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
    const data = (await response.json()) as FriendsResponse;
    const friends = data?.friends;
    if (!friends) {
      return [];
    }

    return Array.isArray(friends) ? friends : [friends];
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : "Unable to parse friends response."
    );
  }
}

async function fetchPendingRequestsFromBackend(user: User): Promise<PendingFriendRequest[]> {
  if (!backendBaseUrl) {
    throw new Error("BACKEND_API_URL is not configured.");
  }

  const idToken = await user.getIdToken();

  const response = await fetch(`${backendBaseUrl}/friends/requests/pending`, {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${idToken}`,
    },
  });

  if (!response.ok) {
    const message = await extractMessageFromResponse(response, "Unable to load pending requests.");
    throw new Error(message);
  }

  try {
    const data = (await response.json()) as PendingRequestsResponse;
    const pending = data?.pending_requests;
    if (!pending) {
      return [];
    }

    return Array.isArray(pending) ? pending : [pending];
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Unable to parse pending requests response.",
    );
  }
}

export function FriendsPanel() {
  const auth = useMemo(() => getFirebaseAuth(), []);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [formValues, setFormValues] = useState({
    email: "",
    password: "",
    fullName: "",
  });
  const [user, setUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<BackendStatus>({
    state: "idle",
  });
  const [backendError, setBackendError] = useState<string | null>(null);
  const [backendAuth, setBackendAuth] = useState<{
    user: BackendUserPayload;
    isNewUser: boolean;
  } | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendsStatus, setFriendsStatus] = useState<FriendsStatus>("idle");
  const [friendsError, setFriendsError] = useState<string | null>(null);
  const [friendsFetchSignal, setFriendsFetchSignal] = useState(0);
  const [friendRequestEmail, setFriendRequestEmail] = useState("");
  const [friendRequestStatus, setFriendRequestStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const [friendRequestMessage, setFriendRequestMessage] = useState<
    string | null
  >(null);
  const [pendingRequests, setPendingRequests] = useState<PendingFriendRequest[]>([]);
  const [pendingRequestsStatus, setPendingRequestsStatus] = useState<FriendsStatus>(
    "idle",
  );
  const [pendingRequestsError, setPendingRequestsError] = useState<string | null>(null);
  const [pendingRequestsFetchSignal, setPendingRequestsFetchSignal] = useState(0);
  const [managingRequestIds, setManagingRequestIds] = useState<Set<number>>(new Set());
  const [pendingActionFeedback, setPendingActionFeedback] = useState<
    | {
        type: "success" | "error";
        message: string;
      }
    | null
  >(null);
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
    if (
      !hasBackendConfigured ||
      !user ||
      backendAuth ||
      backendSyncInFlight.current
    ) {
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
        const message =
          err instanceof Error ? err.message : "Unable to reach the backend.";
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

  useEffect(() => {
    if (!backendAuth) {
      setFriends([]);
      setFriendsStatus("idle");
      setFriendsError(null);
      setFriendsFetchSignal(0);
      setFriendRequestEmail("");
      setFriendRequestStatus("idle");
      setFriendRequestMessage(null);
      setPendingRequests([]);
      setPendingRequestsStatus("idle");
      setPendingRequestsError(null);
      setPendingRequestsFetchSignal(0);
      setManagingRequestIds(new Set());
      setPendingActionFeedback(null);
      return;
    }

    setFriendsStatus("idle");
    setFriendsError(null);
    setFriendsFetchSignal((previous) => previous + 1);
    setPendingRequestsStatus("idle");
    setPendingRequestsError(null);
    setPendingRequestsFetchSignal((previous) => previous + 1);
  }, [backendAuth]);

  useEffect(() => {
    if (!backendAuth || !user || friendsFetchSignal === 0) {
      return;
    }

    let isMounted = true;
    setFriendsStatus("loading");
    setFriendsError(null);

    fetchFriendsFromBackend(user)
      .then((list) => {
        if (!isMounted) {
          return;
        }
        setFriends(list);
        setFriendsStatus("success");
      })
      .catch((err) => {
        if (!isMounted) {
          return;
        }
        setFriendsStatus("error");
        setFriendsError(
          err instanceof Error ? err.message : "Unable to load friends."
        );
      });

    return () => {
      isMounted = false;
    };
  }, [backendAuth, friendsFetchSignal, user]);

  useEffect(() => {
    if (!backendAuth || !user || pendingRequestsFetchSignal === 0) {
      return;
    }

    let isMounted = true;
    setPendingRequestsStatus("loading");
    setPendingRequestsError(null);

    fetchPendingRequestsFromBackend(user)
      .then((list) => {
        if (!isMounted) {
          return;
        }
        setPendingRequests(list);
        setPendingRequestsStatus("success");
      })
      .catch((err) => {
        if (!isMounted) {
          return;
        }
        setPendingRequestsStatus("error");
        setPendingRequestsError(
          err instanceof Error
            ? err.message
            : "Unable to load pending requests.",
        );
      });

    return () => {
      isMounted = false;
    };
  }, [backendAuth, pendingRequestsFetchSignal, user]);

  const updateField =
    (field: keyof typeof formValues) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setFormValues((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formValues.email || !formValues.password) {
      setFormError("Email and password are required.");
      return;
    }

    if (authMode === "signup" && !formValues.fullName.trim()) {
      setFormError(
        "Please share your full name so we can finish signing you up."
      );
      return;
    }

    if (!hasBackendConfigured) {
      setFormError(
        "Set NEXT_PUBLIC_BACKEND_API_URL (or BACKEND_API_URL) before signing in."
      );
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setBackendError(null);

    let createdUser: User | null = null;

    try {
      if (authMode === "login") {
        const credentials = await signInWithEmailAndPassword(
          auth,
          formValues.email,
          formValues.password
        );
        createdUser = credentials.user;
      } else {
        const credentials = await createUserWithEmailAndPassword(
          auth,
          formValues.email,
          formValues.password
        );
        createdUser = credentials.user;
      }

      setBackendStatus({ state: "syncing" });

      const data = await syncBackendWithAuth(
        authMode,
        createdUser,
        authMode === "signup" ? formValues.fullName : undefined
      );

      setBackendAuth({
        user: data.user,
        isNewUser: Boolean(data.is_new_user),
      });
      setBackendStatus({ state: "success" });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to finish authentication.";
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
      setFormError(
        err instanceof Error ? err.message : "Unable to sign out right now."
      );
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
      const message =
        err instanceof Error ? err.message : "Unable to reach the backend.";
      setBackendError(message);
      setBackendStatus({ state: "idle" });
    }
  };

  const retryFriendsFetch = () => {
    if (!backendAuth || !user) {
      return;
    }
    setFriendsFetchSignal((previous) => previous + 1);
  };

  const retryPendingRequestsFetch = () => {
    if (!backendAuth || !user) {
      return;
    }
    setPendingActionFeedback(null);
    setPendingRequestsFetchSignal((previous) => previous + 1);
  };

  const handleFriendRequestEmailChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setFriendRequestEmail(event.target.value);
    if (friendRequestStatus !== "idle") {
      setFriendRequestStatus("idle");
      setFriendRequestMessage(null);
    }
  };

  const handleFriendRequestSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!backendAuth || !user) {
      return;
    }

    const email = friendRequestEmail.trim();
    if (!email) {
      setFriendRequestStatus("error");
      setFriendRequestMessage(
        "Please enter an email before sending a request."
      );
      return;
    }

    setFriendRequestStatus("sending");
    setFriendRequestMessage(null);

    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`${backendBaseUrl}/friends/requests/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        credentials: "include",
        body: JSON.stringify({ friend_email: email }),
      });

      if (!response.ok) {
        const message = await extractMessageFromResponse(
          response,
          "Unable to send friend request."
        );
        setFriendRequestStatus("error");
        setFriendRequestMessage(message);
        return;
      }

      const successMessage = await extractMessageFromResponse(
        response,
        "Friend request sent."
      );
      setFriendRequestStatus("success");
      setFriendRequestMessage(successMessage);
      setFriendRequestEmail("");
    } catch (err) {
      setFriendRequestStatus("error");
      setFriendRequestMessage(
        err instanceof Error
          ? err.message
          : "Unable to send friend request right now."
      );
    }
  };

  const managePendingRequest = async (requestId: number, accept: boolean) => {
    if (!backendAuth || !user) {
      return;
    }

    setPendingActionFeedback(null);
    setManagingRequestIds((previous) => {
      const next = new Set(previous);
      next.add(requestId);
      return next;
    });

    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`${backendBaseUrl}/friends/requests/manage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        credentials: "include",
        body: JSON.stringify({ request_id: requestId, accept }),
      });

      if (!response.ok) {
        const message = await extractMessageFromResponse(
          response,
          accept ? "Unable to accept request." : "Unable to decline request.",
        );
        setPendingActionFeedback({ type: "error", message });
        return;
      }

      const successMessage = await extractMessageFromResponse(
        response,
        accept ? "Friend request accepted." : "Friend request declined.",
      );
      setPendingActionFeedback({ type: "success", message: successMessage });
      setPendingRequestsFetchSignal((previous) => previous + 1);
      if (accept) {
        setFriendsFetchSignal((previous) => previous + 1);
      }
    } catch (err) {
      setPendingActionFeedback({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : accept
              ? "Unable to accept request right now."
              : "Unable to decline request right now.",
      });
    } finally {
      setManagingRequestIds((previous) => {
        const next = new Set(previous);
        next.delete(requestId);
        return next;
      });
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
    const backendName =
      backendAuth?.user.full_name?.trim() ||
      backendAuth?.user.email ||
      displayName;
    const isSendingFriendRequest = friendRequestStatus === "sending";
    const isPendingLoading =
      pendingRequestsStatus === "loading" || pendingRequestsStatus === "idle";
    const hasPendingRequests =
      pendingRequestsStatus === "success" && pendingRequests.length > 0;
    const showPendingEmptyState =
      pendingRequestsStatus === "success" && pendingRequests.length === 0;
    const pendingHeading =
      pendingRequestsStatus === "error"
        ? "Unable to load invites"
        : hasPendingRequests
          ? `${pendingRequests.length} awaiting action`
          : "No pending invites";

    return (
      <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
        <div className="rounded-2xl border bg-card/70 p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Signed in as
              </p>
              <p className="text-base font-semibold">{displayName}</p>
              {backendAuth ? (
                <p className="text-xs text-muted-foreground">
                  Backend user #{backendAuth.user.id}: {backendName}
                </p>
              ) : null}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Sign out
            </Button>
          </div>
        </div>

        <form
          onSubmit={handleFriendRequestSubmit}
          className="space-y-3 rounded-2xl border bg-card/70 p-4 shadow-sm"
        >
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Invite a friend
            </p>
            <p className="text-sm text-muted-foreground">
              Send a request by email to start collaborating.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              type="email"
              placeholder="friend@example.com"
              value={friendRequestEmail}
              onChange={handleFriendRequestEmailChange}
              required
            />
            <Button
              type="submit"
              className="sm:w-auto"
              disabled={isSendingFriendRequest || !friendRequestEmail.trim()}
            >
              {isSendingFriendRequest ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Send request
            </Button>
          </div>
          {friendRequestMessage ? (
            <div
              className={cn(
                "rounded-lg border px-3 py-2 text-sm",
                friendRequestStatus === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-destructive/30 bg-destructive/5 text-destructive"
              )}
            >
              {friendRequestMessage}
            </div>
          ) : null}
        </form>

        <div className="space-y-4">
          <FriendsList
            status={friendsStatus}
            friends={friends}
            errorMessage={friendsError}
            isNewUser={backendAuth?.isNewUser}
            onRetry={retryFriendsFetch}
          />

          <section className="flex flex-col shrink-0 rounded-2xl border bg-card/70 shadow-sm">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Pending requests
                </p>
                <h3 className="text-base font-semibold">{pendingHeading}</h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="gap-1.5 text-muted-foreground"
                  onClick={retryPendingRequestsFetch}
                  disabled={isPendingLoading}
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
                {isPendingLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : null}
              </div>
            </div>

            {pendingActionFeedback ? (
              <div
                className={cn(
                  "mx-4 mt-4 rounded-lg border px-3 py-2 text-sm",
                  pendingActionFeedback.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-destructive/30 bg-destructive/5 text-destructive",
                )}
              >
                {pendingActionFeedback.message}
              </div>
            ) : null}

            {pendingRequestsStatus === "error" ? (
              <div className="flex flex-col items-center justify-center gap-3 px-6 py-8 text-center text-sm">
                <p className="text-destructive">
                  {pendingRequestsError ?? "Unable to load pending requests."}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={retryPendingRequestsFetch}
                  disabled={isPendingLoading}
                >
                  <RefreshCw className="h-4 w-4" />
                  Try again
                </Button>
              </div>
            ) : null}

            {showPendingEmptyState ? (
              <div className="flex flex-col items-center justify-center gap-3 px-6 py-8 text-center text-sm text-muted-foreground">
                <p>No one is waiting on you right now.</p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={retryPendingRequestsFetch}
                  disabled={isPendingLoading}
                >
                  Refresh
                </Button>
              </div>
            ) : null}

            {hasPendingRequests ? (
              <ul className="divide-y">
                {pendingRequests.map((request) => {
                  const createdAt = new Date(request.created_at);
                  const createdAtLabel = Number.isNaN(createdAt.getTime())
                    ? request.created_at
                    : createdAt.toLocaleString();
                  const isManaging = managingRequestIds.has(request.id);
                  return (
                    <li
                      key={request.id}
                      className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-tight">
                          {request.sender_name}
                        </p>
                        <p className="text-xs text-muted-foreground leading-tight">
                          {request.sender_email}
                        </p>
                        <p className="text-[11px] text-muted-foreground leading-tight">
                          Requested {createdAtLabel}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 sm:justify-end">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => managePendingRequest(request.id, true)}
                          disabled={isManaging}
                        >
                          {isManaging ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : null}
                          Accept
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => managePendingRequest(request.id, false)}
                          disabled={isManaging}
                        >
                          {isManaging ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : null}
                          Decline
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : null}

            {isPendingLoading ? (
              <div className="space-y-3 px-4 py-6 text-sm text-muted-foreground">
                {[0, 1].map((index) => (
                  <div
                    key={index}
                    className="animate-pulse rounded-lg border bg-muted/40 px-4 py-3"
                  >
                    Loading request…
                  </div>
                ))}
              </div>
            ) : null}
          </section>
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
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Step 1
          </p>
          <h3 className="text-lg font-semibold">Sign in to unlock friends</h3>
          <p className="text-sm text-muted-foreground">
            We authenticate with Firebase first, then exchange your ID token
            with the backend to unlock the friends API.
          </p>
        </div>
        <div className="inline-flex items-center rounded-full border bg-muted/40 p-0.5 text-xs font-medium">
          {(["login", "signup"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              className={cn(
                "rounded-full px-3 py-1 capitalize transition-colors",
                authMode === mode
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground"
              )}
              onClick={() => setAuthMode(mode)}
              disabled={isSubmitting}
            >
              {mode === "login" ? "Log in" : "Sign up"}
            </button>
          ))}
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border bg-card/70 p-5 shadow-sm"
      >
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
            autoComplete={
              authMode === "signup" ? "new-password" : "current-password"
            }
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
          {isSubmitting || isSyncingBackend ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : null}
          {authMode === "login" ? "Log in" : "Create account"}
        </Button>
      </form>

      <div className="rounded-2xl border border-dashed bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
        Your Firebase credentials stay on this device. We only transmit the ID
        token to the backend for verification.
      </div>
    </div>
  );
}
