import { ArrowRight, Building2, HeartHandshake, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface JourneyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChooseDonor: () => void;
  onChooseRecipient: () => void;
  onChooseAdmin: () => void;
  onGoToLogin: () => void;
}

const journeyOptions = [
  {
    title: "Donate Surplus Food",
    description:
      "For hostel messes, college cafeterias, canteens, and event teams ready to share extra food.",
    actionLabel: "Join as Donor",
    icon: HeartHandshake,
    actionKey: "donor" as const,
  },
  {
    title: "Receive Food for Your NGO",
    description:
      "For NGOs, NSS units, and campus welfare teams that collect available college food.",
    actionLabel: "Join as Recipient",
    icon: Building2,
    actionKey: "recipient" as const,
  },
  {
    title: "Manage Approvals as Admin",
    description:
      "For super admins who approve campus donors, recipients, and platform activity.",
    actionLabel: "Admin Sign In",
    icon: ShieldCheck,
    actionKey: "admin" as const,
  },
];

const JourneyDialog = ({
  open,
  onOpenChange,
  onChooseDonor,
  onChooseRecipient,
  onChooseAdmin,
  onGoToLogin,
}: JourneyDialogProps) => {
  const handleSelect = (actionKey: (typeof journeyOptions)[number]["actionKey"]) => {
    if (actionKey === "donor") {
      onChooseDonor();
      return;
    }

    if (actionKey === "recipient") {
      onChooseRecipient();
      return;
    }

    onChooseAdmin();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl rounded-3xl border-none bg-white p-0 shadow-2xl">
        <div className="bg-gradient-to-br from-primary via-primary/95 to-secondary p-8 text-primary-foreground">
          <DialogHeader className="space-y-3 text-left">
            <DialogTitle className="text-3xl font-display font-bold">
              Start Your Campus Journey with NoPlateEmpty
            </DialogTitle>
            <DialogDescription className="max-w-2xl text-base text-primary-foreground/80">
              Choose how you want to use the platform and we will take you to
              the right next step.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-6 p-6 md:p-8">
          <div className="grid gap-4 md:grid-cols-3">
            {journeyOptions.map((option) => (
              <div
                key={option.actionKey}
                className="rounded-3xl border border-border bg-background p-5 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <option.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  {option.title}
                </h3>
                <p className="mb-5 min-h-20 text-sm leading-6 text-muted-foreground">
                  {option.description}
                </p>
                <Button
                  className="w-full"
                  variant={option.actionKey === "admin" ? "outline" : "default"}
                  onClick={() => handleSelect(option.actionKey)}
                >
                  {option.actionLabel}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center justify-between gap-3 rounded-2xl bg-muted/50 px-4 py-4 text-center md:flex-row md:text-left">
            <div>
              <p className="font-medium text-foreground">Already registered?</p>
              <p className="text-sm text-muted-foreground">
                Approved donor and NGO users can sign in directly.
              </p>
            </div>
            <Button variant="outline" onClick={onGoToLogin}>
              Go to Sign In
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JourneyDialog;
