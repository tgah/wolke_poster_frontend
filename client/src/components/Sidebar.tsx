import { Link, useLocation } from "wouter";
import { LayoutDashboard, Image as ImageIcon, Box, History, LogOut, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "./ui/button";

const navItems = [
  { icon: LayoutDashboard, label: "Generator", href: "/poster-generator" },
  { icon: Box, label: "Products", href: "/products" },
  { icon: ImageIcon, label: "Templates", href: "/templates" },
  { icon: History, label: "History", href: "/history" },
];

export function Sidebar() {
  const [location] = useLocation();
  const { logout } = useAuth();

  return (
    <div className="flex flex-col h-full w-[260px] bg-sidebar text-sidebar-foreground border-r border-sidebar-border/50 shrink-0">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <ImageIcon className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-display text-xl font-bold tracking-tight">Wolke AI</h1>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group",
                  location === item.href
                    ? "bg-sidebar-accent text-white font-medium shadow-md shadow-black/20"
                    : "text-sidebar-foreground/60 hover:text-white hover:bg-sidebar-accent/50"
                )}
              >
                <item.icon className={cn("w-5 h-5", location === item.href ? "text-teal-400" : "group-hover:text-teal-400/80 transition-colors")} />
                <span>{item.label}</span>
              </div>
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-sidebar-border">
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 text-sidebar-foreground/60 hover:text-white hover:bg-sidebar-accent/50"
          onClick={() => logout()}
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );
}
