import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Home,
  Calendar,
  Gift,
  ChevronRight,
  User,
  LogOut,
  MessageCircle
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface SidebarItem {
  label: string;
  icon: React.ComponentType<any>;
  path?: string;
  children?: SidebarItem[];
  badge?: string | number;
}

const sidebarItems: SidebarItem[] = [
  {
    label: "Painel",
    icon: Home,
    path: "/client-dashboard",
  },
  {
    label: "Reservas",
    icon: Calendar,
    path: "/client-reservas",
  },
  {
    label: "Mensagens",
    icon: MessageCircle,
    path: "/client-chat",
  },
  {
    label: "Ofertas",
    icon: Gift,
    path: "/client-offers",
  }
];

export default function ClientSidebar() {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const [expandedItems, setExpandedItems] = useState<string[]>(["Reservas"]);

  const toggleExpanded = (label: string) => {
    setExpandedItems(prev => 
      prev.includes(label) 
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    return location === path;
  };

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const renderSidebarItem = (item: SidebarItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.label);
    const isItemActive = isActive(item.path);

    return (
      <div key={item.label}>
        <div
          className={cn(
            "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors",
            "hover:bg-gray-100 dark:hover:bg-gray-800",
            level > 0 && "ml-4 text-sm",
            isItemActive && "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
          )}
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.label);
            } else if (item.path) {
              setLocation(item.path);
            }
          }}
        >
          <div className="flex items-center gap-3">
            <item.icon className={cn(
              "h-5 w-5",
              level > 0 && "h-4 w-4"
            )} />
            <span className="font-medium">{item.label}</span>
            {item.badge && (
              <Badge variant="secondary" className="ml-2">
                {item.badge}
              </Badge>
            )}
          </div>
          {hasChildren && (
            <ChevronRight className={cn(
              "h-4 w-4 transition-transform",
              isExpanded && "rotate-90"
            )} />
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children?.map(child => renderSidebarItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full">
      {/* User Profile Section */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 dark:text-white truncate">
              {user?.name || "Usuário"}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {user?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Principal Section */}
      <div className="flex-1 p-4">
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Principal
          </h3>
          <div className="space-y-1">
            {sidebarItems.map(item => renderSidebarItem(item))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
        <Link href="/profile">
          <Button variant="ghost" size="sm" className="w-full justify-start">
            <User className="h-4 w-4 mr-2" />
            Perfil
          </Button>
        </Link>
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" 
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </div>
    </div>
  );
}