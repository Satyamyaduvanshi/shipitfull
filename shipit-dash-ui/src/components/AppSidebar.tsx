import { LayoutDashboard, Rocket, History, Settings, LogOut } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const menuItems = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/" },
  { title: "Deployments", icon: Rocket, path: "/deployments" },
  { title: "History", icon: History, path: "/history" },
  { title: "Settings", icon: Settings, path: "/settings" },
];

export const AppSidebar = () => {
  const navigate = useNavigate();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-card border-r border-border z-40 flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-foreground text-background">
            <Rocket className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold text-foreground tracking-tight">ShipIt</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200",
                "hover:bg-secondary group",
                isActive
                  ? "bg-foreground text-background font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className="h-4.5 w-4.5" />
                <span className="text-sm font-medium">{item.title}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground hover:bg-secondary"
          onClick={() => navigate("/logout")}
        >
          <LogOut className="h-4.5 w-4.5" />
          <span className="text-sm font-medium">Logout</span>
        </Button>
      </div>
    </aside>
  );
};
