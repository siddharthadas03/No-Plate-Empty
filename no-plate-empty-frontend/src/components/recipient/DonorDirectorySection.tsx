import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Store } from "lucide-react";
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
import { getErrorMessage } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";
import {
  DonorEntry,
  MatchingMeta,
  getNearbyDonorEntries,
} from "@/lib/feature-api";

const DonorDirectorySection = () => {
  const { token } = useAuth();
  const [entries, setEntries] = useState<DonorEntry[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [matching, setMatching] = useState<MatchingMeta | null>(null);
  const [message, setMessage] = useState<{
    type: "error" | "info";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!token) {
      setEntries([]);
      setIsLoading(false);
      return;
    }

    const loadEntries = async () => {
      setIsLoading(true);
      try {
        const response = await getNearbyDonorEntries(token);
        setEntries(response.Doners || []);
        setMatching(response.matching || null);
        setMessage(
          response.matching?.status === "ready"
            ? {
                type: "info",
                text: response.matching.summary,
              }
            : response.matching
              ? {
                  type: "info",
                  text: response.matching.summary,
                }
              : null,
        );
      } catch (error) {
        const text = getErrorMessage(error, "Unable to load donor directory.");
        setEntries([]);
        setMatching(null);
        setMessage({ type: "error", text });
      } finally {
        setIsLoading(false);
      }
    };

    void loadEntries();
  }, [token]);

  if (!token) {
    return null;
  }

  const normalizedSearch = search.trim().toLowerCase();
  const visibleEntries = entries.filter((entry) =>
    [
      entry.title,
      entry.time,
      entry.location?.address,
      entry.location?.title,
      entry.location?.city,
      entry.location?.state,
      entry.location?.pincode,
    ]
      .filter(Boolean)
      .some((value) => value?.toLowerCase().includes(normalizedSearch)),
  );

  return (
    <Card className="border-border/60 bg-background/92 shadow-lg">
      <CardHeader className="space-y-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            Donor Outlet Directory
          </CardTitle>
          <CardDescription>
            Review outlet addresses, operating hours, and pickup or delivery
            availability before placing a request.
          </CardDescription>
        </div>

        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search outlet title, address, city, state, or pincode"
        />

        {message && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              message.type === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-blue-200 bg-blue-50 text-blue-700"
            }`}
          >
            {message.text}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading donor directory...</p>
        ) : visibleEntries.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground">
            No donor records match the current search.
          </p>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {visibleEntries.map((entry) => (
              <div
                key={entry._id}
                className="rounded-2xl border border-border/60 bg-muted/20 p-4"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-semibold text-foreground">
                      {entry.title}
                    </p>
                    <Badge variant={entry.isOpen ? "secondary" : "outline"}>
                      {entry.isOpen ? "Open" : "Closed"}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>{entry.time || "No operating time shared"}</p>
                    <p className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>
                        {[
                          entry.location?.address,
                          entry.location?.city,
                          entry.location?.state,
                          entry.location?.pincode,
                        ]
                          .filter(Boolean)
                          .join(", ") || "No address shared"}
                      </span>
                    </p>
                    {typeof entry.distanceKm === "number" && (
                      <p>{entry.distanceKm} km away</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {entry.pickup && <Badge variant="outline">Pickup</Badge>}
                    {entry.delivery && <Badge variant="outline">Delivery</Badge>}
                    {matching?.mode && matching.mode !== "none" && (
                      <Badge variant="outline">
                        Match: {entry.matchMode || matching.mode}
                      </Badge>
                    )}
                    {(entry.food || []).slice(0, 3).map((foodItem) => (
                      <Badge key={foodItem} variant="outline">
                        {foodItem}
                      </Badge>
                    ))}
                  </div>
                  <Button variant="outline" asChild>
                    <Link to={`/donors/${entry._id}`}>View Outlet Details</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DonorDirectorySection;
