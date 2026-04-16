import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  Heart,
  HeartHandshake,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Utensils,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { getRoleHomeLabel, getRoleHomePath, getRoleLabel } from "@/lib/auth";

interface HeaderProps {
  onOpenDonor: () => void;
  onOpenRecipient: () => void;
}

const Header = ({ onOpenDonor, onOpenRecipient }: HeaderProps) => {
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const navLinks = [
    { label: "How It Works", href: "#how-it-works" },
    { label: "For Donors", href: "#donors" },
    { label: "For Recipients", href: "#recipients" },
    { label: "Impact", href: "#impact" },
  ];

  const roleHomePath = user ? getRoleHomePath(user.role) : "/login";
  const roleHomeLabel = user ? getRoleHomeLabel(user.role) : "Home";

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await logout();
    closeMenu();
    navigate("/login", { replace: true });
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto h-16 px-4 md:h-20">
        <div className="flex h-full items-center justify-between">
          <Link to="/" className="group flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary shadow-soft transition-all duration-300 group-hover:shadow-card">
              <Heart className="h-5 w-5 fill-current text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">
              NoPlate<span className="text-secondary">Empty</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-4 md:flex">
            {isAuthenticated && user ? (
              <>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {getRoleLabel(user.role)}
                  </p>
                </div>
                <Button variant="outline" asChild>
                  <Link to={roleHomePath}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    {roleHomeLabel}
                  </Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link to="/account/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </Button>
                <Button onClick={() => void handleSignOut()} disabled={isSigningOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {isSigningOut ? "Signing out..." : "Sign Out"}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" asChild>
                  <Link to="/admin/login">
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Admin Sign In
                  </Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link to="/login">Sign In</Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="default" className="gap-2 shadow-lg">
                      Sign Up <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 p-2">
                    <DropdownMenuItem
                      onSelect={onOpenDonor}
                      className="cursor-pointer p-3"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-2 font-bold">
                          <HeartHandshake className="h-4 w-4 text-secondary" />
                          Donor
                        </span>
                        <span className="text-xs text-muted-foreground">
                          I manage campus surplus
                        </span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={onOpenRecipient}
                      className="cursor-pointer p-3"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-2 font-bold">
                          <Utensils className="h-4 w-4 text-primary" />
                          Recipient
                        </span>
                        <span className="text-xs text-muted-foreground">
                          I collect college food
                        </span>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>

          <button
            className="p-2 text-foreground md:hidden"
            onClick={() => setIsMenuOpen((currentState) => !currentState)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="border-t border-border/50 bg-background/95 py-4 md:hidden">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                  onClick={closeMenu}
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="mt-4 flex flex-col gap-3">
              {isAuthenticated && user ? (
                <>
                  <div className="rounded-2xl border border-border/60 bg-muted/40 px-3 py-3">
                    <p className="font-semibold text-foreground">{user.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {getRoleLabel(user.role)}
                    </p>
                  </div>
                  <Button asChild variant="outline" className="justify-start">
                    <Link to={roleHomePath} onClick={closeMenu}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      {roleHomeLabel}
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <Link to="/account/settings" onClick={closeMenu}>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </Button>
                  <Button
                    className="justify-start"
                    onClick={() => void handleSignOut()}
                    disabled={isSigningOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {isSigningOut ? "Signing out..." : "Sign Out"}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" asChild className="justify-start">
                    <Link to="/admin/login" onClick={closeMenu}>
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Admin Sign In
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="justify-start">
                    <Link to="/login" onClick={closeMenu}>
                      Sign In
                    </Link>
                  </Button>
                  <Button
                    variant="secondary"
                    className="justify-start"
                    onClick={() => {
                      closeMenu();
                      onOpenDonor();
                    }}
                  >
                    <HeartHandshake className="mr-2 h-4 w-4" />
                    Join as Donor
                  </Button>
                  <Button
                    className="justify-start"
                    onClick={() => {
                      closeMenu();
                      onOpenRecipient();
                    }}
                  >
                    <Utensils className="mr-2 h-4 w-4" />
                    Join as Recipient
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
