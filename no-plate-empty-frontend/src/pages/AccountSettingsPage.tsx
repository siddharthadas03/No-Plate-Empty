import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Heart,
  KeyRound,
  LogOut,
  Save,
  Settings,
  Trash2,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { AuthUser, getErrorMessage, getRoleHomePath, getRoleLabel } from "@/lib/auth";
import {
  deleteCurrentUserAccount,
  resetCurrentUserPassword,
  updateCurrentUser,
} from "@/lib/account-api";

const DEFAULT_NGO_RADIUS_KM = "10";

const parseOptionalNumber = (value: string) => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return undefined;
  }

  const numericValue = Number(trimmedValue);
  return Number.isFinite(numericValue) ? numericValue : Number.NaN;
};

const mapUserToProfileForm = (user: AuthUser) => ({
  name: user.name || "",
  email: user.email || "",
  address: user.location?.address || "",
  city: user.location?.city || "",
  state: user.location?.state || "",
  pincode: user.location?.pincode || "",
  latitude:
    typeof user.location?.latitude === "number" ? String(user.location.latitude) : "",
  longitude:
    typeof user.location?.longitude === "number" ? String(user.location.longitude) : "",
  searchRadiusKm:
    typeof user.searchRadiusKm === "number"
      ? String(user.searchRadiusKm)
      : DEFAULT_NGO_RADIUS_KM,
});

const getNgoMatchingSummary = (user: AuthUser) => {
  const hasCoordinates =
    typeof user.location?.latitude === "number" &&
    typeof user.location?.longitude === "number";
  const hasPincode = Boolean(user.location?.pincode?.trim());
  const hasCityAndState =
    Boolean(user.location?.city?.trim()) && Boolean(user.location?.state?.trim());

  if (hasCoordinates) {
    return `GPS matching is active within ${user.searchRadiusKm ?? 10} km of your saved NGO location.`;
  }

  if (hasPincode || hasCityAndState) {
    return "Address fallback matching is active. Add latitude and longitude for more accurate nearby results.";
  }

  return "Save a pincode, city and state, or GPS coordinates to enable nearby donor filtering.";
};

const AccountSettingsPage = () => {
  const navigate = useNavigate();
  const { clearSession, logout, token, updateUser, user } = useAuth();
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    latitude: "",
    longitude: "",
    searchRadiusKm: DEFAULT_NGO_RADIUS_KM,
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [deletePassword, setDeletePassword] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [deleteMessage, setDeleteMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    setProfileForm(mapUserToProfileForm(user));
  }, [user]);

  if (!token || !user) {
    return null;
  }

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await logout();
    navigate("/login", { replace: true });
  };

  const handleProfileUpdate = async () => {
    if (!profileForm.name.trim() || !profileForm.email.trim()) {
      setProfileMessage({
        type: "error",
        text: "Name and email are required.",
      });
      return;
    }

    const latitude = parseOptionalNumber(profileForm.latitude);
    const longitude = parseOptionalNumber(profileForm.longitude);
    const searchRadiusKm = parseOptionalNumber(profileForm.searchRadiusKm);

    if (user.role === "NGO") {
      const latitudeFilled = profileForm.latitude.trim().length > 0;
      const longitudeFilled = profileForm.longitude.trim().length > 0;

      if (latitudeFilled !== longitudeFilled) {
        setProfileMessage({
          type: "error",
          text: "Enter both latitude and longitude together for GPS matching.",
        });
        return;
      }

      if (Number.isNaN(latitude)) {
        setProfileMessage({
          type: "error",
          text: "Latitude must be a valid number.",
        });
        return;
      }

      if (Number.isNaN(longitude)) {
        setProfileMessage({
          type: "error",
          text: "Longitude must be a valid number.",
        });
        return;
      }

      if (Number.isNaN(searchRadiusKm)) {
        setProfileMessage({
          type: "error",
          text: "Search radius must be a valid number.",
        });
        return;
      }
    }

    setIsSavingProfile(true);
    setProfileMessage(null);

    try {
      const response = await updateCurrentUser(token, {
        name: profileForm.name.trim(),
        email: profileForm.email.trim(),
        ...(user.role === "NGO"
          ? {
              location: {
                address: profileForm.address.trim() || undefined,
                city: profileForm.city.trim() || undefined,
                state: profileForm.state.trim() || undefined,
                pincode: profileForm.pincode.trim() || undefined,
                latitude,
                longitude,
              },
              searchRadiusKm,
            }
          : {}),
      });

      updateUser(response.user);
      setProfileMessage({
        type: "success",
        text: response.message || "Account details updated successfully.",
      });
    } catch (error) {
      setProfileMessage({
        type: "error",
        text: getErrorMessage(error, "Unable to update your account details."),
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      setPasswordMessage({
        type: "error",
        text: "Fill in all password fields first.",
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({
        type: "error",
        text: "New password and confirm password do not match.",
      });
      return;
    }

    setIsSavingPassword(true);
    setPasswordMessage(null);

    try {
      const response = await resetCurrentUserPassword(token, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordMessage({
        type: "success",
        text: response.message || "Password updated successfully.",
      });
    } catch (error) {
      setPasswordMessage({
        type: "error",
        text: getErrorMessage(error, "Unable to update your password."),
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteMessage({
        type: "error",
        text: "Enter your password to delete the account.",
      });
      return;
    }

    setIsDeletingAccount(true);
    setDeleteMessage(null);

    try {
      await deleteCurrentUserAccount(token, deletePassword);
      clearSession();
      navigate("/", { replace: true });
    } catch (error) {
      setDeleteMessage({
        type: "error",
        text: getErrorMessage(error, "Unable to delete your account."),
      });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const roleHomePath = getRoleHomePath(user.role);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_hsl(var(--primary)/0.14),_transparent_30%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.3))]">
      <header className="border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="container mx-auto flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-foreground">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
              <Heart className="h-5 w-5 fill-current text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold">
              NoPlate<span className="text-secondary">Empty</span>
            </span>
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary">{getRoleLabel(user.role)}</Badge>
            <Button variant="outline" asChild>
              <Link to={roleHomePath}>Back to Workspace</Link>
            </Button>
            <Button onClick={() => void handleSignOut()} disabled={isSigningOut}>
              <LogOut className="mr-2 h-4 w-4" />
              {isSigningOut ? "Signing out..." : "Sign Out"}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <section className="rounded-[2rem] border border-border/60 bg-background/92 p-8 shadow-xl">
          <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">
            Account Settings
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Manage your profile, password, and account access.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
            Keep your profile, password, and workspace access details up to date.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Badge variant="outline">{user.email}</Badge>
            <Badge variant={user.isApproved ? "secondary" : "outline"}>
              {user.isApproved ? "Approved" : "Pending Approval"}
            </Badge>
            <Badge variant={user.isBlocked ? "destructive" : "outline"}>
              {user.isBlocked ? "Blocked" : "Active"}
            </Badge>
          </div>
        </section>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <Card className="border-border/60 bg-background/92 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserRound className="h-5 w-5 text-primary" />
                Profile Settings
              </CardTitle>
              <CardDescription>
                Update the information shown across your workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {profileMessage && (
                <div
                  className={`rounded-2xl border px-4 py-3 text-sm ${
                    profileMessage.type === "success"
                      ? "border-green-200 bg-green-50 text-green-700"
                      : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  {profileMessage.text}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="settings-name">Name</Label>
                <Input
                  id="settings-name"
                  value={profileForm.name}
                  onChange={(event) =>
                    setProfileForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="settings-email">Email</Label>
                <Input
                  id="settings-email"
                  type="email"
                  value={profileForm.email}
                  onChange={(event) =>
                    setProfileForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                />
              </div>

              {user.role === "NGO" && (
                <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      NGO Matching Location
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Save your coordination address and GPS details so the platform
                      can filter donor outlets near your NGO.
                    </p>
                    <p className="text-sm text-primary">{getNgoMatchingSummary(user)}</p>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="settings-address">Address</Label>
                      <Input
                        id="settings-address"
                        value={profileForm.address}
                        onChange={(event) =>
                          setProfileForm((current) => ({
                            ...current,
                            address: event.target.value,
                          }))
                        }
                        placeholder="NGO office or pickup coordination address"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="settings-city">City</Label>
                      <Input
                        id="settings-city"
                        value={profileForm.city}
                        onChange={(event) =>
                          setProfileForm((current) => ({
                            ...current,
                            city: event.target.value,
                          }))
                        }
                        placeholder="Bankura"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="settings-state">State</Label>
                      <Input
                        id="settings-state"
                        value={profileForm.state}
                        onChange={(event) =>
                          setProfileForm((current) => ({
                            ...current,
                            state: event.target.value,
                          }))
                        }
                        placeholder="West Bengal"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="settings-pincode">Pincode</Label>
                      <Input
                        id="settings-pincode"
                        value={profileForm.pincode}
                        onChange={(event) =>
                          setProfileForm((current) => ({
                            ...current,
                            pincode: event.target.value,
                          }))
                        }
                        placeholder="722140"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="settings-radius">Search Radius (km)</Label>
                      <Input
                        id="settings-radius"
                        type="number"
                        min="1"
                        max="100"
                        value={profileForm.searchRadiusKm}
                        onChange={(event) =>
                          setProfileForm((current) => ({
                            ...current,
                            searchRadiusKm: event.target.value,
                          }))
                        }
                        placeholder="10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="settings-latitude">Latitude</Label>
                      <Input
                        id="settings-latitude"
                        type="number"
                        step="any"
                        value={profileForm.latitude}
                        onChange={(event) =>
                          setProfileForm((current) => ({
                            ...current,
                            latitude: event.target.value,
                          }))
                        }
                        placeholder="22.5726"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="settings-longitude">Longitude</Label>
                      <Input
                        id="settings-longitude"
                        type="number"
                        step="any"
                        value={profileForm.longitude}
                        onChange={(event) =>
                          setProfileForm((current) => ({
                            ...current,
                            longitude: event.target.value,
                          }))
                        }
                        placeholder="88.3639"
                      />
                    </div>
                  </div>
                </div>
              )}

              <Button onClick={() => void handleProfileUpdate()} disabled={isSavingProfile}>
                <Save className="mr-2 h-4 w-4" />
                {isSavingProfile ? "Saving..." : "Save Profile Changes"}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-background/92 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Account Summary
              </CardTitle>
              <CardDescription>
                Your current account identity, access status, and saved workspace
                details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Signed In As
                </p>
                <p className="mt-2 text-lg font-semibold text-foreground">{user.name}</p>
                <p className="text-muted-foreground">{user.email}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/60 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Role
                  </p>
                  <p className="mt-2 text-lg font-semibold text-foreground">
                    {getRoleLabel(user.role)}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Status
                  </p>
                  <p className="mt-2 font-semibold text-foreground">
                    {user.isBlocked ? "Blocked" : "Active"}
                  </p>
                </div>
              </div>

              {user.role === "NGO" && (
                <div className="rounded-2xl border border-border/60 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Matching Location
                  </p>
                  <p className="mt-2 font-semibold text-foreground">
                    {user.location?.address || "Location not saved yet"}
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    {[user.location?.city, user.location?.state, user.location?.pincode]
                      .filter(Boolean)
                      .join(", ") || "No city, state, or pincode saved yet"}
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    Radius: {user.searchRadiusKm ?? 10} km
                  </p>
                  {typeof user.location?.latitude === "number" &&
                    typeof user.location?.longitude === "number" && (
                      <p className="mt-1 text-muted-foreground">
                        {user.location.latitude}, {user.location.longitude}
                      </p>
                    )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-background/92 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary" />
                Change Password
              </CardTitle>
              <CardDescription>
                Choose a strong password and update it whenever needed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {passwordMessage && (
                <div
                  className={`rounded-2xl border px-4 py-3 text-sm ${
                    passwordMessage.type === "success"
                      ? "border-green-200 bg-green-50 text-green-700"
                      : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  {passwordMessage.text}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(event) =>
                    setPasswordForm((current) => ({
                      ...current,
                      currentPassword: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(event) =>
                    setPasswordForm((current) => ({
                      ...current,
                      newPassword: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) =>
                    setPasswordForm((current) => ({
                      ...current,
                      confirmPassword: event.target.value,
                    }))
                  }
                />
              </div>

              <Button
                onClick={() => void handlePasswordUpdate()}
                disabled={isSavingPassword}
              >
                {isSavingPassword ? "Updating..." : "Update Password"}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-destructive/25 bg-background/92 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                Delete Account
              </CardTitle>
              <CardDescription>
                This action is permanent and requires password confirmation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {deleteMessage && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {deleteMessage.text}
                </div>
              )}

              <p className="text-sm text-muted-foreground">
                Enter your current password to confirm permanent account deletion.
              </p>
              <div className="space-y-2">
                <Label htmlFor="delete-password">Password Confirmation</Label>
                <Input
                  id="delete-password"
                  type="password"
                  value={deletePassword}
                  onChange={(event) => setDeletePassword(event.target.value)}
                />
              </div>

              <Button
                variant="destructive"
                onClick={() => void handleDeleteAccount()}
                disabled={isDeletingAccount}
              >
                {isDeletingAccount ? "Deleting..." : "Delete My Account"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AccountSettingsPage;
