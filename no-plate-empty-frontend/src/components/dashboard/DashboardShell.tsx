import { ReactNode, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Home, LogOut, Settings } from "lucide-react";
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
import { getRoleLabel } from "@/lib/auth";

interface DashboardShellProps {
  title: string;
  description: string;
  children: ReactNode;
}

const DashboardShell = ({
  title,
  description,
  children,
}: DashboardShellProps) => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_hsl(var(--secondary)/0.18),_transparent_32%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.35))]">
      <header className="border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="container mx-auto flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <Link to="/" className="inline-flex items-center gap-2 text-foreground">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                <Heart className="h-5 w-5 fill-current text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-bold">
                NoPlate<span className="text-secondary">Empty</span>
              </span>
            </Link>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {title}
                </h1>
                <Badge variant="secondary">{getRoleLabel(user.role)}</Badge>
              </div>
              <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                {description}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" asChild>
              <Link to="/">
                <Home className="mr-2 h-4 w-4" />
                Home
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/account/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </Button>
            <Button onClick={() => void handleSignOut()} disabled={isSigningOut}>
              <LogOut className="mr-2 h-4 w-4" />
              {isSigningOut ? "Signing out..." : "Sign out"}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
          <div className="space-y-6">{children}</div>
          <Card className="border-border/60 bg-background/90 shadow-lg">
            <CardHeader>
              <CardTitle>Account Snapshot</CardTitle>
              <CardDescription>
                Your active account details and access status.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="rounded-2xl border border-border/60 bg-muted/40 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Signed In As
                </p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  {user.name}
                </p>
                <p className="text-muted-foreground">{user.email}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-2xl border border-border/60 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Approval
                  </p>
                  <p className="mt-2 font-semibold text-foreground">
                    {user.isApproved ? "Approved" : "Pending"}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Access
                  </p>
                  <p className="mt-2 font-semibold text-foreground">
                    {user.isBlocked ? "Blocked" : "Active"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default DashboardShell;
