import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/lib/auth";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { isLoading, login, logout } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleAdminLogin = async () => {
    setError("");

    try {
      const currentUser = await login({ email, password });

      if (currentUser.role !== "SUPER_ADMIN") {
        await logout();
        throw new Error(
          "This portal is only for super admins. Please use the normal sign-in page for donor or NGO accounts.",
        );
      }

      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Unable to sign in"));
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_hsl(var(--primary)/0.18),_transparent_28%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.4))] px-4 py-10">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex flex-col justify-between rounded-[2rem] border border-border/60 bg-foreground px-8 py-10 text-primary-foreground shadow-2xl">
          <div className="space-y-6">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-primary-foreground/75 transition-colors hover:text-primary-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>

            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-foreground/12">
              <ShieldCheck className="h-7 w-7" />
            </div>

            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.3em] text-primary-foreground/60">
                Admin Portal
              </p>
              <h1 className="max-w-lg text-4xl font-bold tracking-tight font-display sm:text-5xl">
                Review approvals and unlock user access.
              </h1>
              <p className="max-w-xl text-base leading-7 text-primary-foreground/80">
                Super admins can sign in here to approve donor and NGO
                registrations. Once a user is approved in the admin dashboard,
                they can log in from the standard user sign-in page.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-primary-foreground/15 bg-primary-foreground/6 p-5">
              <BadgeCheck className="mb-3 h-5 w-5" />
              <p className="font-semibold">Approve registrations</p>
              <p className="mt-2 text-sm text-primary-foreground/70">
                Review pending donor and NGO accounts and approve them from one
                dashboard.
              </p>
            </div>
            <div className="rounded-3xl border border-primary-foreground/15 bg-primary-foreground/6 p-5">
              <LockKeyhole className="mb-3 h-5 w-5" />
              <p className="font-semibold">Protected access</p>
              <p className="mt-2 text-sm text-primary-foreground/70">
                Only authorized super admin accounts can open the admin
                workspace.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center">
          <Card className="w-full rounded-[2rem] border-border/60 bg-background/92 shadow-2xl backdrop-blur">
            <CardHeader className="space-y-3">
              <CardTitle className="text-3xl font-bold tracking-tight font-display">
                Admin Sign In
              </CardTitle>
              <CardDescription className="text-base">
                Use your super admin email and password to open the approval
                dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <form
                className="space-y-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleAdminLogin();
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Admin Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="admin-email"
                      type="email"
                      className="h-12 pl-10"
                      placeholder="admin@example.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-password">Password</Label>
                  <div className="relative">
                    <LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="admin-password"
                      type="password"
                      className="h-12 pl-10"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" disabled={isLoading} className="w-full py-6 text-lg">
                  {isLoading ? "Signing In..." : "Open Admin Dashboard"}
                </Button>
              </form>

              <div className="rounded-2xl border border-border/60 bg-muted/35 p-4 text-sm text-muted-foreground">
                Not an admin? Use the normal{" "}
                <Link to="/login" className="font-semibold text-primary hover:underline">
                  user sign-in
                </Link>{" "}
                for donor and NGO accounts.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
