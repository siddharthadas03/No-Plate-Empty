import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, ShieldCheck, XCircle } from "lucide-react";
import { API } from "@/lib/api";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import {
  AuthUser,
  getApiErrorMessage,
  getAuthHeaders,
  getErrorMessage,
  readApiResponse,
} from "@/lib/auth";

type PendingUser = Pick<AuthUser, "_id" | "name" | "email" | "role" | "createdAt">;

const AdminDashboard = () => {
  const { clearSession, token, user } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<{
    id: string;
    type: "approve" | "reject";
  } | null>(null);

  const loadPendingUsers = async () => {
    if (!token) {
      setError("Your session has expired. Please sign in again.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API}/api/admin/pending-users`, {
        headers: getAuthHeaders(token),
      });
      const payload = await readApiResponse(response);

      if (!response.ok) {
        if (response.status === 401) {
          clearSession();
        }
        throw new Error(getApiErrorMessage(payload, "Unable to load pending users."));
      }

      setPendingUsers(Array.isArray(payload) ? (payload as PendingUser[]) : []);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "Access denied or session expired."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPendingUsers();
  }, [token]);

  const approveUser = async (id: string) => {
    if (!token) {
      setError("Your session has expired. Please sign in again.");
      return;
    }

    setPendingAction({ id, type: "approve" });
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API}/api/admin/approve/${id}`, {
        method: "PATCH",
        headers: getAuthHeaders(token),
      });
      const payload = await readApiResponse(response);

      if (!response.ok) {
        if (response.status === 401) {
          clearSession();
        }
        throw new Error(getApiErrorMessage(payload, "Approval failed."));
      }

      setPendingUsers((currentUsers) =>
        currentUsers.filter((pendingUser) => pendingUser._id !== id),
      );
      setSuccess(
        payload?.message
          ? `${payload.message} The user can now log in.`
          : "User approved successfully. The user can now log in.",
      );
    } catch (err) {
      setError(getErrorMessage(err, "Approval failed."));
    } finally {
      setPendingAction(null);
    }
  };

  const rejectUser = async (id: string) => {
    if (!token) {
      setError("Your session has expired. Please sign in again.");
      return;
    }

    setPendingAction({ id, type: "reject" });
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API}/api/admin/reject/${id}`, {
        method: "PATCH",
        headers: getAuthHeaders(token),
      });
      const payload = await readApiResponse(response);

      if (!response.ok) {
        if (response.status === 401) {
          clearSession();
        }
        throw new Error(getApiErrorMessage(payload, "Rejection failed."));
      }

      setPendingUsers((currentUsers) =>
        currentUsers.filter((pendingUser) => pendingUser._id !== id),
      );
      setSuccess(
        payload?.message
          ? String(payload.message)
          : "User rejected successfully. The account will be deleted after the rejection retention window.",
      );
    } catch (err) {
      setError(getErrorMessage(err, "Rejection failed."));
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <DashboardShell
      title="Admin Dashboard"
      description="Review pending registrations and grant access to approved donor and recipient organizations."
    >
      <Card className="border-border/60 bg-background/90 shadow-lg">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Pending User Approvals</CardTitle>
            <CardDescription>
              Approve or reject requests, then keep the queue clear so eligible
              users can sign in without delay.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <div className="rounded-2xl border border-border/60 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Pending
              </p>
              <p className="mt-1 text-xl font-semibold text-foreground">
                {pendingUsers.length}
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Signed In
              </p>
              <p className="mt-1 text-xl font-semibold text-foreground">
                {user?.name}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {success && (
            <div className="flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
              Loading pending approvals...
            </div>
          ) : pendingUsers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 px-4 py-8 text-center">
              <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-primary" />
              <p className="font-medium text-foreground">All caught up</p>
              <p className="text-sm text-muted-foreground">
                There are no pending users waiting for approval right now.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingUsers.map((pendingUser) => (
                <div
                  key={pendingUser._id}
                  className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-muted/20 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-lg font-semibold text-foreground">
                        {pendingUser.name}
                      </p>
                      <Badge variant="secondary">{pendingUser.role}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {pendingUser.email}
                    </p>
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      <Clock3 className="h-3.5 w-3.5" />
                      Pending approval
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      className="min-w-28"
                      onClick={() => void approveUser(pendingUser._id)}
                      disabled={pendingAction?.id === pendingUser._id}
                    >
                      {pendingAction?.id === pendingUser._id &&
                      pendingAction.type === "approve"
                        ? "Approving..."
                        : "Approve"}
                    </Button>
                    <Button
                      variant="outline"
                      className="min-w-28"
                      onClick={() => void rejectUser(pendingUser._id)}
                      disabled={pendingAction?.id === pendingUser._id}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      {pendingAction?.id === pendingUser._id &&
                      pendingAction.type === "reject"
                        ? "Rejecting..."
                        : "Reject"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
};

export default AdminDashboard;
