import { useEffect, useState } from "react";
import { Tags, Trash2 } from "lucide-react";
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
import {
  Category,
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "@/lib/feature-api";

const EMPTY_CATEGORY_FORM = {
  title: "",
  imageUrl: "",
};

const CategoryManagerSection = () => {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState(EMPTY_CATEGORY_FORM);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  if (!token) {
    return null;
  }

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const response = await getCategories();
      setCategories(response.categories || []);
    } catch (error) {
      setMessage({
        type: "error",
        text: getErrorMessage(error, "Unable to load categories."),
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadCategories();
  }, []);

  const submitCategory = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      if (editingCategoryId) {
        await updateCategory(token, editingCategoryId, form);
        setCategories((currentCategories) =>
          currentCategories.map((category) =>
            category._id === editingCategoryId
              ? { ...category, ...form }
              : category,
          ),
        );
        setMessage({ type: "success", text: "Category updated successfully." });
      } else {
        const response = await createCategory(token, form);
        setCategories((currentCategories) => [
          response.newCategory,
          ...currentCategories,
        ]);
        setMessage({ type: "success", text: "Category created successfully." });
      }

      setForm(EMPTY_CATEGORY_FORM);
      setEditingCategoryId(null);
    } catch (error) {
      setMessage({
        type: "error",
        text: getErrorMessage(error, "Unable to save category."),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const removeCategory = async (categoryId: string) => {
    setPendingDeleteId(categoryId);
    setMessage(null);

    try {
      await deleteCategory(token, categoryId);
      setCategories((currentCategories) =>
        currentCategories.filter((category) => category._id !== categoryId),
      );
      if (editingCategoryId === categoryId) {
        setEditingCategoryId(null);
        setForm(EMPTY_CATEGORY_FORM);
      }
      setMessage({ type: "success", text: "Category deleted successfully." });
    } catch (error) {
      setMessage({
        type: "error",
        text: getErrorMessage(error, "Unable to delete category."),
      });
    } finally {
      setPendingDeleteId(null);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <Card className="border-border/60 bg-background/92 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tags className="h-5 w-5 text-primary" />
            {editingCategoryId ? "Edit Category" : "Create Category"}
          </CardTitle>
          <CardDescription>
            Create and organize categories to keep your food catalog clear and easy
            to browse.
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

          <div className="space-y-2">
            <Label htmlFor="category-title">Title</Label>
            <Input
              id="category-title"
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
              placeholder="Vegetarian"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-image">Image URL</Label>
            <Input
              id="category-image"
              value={form.imageUrl}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  imageUrl: event.target.value,
                }))
              }
              placeholder="https://example.com/category.jpg"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={() => void submitCategory()} disabled={isSaving}>
              {isSaving
                ? "Saving..."
                : editingCategoryId
                  ? "Update Category"
                  : "Create Category"}
            </Button>
            {editingCategoryId && (
              <Button
                variant="outline"
                onClick={() => {
                  setEditingCategoryId(null);
                  setForm(EMPTY_CATEGORY_FORM);
                }}
              >
                Cancel Edit
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-background/92 shadow-lg">
        <CardHeader>
          <CardTitle>Available Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading categories...</p>
          ) : categories.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground">
              No categories yet. Create the first one here.
            </p>
          ) : (
            categories.map((category) => (
              <div
                key={category._id}
                className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">{category.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {category.imageUrl || "No image URL"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingCategoryId(category._id);
                      setForm({
                        title: category.title,
                        imageUrl: category.imageUrl || "",
                      });
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void removeCategory(category._id)}
                    disabled={pendingDeleteId === category._id}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CategoryManagerSection;
