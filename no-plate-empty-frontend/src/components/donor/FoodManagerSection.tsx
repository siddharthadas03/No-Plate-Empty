import { useEffect, useMemo, useState } from "react";
import { PencilLine, Plus, Trash2 } from "lucide-react";
import { API } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type DonorOutlet = {
  _id: string;
  title: string;
  isOpen?: boolean;
};

type Category = {
  _id: string;
  title: string;
};

type FoodRecord = {
  _id: string;
  title: string;
  decription?: string;
  imageUrl?: string;
  foodTags?: string;
  catagory?: string;
  code?: string;
  quantity?: number;
  unit?: string;
  isAvailable?: boolean;
  expireTime?: string;
  Doner?: DonorOutlet | string | null;
  updatedAt?: string;
};

type FoodFormState = {
  title: string;
  description: string;
  category: string;
  code: string;
  quantity: string;
  unit: string;
  foodTags: string;
  imageUrl: string;
  expireTime: string;
  outletId: string;
  isAvailable: boolean;
};

const createEmptyForm = (): FoodFormState => ({
  title: "",
  description: "",
  category: "",
  code: "",
  quantity: "",
  unit: "plates",
  foodTags: "",
  imageUrl: "",
  expireTime: "",
  outletId: "",
  isAvailable: true,
});

const getAuthHeaders = (token: string | null, hasBody = false) => {
  const headers: Record<string, string> = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (hasBody) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
};

const formatQuantity = (quantity?: number, unit?: string) => {
  if (typeof quantity !== "number") {
    return "Quantity not set";
  }

  return `${quantity} ${unit?.trim() || "items"}`;
};

const toDateTimeLocalValue = (value?: string) => {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const local = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const getOutletId = (food: FoodRecord) =>
  typeof food.Doner === "string" ? food.Doner : food.Doner?._id || "";

const getOutletLabel = (food: FoodRecord) =>
  typeof food.Doner === "string" ? "Linked outlet" : food.Doner?.title || "Outlet";

const FoodManagerSection = () => {
  const { token } = useAuth();
  const [foods, setFoods] = useState<FoodRecord[]>([]);
  const [outlets, setOutlets] = useState<DonorOutlet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<FoodFormState>(createEmptyForm);
  const [editingFoodId, setEditingFoodId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const categoryOptions = useMemo(
    () => categories.map((category) => category.title),
    [categories]
  );

  const loadData = async () => {
    if (!token) {
      setError("Sign in again to manage foods.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const [foodsResponse, outletsResponse, categoriesResponse] = await Promise.all([
        fetch(`${API}/api/v1/food/my-foods`, {
          headers: getAuthHeaders(token),
        }),
        fetch(`${API}/api/v1/Doner/my-records`, {
          headers: getAuthHeaders(token),
        }),
        fetch(`${API}/api/v1/category/getAll`, {
          headers: getAuthHeaders(token),
        }),
      ]);

      const [foodsPayload, outletsPayload, categoriesPayload] = await Promise.all([
        foodsResponse.json().catch(() => ({})),
        outletsResponse.json().catch(() => ({})),
        categoriesResponse.json().catch(() => ({})),
      ]);

      if (!foodsResponse.ok) {
        throw new Error(foodsPayload?.message || "Unable to load foods.");
      }

      if (!outletsResponse.ok) {
        throw new Error(outletsPayload?.message || "Unable to load donor outlets.");
      }

      setFoods(Array.isArray(foodsPayload?.foods) ? foodsPayload.foods : []);
      setOutlets(Array.isArray(outletsPayload?.Doners) ? outletsPayload.Doners : []);
      setCategories(
        Array.isArray(categoriesPayload?.categories) ? categoriesPayload.categories : []
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load food manager data."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [token]);

  useEffect(() => {
    if (!form.outletId && outlets.length > 0) {
      setForm((currentForm) => ({
        ...currentForm,
        outletId: currentForm.outletId || outlets[0]._id,
      }));
    }
  }, [outlets, form.outletId]);

  const resetForm = () => {
    setEditingFoodId(null);
    setForm({
      ...createEmptyForm(),
      outletId: outlets[0]?._id || "",
    });
  };

  const handleChange = <K extends keyof FoodFormState>(
    field: K,
    value: FoodFormState[K]
  ) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      setError("Sign in again to manage foods.");
      return;
    }

    const parsedQuantity = Number(form.quantity);
    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      setError("Enter a valid quantity greater than zero.");
      return;
    }

    if (!form.outletId) {
      setError("Create a donor outlet before adding foods.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        code: form.code.trim(),
        quantity: parsedQuantity,
        unit: form.unit.trim() || "items",
        foodTags: form.foodTags.trim(),
        imageUrl: form.imageUrl.trim(),
        expireTime: form.expireTime || undefined,
        outletId: form.outletId,
        isAvailable: form.isAvailable,
      };

      const response = await fetch(
        editingFoodId
          ? `${API}/api/v1/food/update/${editingFoodId}`
          : `${API}/api/v1/food/create`,
        {
          method: editingFoodId ? "PUT" : "POST",
          headers: getAuthHeaders(token, true),
          body: JSON.stringify(payload),
        }
      );
      const responsePayload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          responsePayload?.message ||
            (editingFoodId ? "Unable to update food." : "Unable to create food.")
        );
      }

      setSuccess(
        responsePayload?.message ||
          (editingFoodId ? "Food updated successfully." : "Food created successfully.")
      );
      resetForm();
      await loadData();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save food right now."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (food: FoodRecord) => {
    setEditingFoodId(food._id);
    setError("");
    setSuccess("");
    setForm({
      title: food.title || "",
      description: food.decription || "",
      category: food.catagory || "",
      code: food.code || "",
      quantity:
        typeof food.quantity === "number" && !Number.isNaN(food.quantity)
          ? String(food.quantity)
          : "",
      unit: food.unit || "items",
      foodTags: food.foodTags || "",
      imageUrl: food.imageUrl || "",
      expireTime: toDateTimeLocalValue(food.expireTime),
      outletId: getOutletId(food),
      isAvailable: food.isAvailable !== false,
    });
  };

  const handleDelete = async (foodId: string) => {
    if (!token) {
      setError("Sign in again to manage foods.");
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API}/api/v1/food/delete/${foodId}`, {
        method: "PUT",
        headers: getAuthHeaders(token),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.message || "Unable to delete food.");
      }

      setSuccess(payload?.message || "Food deleted successfully.");
      if (editingFoodId === foodId) {
        resetForm();
      }
      await loadData();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete food right now."
      );
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-border/60 bg-background/95 p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">
              Food Inventory
            </h2>
            <p className="text-sm text-muted-foreground">
              Add available quantity and units so NGOs know exactly what each
              listing offers.
            </p>
          </div>
          <Badge variant="secondary">{foods.length} listing(s)</Badge>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        ) : null}

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">Food title</span>
              <Input
                value={form.title}
                onChange={(event) => handleChange("title", event.target.value)}
                placeholder="Vegetable biryani"
                required
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">Category</span>
              <Input
                value={form.category}
                onChange={(event) => handleChange("category", event.target.value)}
                placeholder="Cooked meals"
                list="food-category-options"
                required
              />
              <datalist id="food-category-options">
                {categoryOptions.map((categoryOption) => (
                  <option key={categoryOption} value={categoryOption} />
                ))}
              </datalist>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">Food code</span>
              <Input
                value={form.code}
                onChange={(event) => handleChange("code", event.target.value)}
                placeholder="FD-101"
                required
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">Outlet</span>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.outletId}
                onChange={(event) => handleChange("outletId", event.target.value)}
                required
              >
                <option value="">Select outlet</option>
                {outlets.map((outlet) => (
                  <option key={outlet._id} value={outlet._id}>
                    {outlet.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">Quantity</span>
              <Input
                type="number"
                min="0.1"
                step="0.1"
                value={form.quantity}
                onChange={(event) => handleChange("quantity", event.target.value)}
                placeholder="25"
                required
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">Unit</span>
              <Input
                value={form.unit}
                onChange={(event) => handleChange("unit", event.target.value)}
                placeholder="plates / kg / packets"
                required
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">Tags</span>
              <Input
                value={form.foodTags}
                onChange={(event) => handleChange("foodTags", event.target.value)}
                placeholder="veg, fresh, dinner"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">
                Expiry / pickup cut-off
              </span>
              <Input
                type="datetime-local"
                value={form.expireTime}
                onChange={(event) => handleChange("expireTime", event.target.value)}
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-foreground">Image URL</span>
              <Input
                value={form.imageUrl}
                onChange={(event) => handleChange("imageUrl", event.target.value)}
                placeholder="https://..."
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">Availability</span>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.isAvailable ? "available" : "unavailable"}
                onChange={(event) =>
                  handleChange("isAvailable", event.target.value === "available")
                }
              >
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-foreground">Description</span>
            <textarea
              className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.description}
              onChange={(event) => handleChange("description", event.target.value)}
              placeholder="Describe the food, packaging, dietary notes, and pickup readiness."
              required
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={isSubmitting || outlets.length === 0}>
              {editingFoodId ? (
                <>
                  <PencilLine className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Updating..." : "Update Food"}
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Creating..." : "Add Food"}
                </>
              )}
            </Button>

            {editingFoodId ? (
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel Edit
              </Button>
            ) : null}

            {outlets.length === 0 ? (
              <p className="self-center text-sm text-muted-foreground">
                Create a donor outlet first, then come back here to publish foods.
              </p>
            ) : null}
          </div>
        </form>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {isLoading ? (
          <div className="rounded-3xl border border-dashed border-border/70 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground xl:col-span-2">
            Loading your food listings...
          </div>
        ) : foods.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border/70 bg-muted/30 px-4 py-8 text-center xl:col-span-2">
            <p className="font-medium text-foreground">No foods published yet</p>
            <p className="text-sm text-muted-foreground">
              Add your first listing with quantity and unit details so NGOs can
              request the right amount.
            </p>
          </div>
        ) : (
          foods.map((food) => (
            <article
              key={food._id}
              className="rounded-3xl border border-border/60 bg-background/95 p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      {food.title}
                    </h3>
                    <Badge variant={food.isAvailable === false ? "outline" : "secondary"}>
                      {food.isAvailable === false ? "Unavailable" : "Available"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {food.decription || "No description added yet."}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => handleEdit(food)}>
                    <PencilLine className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void handleDelete(food._id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="secondary">{formatQuantity(food.quantity, food.unit)}</Badge>
                {food.catagory ? <Badge variant="outline">{food.catagory}</Badge> : null}
                {food.foodTags ? <Badge variant="outline">{food.foodTags}</Badge> : null}
                <Badge variant="outline">{getOutletLabel(food)}</Badge>
              </div>

              <div className="mt-4 grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
                <p>
                  <span className="font-medium text-foreground">Code:</span>{" "}
                  {food.code || "Not set"}
                </p>
                <p>
                  <span className="font-medium text-foreground">Expiry:</span>{" "}
                  {food.expireTime
                    ? new Date(food.expireTime).toLocaleString()
                    : "Not set"}
                </p>
                <p>
                  <span className="font-medium text-foreground">Outlet:</span>{" "}
                  {getOutletLabel(food)}
                </p>
                <p>
                  <span className="font-medium text-foreground">Last updated:</span>{" "}
                  {food.updatedAt ? new Date(food.updatedAt).toLocaleString() : "Recently"}
                </p>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
};

export default FoodManagerSection;
