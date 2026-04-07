import { useState } from "react";
import { Building2, Mail, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { API } from "@/lib/api";
import {
  getApiErrorMessage,
  getErrorMessage,
  readApiResponse,
} from "@/lib/auth";

interface RecipientRegisterProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RecipientModal = ({
  isOpen,
  onOpenChange,
}: RecipientRegisterProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async () => {
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          role: "NGO",
        }),
      });
      const payload = await readApiResponse(response);

      if (!response.ok) {
        throw new Error(getApiErrorMessage(payload, "Registration failed."));
      }

      setSuccess(
        payload?.message ||
          "Registration successful! Please wait for admin approval before login.",
      );
      setName("");
      setEmail("");
      setPassword("");

      setTimeout(() => {
        onOpenChange(false);
      }, 2000);
    } catch (err) {
      setError(getErrorMessage(err, "Something went wrong"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl bg-white p-6 md:max-w-lg">
        <DialogHeader className="flex flex-col items-center text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-bold">
            Register as Recipient Organization
          </DialogTitle>
          <DialogDescription>
            Create your recipient organization account. Access will be available
            after admin approval.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="rounded bg-red-100 p-2 text-sm text-red-600">{error}</p>
        )}

        {success && (
          <p className="rounded bg-green-100 p-2 text-sm text-green-600">
            {success}
          </p>
        )}

        <form
          className="space-y-4 py-4"
          onSubmit={(e) => {
            e.preventDefault();
            void handleRegister();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="recipient-name">Organization / Contact Name</Label>
            <div className="relative">
              <UserRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="recipient-name"
                className="pl-10"
                placeholder="Community Kitchen"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipient-email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="recipient-email"
                type="email"
                className="pl-10"
                placeholder="ngo@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipient-password">Password</Label>
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="recipient-password"
                type="password"
                className="pl-10"
                placeholder="Create a secure password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="mt-4 w-full bg-primary py-6 text-lg font-semibold text-white hover:bg-primary/90"
          >
            {isSubmitting ? "Submitting..." : "Register as Recipient"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
