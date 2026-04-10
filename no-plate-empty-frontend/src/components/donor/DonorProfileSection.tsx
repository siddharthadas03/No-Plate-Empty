import { useEffect, useState } from "react";
import { LayoutList, MapPin, PencilLine, Store, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/lib/auth";
import {
  DonorEntry,
  createDonorEntry,
  deleteDonorEntry,
  getMyDonorEntries,
  updateDonorEntry,
} from "@/lib/feature-api";

const EMPTY_OUTLET_FORM = {
  title: "",
  imageUrl: "",
  food: "",
  time: "",
  pickup: true,
  delivery: true,
  isOpen: true,
  locationId: "",
  latitude: "",
  latitudeDelta: "0.01",
  longitude: "",
  longitudeDelta: "0.01",
  address: "",
  city: "",
  state: "",
  pincode: "",
  locationTitle: "",
};

const mapEntryToForm = (entry: DonorEntry) => ({
  title: entry.title || "",
  imageUrl: entry.imageUrl || "",
  food: Array.isArray(entry.food) ? entry.food.join(", ") : "",
  time: entry.time || "",
  pickup: entry.pickup ?? true,
  delivery: entry.delivery ?? true,
  isOpen: entry.isOpen ?? true,
  locationId: entry.location?.id || "",
  latitude:
    typeof entry.location?.latitude === "number"
      ? String(entry.location.latitude)
      : "",
  latitudeDelta:
    typeof entry.location?.latitudeDelta === "number"
      ? String(entry.location.latitudeDelta)
      : "0.01",
  longitude:
    typeof entry.location?.longitude === "number"
      ? String(entry.location.longitude)
      : "",
  longitudeDelta:
    typeof entry.location?.longitudeDelta === "number"
      ? String(entry.location.longitudeDelta)
      : "0.01",
  address: entry.location?.address || "",
  city: entry.location?.city || "",
  state: entry.location?.state || "",
  pincode: entry.location?.pincode || "",
  locationTitle: entry.location?.title || "",
});

const hasPickupLocation = (entry?: DonorEntry | null) => {
  if (!entry?.location) {
    return false;
  }

  const hasCoordinates =
    typeof entry.location.latitude === "number" &&
    typeof entry.location.longitude === "number";
  const hasAddress =
    typeof entry.location.address === "string" &&
    entry.location.address.trim().length > 0;

  return hasCoordinates || hasAddress;
};

const hasAreaLocation = (entry?: DonorEntry | null) =>
  Boolean(
    entry?.location?.pincode ||
      (entry?.location?.city && entry?.location?.state) ||
      entry?.location?.city
  );

const DonorProfileSection = () => {
  const { token } = useAuth();
  const [entries, setEntries] = useState<DonorEntry[]>([]);
  const [form, setForm] = useState(EMPTY_OUTLET_FORM);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loadEntries = async () => {
    if (!token) {
      setEntries([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await getMyDonorEntries(token);
      setEntries(Array.isArray(response.Doners) ? response.Doners : []);
    } catch (error) {
      const text = getErrorMessage(error, "Unable to load your donor outlets.");
      setMessage({ type: "error", text });
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      return;
    }

    void loadEntries();
  }, [token]);

  const resetForm = () => {
    setEditingEntryId(null);
    setForm(EMPTY_OUTLET_FORM);
  };

  const submitOutlet = async () => {
    if (!token) {
      return;
    }

    setIsSaving(true);
    setMessage(null);

    const latitudeFilled = form.latitude.trim().length > 0;
    const longitudeFilled = form.longitude.trim().length > 0;
    const latitude = latitudeFilled ? Number(form.latitude) : undefined;
    const longitude = longitudeFilled ? Number(form.longitude) : undefined;

    if (latitudeFilled !== longitudeFilled) {
      setMessage({
        type: "error",
        text: "Enter both latitude and longitude together for GPS-based nearby matching.",
      });
      setIsSaving(false);
      return;
    }

    if (
      (latitudeFilled && Number.isNaN(latitude)) ||
      (longitudeFilled && Number.isNaN(longitude))
    ) {
      setMessage({
        type: "error",
        text: "Latitude and longitude must be valid numbers.",
      });
      setIsSaving(false);
      return;
    }

    const payload = {
      title: form.title.trim(),
      imageUrl: form.imageUrl.trim() || undefined,
      food: form.food
        ? form.food
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [],
      time: form.time.trim() || undefined,
      pickup: form.pickup,
      delivery: form.delivery,
      isOpen: form.isOpen,
      location: {
        id: form.locationId.trim() || undefined,
        latitude,
        latitudeDelta: form.latitudeDelta
          ? Number(form.latitudeDelta)
          : undefined,
        longitude,
        longitudeDelta: form.longitudeDelta
          ? Number(form.longitudeDelta)
          : undefined,
        address: form.address.trim() || undefined,
        city: form.city.trim() || undefined,
        state: form.state.trim() || undefined,
        pincode: form.pincode.trim() || undefined,
        title: form.locationTitle.trim() || undefined,
      },
    };

    try {
      if (editingEntryId) {
        await updateDonorEntry(token, editingEntryId, payload);
      } else {
        await createDonorEntry(token, payload);
      }
      await loadEntries();
      setMessage({
        type: "success",
        text: editingEntryId
          ? "Donor outlet updated successfully."
          : "Donor outlet created successfully.",
      });
      resetForm();
    } catch (error) {
      setMessage({
        type: "error",
        text: getErrorMessage(error, "Unable to save donor outlet."),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (entry: DonorEntry) => {
    setEditingEntryId(entry._id);
    setForm(mapEntryToForm(entry));
    setMessage(null);
  };

  const removeEntry = async (entryId: string) => {
    if (!token) {
      return;
    }

    setPendingDeleteId(entryId);
    setMessage(null);

    try {
      await deleteDonorEntry(token, entryId);
      setEntries((currentEntries) =>
        currentEntries.filter((entry) => entry._id !== entryId),
      );

      if (editingEntryId === entryId) {
        resetForm();
      }

      setMessage({ type: "success", text: "Donor outlet deleted successfully." });
    } catch (error) {
      setMessage({
        type: "error",
        text: getErrorMessage(error, "Unable to delete donor outlet."),
      });
    } finally {
      setPendingDeleteId(null);
    }
  };

  if (!token) {
    return null;
  }

  const pickupReadyCount = entries.filter((entry) => hasPickupLocation(entry)).length;

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <Card className="border-border/60 bg-background/92 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            {editingEntryId ? "Edit Donor Outlet" : "Create Donor Outlet"}
          </CardTitle>
          <CardDescription>
            One donor account can manage multiple outlets. Each food item will
            belong to one selected outlet, and NGOs will use that outlet’s pickup
            location for nearby matching and order pickup after acceptance.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {message && (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm ${
                message.type === "success"
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3">
            <p className="text-sm font-medium text-foreground">Outlet Readiness</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {pickupReadyCount} of {entries.length} outlet
              {entries.length === 1 ? "" : "s"} currently have a pickup-ready
              location saved.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add latitude and longitude for GPS matching, or at least save
              city/state or pincode for area fallback matching.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="outlet-title">Outlet Title</Label>
            <Input
              id="outlet-title"
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
              placeholder="Downtown Doner"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="outlet-image">Image URL</Label>
            <Input
              id="outlet-image"
              value={form.imageUrl}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  imageUrl: event.target.value,
                }))
              }
              placeholder="https://example.com/outlet.jpg"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="outlet-time">Operating Time</Label>
              <Input
                id="outlet-time"
                value={form.time}
                onChange={(event) =>
                  setForm((current) => ({ ...current, time: event.target.value }))
                }
                placeholder="09:00-21:00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="outlet-food">Food Labels</Label>
              <Input
                id="outlet-food"
                value={form.food}
                onChange={(event) =>
                  setForm((current) => ({ ...current, food: event.target.value }))
                }
                placeholder="veg biryani, rice, bread"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-3 text-sm">
              <span>Pickup</span>
              <Switch
                checked={form.pickup}
                onCheckedChange={(checked) =>
                  setForm((current) => ({ ...current, pickup: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-3 text-sm">
              <span>Delivery</span>
              <Switch
                checked={form.delivery}
                onCheckedChange={(checked) =>
                  setForm((current) => ({ ...current, delivery: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-3 text-sm">
              <span>Open</span>
              <Switch
                checked={form.isOpen}
                onCheckedChange={(checked) =>
                  setForm((current) => ({ ...current, isOpen: checked }))
                }
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 p-4">
            <div className="mb-4 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <p className="font-medium text-foreground">Pickup Location</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                value={form.locationId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    locationId: event.target.value,
                  }))
                }
                placeholder="Location Id"
              />
              <Input
                value={form.locationTitle}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    locationTitle: event.target.value,
                  }))
                }
                placeholder="Location Title"
              />
              <Input
                value={form.latitude}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    latitude: event.target.value,
                  }))
                }
                placeholder="Latitude"
              />
              <Input
                value={form.longitude}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    longitude: event.target.value,
                  }))
                }
                placeholder="Longitude"
              />
              <Input
                value={form.latitudeDelta}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    latitudeDelta: event.target.value,
                  }))
                }
                placeholder="Latitude Delta"
              />
              <Input
                value={form.longitudeDelta}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    longitudeDelta: event.target.value,
                  }))
                }
                placeholder="Longitude Delta"
              />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Input
                value={form.city}
                onChange={(event) =>
                  setForm((current) => ({ ...current, city: event.target.value }))
                }
                placeholder="City"
              />
              <Input
                value={form.state}
                onChange={(event) =>
                  setForm((current) => ({ ...current, state: event.target.value }))
                }
                placeholder="State"
              />
              <Input
                value={form.pincode}
                onChange={(event) =>
                  setForm((current) => ({ ...current, pincode: event.target.value }))
                }
                placeholder="Pincode"
              />
            </div>

            <Textarea
              className="mt-4"
              value={form.address}
              onChange={(event) =>
                setForm((current) => ({ ...current, address: event.target.value }))
              }
              placeholder="Address"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={() => void submitOutlet()} disabled={isSaving}>
              {isSaving
                ? "Saving..."
                : editingEntryId
                  ? "Update Outlet"
                  : "Create Outlet"}
            </Button>
            {editingEntryId && (
              <Button variant="outline" onClick={resetForm}>
                Cancel Edit
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-background/92 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutList className="h-5 w-5 text-primary" />
            My Donor Outlets
          </CardTitle>
          <CardDescription>
            These are the outlets owned by your donor account.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading your outlets...</p>
          ) : entries.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground">
              No outlets created yet. Create your first donor outlet here.
            </p>
          ) : (
            entries.map((entry) => (
              <div
                key={entry._id}
                className="rounded-2xl border border-border/60 bg-muted/20 p-4"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-foreground">{entry.title}</p>
                      <Badge variant="secondary">Outlet</Badge>
                      <Badge variant={entry.isOpen ? "secondary" : "outline"}>
                        {entry.isOpen ? "Open" : "Closed"}
                      </Badge>
                      {hasPickupLocation(entry) && (
                        <Badge variant="outline">Pickup Ready</Badge>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {[
                        entry.location?.address,
                        entry.location?.city,
                        entry.location?.state,
                        entry.location?.pincode,
                      ]
                        .filter(Boolean)
                        .join(", ") || "No address saved"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {entry.time || "No time provided"}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {entry.pickup && <Badge variant="outline">Pickup</Badge>}
                      {entry.delivery && <Badge variant="outline">Delivery</Badge>}
                      {hasAreaLocation(entry) && (
                        <Badge variant="outline">Area Ready</Badge>
                      )}
                      {(entry.food || []).slice(0, 3).map((foodItem) => (
                        <Badge key={foodItem} variant="outline">
                          {foodItem}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/donors/${entry._id}`}>View Details</Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEdit(entry)}
                    >
                      <PencilLine className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void removeEntry(entry._id)}
                      disabled={pendingDeleteId === entry._id}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DonorProfileSection;
