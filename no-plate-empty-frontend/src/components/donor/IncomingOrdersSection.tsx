import { useEffect, useState } from "react";
import { Clock3, ShieldCheck } from "lucide-react";
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
import { OrderItem, getDonorOrders, updateOrderStatus } from "@/lib/feature-api";

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

const getNgoIdentity = (ngo: OrderItem["NGO"]) => {
  if (!ngo) {
    return "Unknown NGO";
  }

  if (typeof ngo === "string") {
    return ngo;
  }

  return ngo.name || ngo.email || ngo._id || "Unknown NGO";
};

const getOutletName = (order: OrderItem) => {
  if (order.donorProfile && typeof order.donorProfile !== "string") {
    return order.donorProfile.title || "Unknown outlet";
  }

  const firstFood = order.foods[0];
  if (!firstFood?.Doner) {
    return "Unknown outlet";
  }

  if (typeof firstFood.Doner === "string") {
    return firstFood.Doner;
  }

  return firstFood.Doner.title || firstFood.Doner.location?.title || "Unknown outlet";
};

const IncomingOrdersSection = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  if (!token) {
    return null;
  }

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const response = await getDonorOrders(token);
      setOrders(response.orders || []);
    } catch (error) {
      setMessage({
        type: "error",
        text: getErrorMessage(error, "Unable to load donor orders."),
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, []);

  const refreshOrders = async () => {
    setIsRefreshing(true);
    setMessage(null);
    try {
      const response = await getDonorOrders(token);
      setOrders(response.orders || []);
      setMessage({ type: "success", text: "Incoming orders refreshed." });
    } catch (error) {
      setMessage({
        type: "error",
        text: getErrorMessage(error, "Unable to refresh donor orders."),
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const changeStatus = async (orderId: string, status: OrderItem["status"]) => {
    setPendingActionId(orderId);
    setMessage(null);

    try {
      const response = await updateOrderStatus(token, orderId, status);
      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order._id === orderId ? response.order : order,
        ),
      );
      setMessage({ type: "success", text: `Order marked as ${status}.` });
    } catch (error) {
      setMessage({
        type: "error",
        text: getErrorMessage(error, "Unable to update order status."),
      });
    } finally {
      setPendingActionId(null);
    }
  };

  return (
    <Card className="border-border/60 bg-background/92 shadow-lg">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Incoming Orders
          </CardTitle>
          <CardDescription>
            Review incoming requests, confirm availability, and keep outlet pickup
            details up to date before accepting an order.
          </CardDescription>
        </div>
        <Button variant="outline" onClick={() => void refreshOrders()} disabled={isRefreshing}>
          {isRefreshing ? "Refreshing..." : "Refresh Orders"}
        </Button>
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

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading donor orders...</p>
        ) : orders.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground">
            No incoming NGO orders yet.
          </p>
        ) : (
          orders.map((order) => (
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
                  </div>
                  <p className="text-sm text-muted-foreground">
                    NGO: {getNgoIdentity(order.NGO)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Outlet: {getOutletName(order)}
                  </p>
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    <Clock3 className="h-3.5 w-3.5" />
                    {formatDisplayDate(order.createdAt)}
                  </div>
                  <div className="space-y-2">
                    {order.foods.map((food) => (
                      <div
                        key={food._id}
                        className="rounded-xl border border-border/60 bg-background/80 px-3 py-2 text-sm"
                      >
                        <p className="font-medium text-foreground">{food.title}</p>
                        <p className="text-muted-foreground">{food.decription}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {order.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => void changeStatus(order._id, "accepted")}
                        disabled={pendingActionId === order._id}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void changeStatus(order._id, "rejected")}
                        disabled={pendingActionId === order._id}
                      >
                        Reject
                      </Button>
                    </>
                  )}

                  {order.status === "accepted" && (
                    <Button
                      size="sm"
                      onClick={() => void changeStatus(order._id, "completed")}
                      disabled={pendingActionId === order._id}
                    >
                      Complete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default IncomingOrdersSection;
