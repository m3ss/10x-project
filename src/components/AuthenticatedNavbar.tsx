import { useState, useEffect } from "react";
import { Moon, Sun, User, LogOut, Settings, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import type { AuthenticatedNavbarProps } from "@/types";

type Theme = "light" | "dark";

export function AuthenticatedNavbar({ user }: AuthenticatedNavbarProps) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    // Check saved theme in localStorage or default to dark
    const savedTheme = (localStorage.getItem("theme") as Theme) || "dark";
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    if (newTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  const toggleTheme = () => {
    const newTheme: Theme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        // Redirect to home page
        window.location.href = "/";
      } else {
        console.error("Logout failed");
        setIsLoggingOut(false);
      }
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  };

  // Get user initials from email
  const getUserInitials = (email: string): string => {
    const parts = email.split("@")[0].split(".");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <nav
      className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      data-testid="authenticated-navbar"
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo/Brand */}
        <div className="flex items-center gap-6">
          <a href="/my-flashcards" className="flex items-center gap-2" data-testid="logo-link">
            <Sparkles className="size-6 text-primary" aria-hidden="true" />
            <span className="text-xl font-bold">10x-cards</span>
          </a>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            <Button variant="ghost" asChild>
              <a href="/my-flashcards" data-testid="nav-my-flashcards">
                Moje fiszki
              </a>
            </Button>
            <Button variant="ghost" asChild>
              <a href="/generate" data-testid="nav-generate">
                Generowanie
              </a>
            </Button>
          </div>
        </div>

        {/* Right side: Theme toggle + User menu */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Przełącz na jasny motyw" : "Przełącz na ciemny motyw"}
            data-testid="theme-toggle"
          >
            {theme === "dark" ? (
              <Sun className="size-5 transition-all" aria-hidden="true" />
            ) : (
              <Moon className="size-5 transition-all" aria-hidden="true" />
            )}
          </Button>

          {/* User Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                aria-label="Menu użytkownika"
                data-testid="user-menu-trigger"
              >
                <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <span className="text-xs font-medium">{getUserInitials(user.email)}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56" data-testid="user-menu-content">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Moje konto</p>
                  <p className="text-xs leading-none text-muted-foreground" data-testid="user-menu-email">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a href="/my-flashcards" className="flex cursor-pointer items-center" data-testid="menu-my-flashcards">
                  <User className="mr-2 size-4" aria-hidden="true" />
                  <span>Moje fiszki</span>
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href="/generate" className="flex cursor-pointer items-center" data-testid="menu-generate">
                  <Sparkles className="mr-2 size-4" aria-hidden="true" />
                  <span>Generowanie</span>
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href="/settings" className="flex cursor-pointer items-center" data-testid="menu-settings">
                  <Settings className="mr-2 size-4" aria-hidden="true" />
                  <span>Ustawienia</span>
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="cursor-pointer text-destructive focus:text-destructive"
                data-testid="menu-logout"
              >
                <LogOut className="mr-2 size-4" aria-hidden="true" />
                <span>{isLoggingOut ? "Wylogowywanie..." : "Wyloguj się"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
