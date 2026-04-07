import { useEffect, useState } from "react";
import { ClipboardList, Clock3, MapPin, RefreshCw, Truck } from "lucide-react";
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
import { getErrorMessage } from "@/lib/auth";
import { DonorLocation, FoodItem, OrderItem, getNgoOrders } from "@/lib/feature-api";

interface OrderHistorySectionProps {
  refreshSignal?: number;
}

const formatDisplayDate = (value?: string) => {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
};

const getOutletIdentity = (order: OrderItem) => {
  if (order.donorProfile && typeof order.donorProfile !== "string") {
    return order.donorProfile.title || "Unknown outlet";
  }

  const food = order.foods[0];
  if (!food?.Doner) {
    return "Unknown outlet";
  }

  if (typeof food.Doner === "string") {
    return food.Doner;
  }

  return food.Doner.title || food.Doner.location?.title || food.Doner._id || "Unknown outlet";
};

const getLocationTitle = (order: OrderItem) => {
  if (order.donorProfile && typeof order.donorProfile !== "string") {
    return order.donorProfile.title || order.donorLocation?.title || "Pickup Location";
  }

  return order.donorLocation?.title || "Pickup Location";
};

const getMapsUrl = (location?: DonorLocation) => {
  if (!location) {
    return null;
  }

  if (
    typeof location.latitude === "number" &&
    typeof location.longitude === "number"
  ) {
    return `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
  }

  if (location.address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`;
  }

  return null;
};

const OrderHistorySection = ({
  refreshSignal = 0,
}: OrderHistorySectionProps) => {
  const { token } = useAuth();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loadOrders = async (showRefreshState = false) => {
    if (!token) {
      return;
    }

    if (showRefreshState) {
      setIsRefreshing(true);
      setMessage(null);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await getNgoOrders(token);
      setOrders(Array.isArray(response.orders) ? response.orders : []);

      if (showRefreshState) {
        setMessage({ type: "success", text: "Order history refreshed." });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: getErrorMessage(error, "Unable to load your orders."),
      });
    } finally {
      if (showRefreshState) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!token) {
      return;
    }

    void loadOrders();
  }, [refreshSignal, token]);

  if (!token) {
    return null;
  }

  return (
    <Card className="border-border/60 bg-background/92 shadow-lg">
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              My Orders
            </CardTitle>
            <CardDescription>
              Monitor request status, pickup details, and recent updates for every
              order.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            onClick={() => void loadOrders(true)}
            disabled={isRefreshing}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {isRefreshing ? "Refreshing..." : "Refresh Orders"}
          </Button>
        </div>

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
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading your orders...</p>
        ) : orders.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground">
            You have not placed any orders yet.
          </p>
        ) : (
          orders.map((order) => {
            const showPickupLocation =
              order.status === "accepted" || order.status === "completed";
            const mapsUrl = getMapsUrl(order.donorLocation);

            return (
              <div
                key={order._id}
                className="rounded-2xl border border-border/60 bg-muted/20 p-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-foreground">
                        Order #{order._id.slice(-6)}
                      </p>
                      <Badge variant="secondary">{order.status}</Badge>
                      <Badge variant="outline">{order.foods.length} food items</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Outlet: {getOutletIdentity(order)}
                    </p>
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      <Clock3 className="h-3.5 w-3.5" />
                      {formatDisplayDate(order.createdAt)}
                    </div>
                  </div>
                </div>

                {showPickupLocation && (
                  <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-primary" />
                          <p className="font-medium text-foreground">
                            Outlet Pickup Location
                          </p>
                        </div>
                        {order.donorLocation ? (
                          <>
                            <p className="text-sm text-foreground">
                              {getLocationTitle(order)}
                            </p>
                            <p className="flex items-start gap-2 text-sm text-muted-foreground">
                              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                              <span>
                                {order.donorLocation.address || "Address not shared"}
                              </span>
                            </p>
                            {typeof order.donorLocation.latitude === "number" &&
                              typeof order.donorLocation.longitude === "number" && (
                                <p className="text-xs text-muted-foreground">
                                  Coordinates: {order.donorLocation.latitude},{" "}
                                  {order.donorLocation.longitude}
                                </p>
                              )}
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            The donor accepted this order, but the outlet pickup
                            location is not saved yet. Ask the donor to open
                            Donor Details, update that outlet address or
                            coordinates, and then refresh this order.
                          </p>
                        )}
                      </div>

                      {mapsUrl && (
                        <Button variant="outline" asChild>
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open in Maps
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {order.foods.map((food) => (
                    <div
                      key={food._id}
                      className="rounded-xl border border-border/60 bg-background/80 p-3"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-foreground">{food.title}</p>
                        {food.catagory && (
                          <Badge variant="outline">{food.catagory}</Badge>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {food.decription}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {food.code && <span>Code: {food.code}</span>}
                        {food.expireTime && (
                          <span>Expires: {formatDisplayDate(food.expireTime)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};

export default OrderHistorySection;
