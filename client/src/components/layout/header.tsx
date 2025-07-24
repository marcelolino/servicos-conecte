import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/hooks/use-auth";
import { 
  Moon, 
  Sun, 
  Menu, 
  X, 
  Wrench, 
  Bell,
  User,
  LogOut,
  ShoppingCart,
  Calendar
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export default function Header() {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  const { user, logout, isAuthenticated, isLoggingOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch cart data for authenticated clients (but not during logout)
  const { data: cart } = useQuery({
    queryKey: ["/api/cart"],
    enabled: isAuthenticated && user?.userType === "client" && !isLoggingOut,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const cartItemCount = cart?.items ? cart.items.reduce((sum: number, item: any) => sum + item.quantity, 0) : 0;

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const handleLogout = () => {
    logout();
    // Use wouter navigation instead of window.location for smoother redirect
    setTimeout(() => {
      window.location.href = "/";
    }, 50);
  };

  const getDashboardLink = () => {
    if (!user) return "/";
    
    switch (user.userType) {
      case "client":
        return "/client-dashboard";
      case "provider":
        return "/provider-dashboard";
      case "admin":
        return "/admin-dashboard";
      default:
        return "/";
    }
  };

  return (
    <header className="bg-background border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
              <Wrench className="h-8 w-8 text-primary mr-2" />
              <h1 className="text-2xl font-bold text-foreground">Qserviços</h1>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link href="/" className="text-foreground hover:text-primary transition-colors">
              Como funciona
            </Link>
            <Link href="/services" className="text-foreground hover:text-primary transition-colors">
              Serviços
            </Link>
            <Link href="/register?type=provider" className="text-foreground hover:text-primary transition-colors">
              Seja um prestador
            </Link>
            <Link href="/support" className="text-foreground hover:text-primary transition-colors">
              Suporte
            </Link>
            {isAuthenticated && user?.userType === "client" && (
              <Link href="/client-bookings" className="text-foreground hover:text-primary transition-colors">
                Reservas
              </Link>
            )}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="hover:bg-muted"
            >
              {theme === "light" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>

            {isAuthenticated ? (
              <>
                {user?.userType === "client" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative hover:bg-muted"
                    asChild
                  >
                    <Link href="/cart">
                      <ShoppingCart className="h-5 w-5" />
                      {cartItemCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-primary text-primary-foreground">
                          {cartItemCount}
                        </Badge>
                      )}
                    </Link>
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative hover:bg-muted"
                >
                  <Bell className="h-5 w-5" />
                  <Badge className="notification-badge">2</Badge>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2">
                      <User className="h-5 w-5" />
                      <span>{user?.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={getDashboardLink()}>
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    {user?.userType === "client" && (
                      <DropdownMenuItem asChild>
                        <Link href="/orders">
                          Meus Pedidos
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href="/profile">
                        Perfil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Entrar</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Cadastrar</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-4">
              <Link href="/" className="text-foreground hover:text-primary transition-colors">
                Como funciona
              </Link>
              <Link href="/services" className="text-foreground hover:text-primary transition-colors">
                Serviços
              </Link>
              {isAuthenticated && user?.userType === "client" && (
                <>
                  <Link href="/client-bookings" className="text-foreground hover:text-primary transition-colors flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Reservas
                  </Link>
                  <Link href="/orders" className="text-foreground hover:text-primary transition-colors">
                    Meus Pedidos
                  </Link>
                </>
              )}
              <Link href="/register?type=provider" className="text-foreground hover:text-primary transition-colors">
                Seja um prestador
              </Link>
              <Link href="/support" className="text-foreground hover:text-primary transition-colors">
                Suporte
              </Link>
              
              <div className="flex items-center justify-between pt-4 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleTheme}
                  className="hover:bg-muted"
                >
                  {theme === "light" ? (
                    <>
                      <Moon className="h-4 w-4 mr-2" />
                      Modo Escuro
                    </>
                  ) : (
                    <>
                      <Sun className="h-4 w-4 mr-2" />
                      Modo Claro
                    </>
                  )}
                </Button>

                {isAuthenticated ? (
                  <div className="flex items-center space-x-2">
                    {user?.userType === "client" && (
                      <Button variant="default" size="sm" asChild className="bg-primary hover:bg-primary/90">
                        <Link href="/client-bookings">
                          <Calendar className="h-4 w-4 mr-2" />
                          Reservas
                        </Link>
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={getDashboardLink()}>Dashboard</Link>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleLogout}>
                      Sair
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/login">Entrar</Link>
                    </Button>
                    <Button size="sm" asChild>
                      <Link href="/register">Cadastrar</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
