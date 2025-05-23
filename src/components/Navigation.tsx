import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Cloud, Sun, LogIn, LogOut, LayoutDashboard } from "lucide-react";
import { supabase } from "@/pages/supabase";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const publicRoutes = [
    { name: "Weather", path: "/weather", icon: Sun },
  ];

  const authRoutes = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  ];

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
    setIsOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed w-full bg-white/80 backdrop-blur-lg border-b z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Cloud className="w-8 h-8 text-primary" />
              <span className="text-xl font-semibold text-primary">CloudCrop AI</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {user ? (
              <>
                {authRoutes.map((route) => (
                  <Link
                    key={route.path}
                    to={route.path}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                      isActive(route.path)
                        ? "text-primary bg-primary/10"
                        : "text-gray-600 hover:text-primary hover:bg-primary/5"
                    }`}
                  >
                    <route.icon className="w-5 h-5" />
                    <span>{route.name}</span>
                  </Link>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-primary"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button variant="default" size="sm">
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Navigation Toggle */}
          <div className="flex items-center md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2"
            >
              {isOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-b animate-fade-in">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {(user ? authRoutes : publicRoutes).map((route) => {
              const Icon = route.icon;
              return (
                <Link
                  key={route.path}
                  to={route.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium ${
                    isActive(route.path)
                      ? "text-primary bg-primary/10"
                      : "text-gray-600 hover:text-primary hover:bg-primary/5"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <span>{route.name}</span>
                </Link>
              );
            })}
            {user ? (
              <Button
                variant="default"
                className="w-full mt-4"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            ) : (
              <Link to="/auth">
                <Button variant="default" className="w-full mt-4">
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;