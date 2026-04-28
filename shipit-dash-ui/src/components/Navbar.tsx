import { Moon, Sun, LogOut, Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "@/hooks/useUser";

const pageTitles: Record<string, string> = {
  "/": "Dashboard Overview",
  "/deployments": "Active Deployments",
  "/history": "Deployment History",
  "/settings": "System Settings",
};

export const Navbar = () => {
  const { data: user } = useUser();
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const navigate = useNavigate();
  const location = useLocation();

  const pageTitle = pageTitles[location.pathname] || "ShipIt Agent";

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  // Dynamic Logic based on Backend Data
  const username = user?.name || "Satyam Yadav";
  const initials = username
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase();
  
  // Format email: satyam.yadav@shipit.ai
  const formattedEmail = user?.email || (username.toLowerCase().split(" ").join(".") + "@shipit.ai");

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-card/80 backdrop-blur-xl border-b border-border z-30">
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-foreground tracking-tight">{pageTitle}</h2>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full hover:bg-secondary h-9 w-9"
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 border border-border">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{username}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {formattedEmail}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/settings")} className="gap-2 cursor-pointer">
                <SettingsIcon className="h-4 w-4" /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive gap-2 cursor-pointer"
                onClick={() => navigate("/logout")}
              >
                <LogOut className="h-4 w-4" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};