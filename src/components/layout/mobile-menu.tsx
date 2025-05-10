import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Menu, 
  X, 
  User, 
  LayoutDashboard, 
  Crown, 
  UserPlus, 
  LogOut 
} from "lucide-react";

export default function MobileMenu() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
    },
    {
      name: "Membership",
      href: "/membership",
      icon: Crown,
    },
    {
      name: "Add Member",
      href: "/add-member",
      icon: UserPlus,
    },
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Format initials for the avatar
  const getInitials = () => {
    if (!user || !user.gymName) return "G";
    return user.gymName.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-30">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <button onClick={toggleMenu} className="mr-2 text-gray-600">
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="font-bold text-lg">{user?.gymName || "Gym Management"}</h1>
          </div>
          <div>
            <button className="text-gray-600">
              <User className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu Overlay */}
      <div 
        className={cn(
          "fixed inset-0 z-40 md:hidden",
          isMenuOpen ? "block" : "hidden"
        )}
      >
        <div 
          className="absolute inset-0 bg-gray-900 opacity-50"
          onClick={toggleMenu}
        ></div>
        
        <div className="absolute top-0 left-0 bottom-0 w-64 bg-gray-900 text-white">
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-xl font-bold mr-3">
                  <span>{getInitials()}</span>
                </div>
                <h2 className="font-bold">{user?.gymName || "Gym Management"}</h2>
              </div>
              <button onClick={toggleMenu} className="text-gray-400">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <nav className="py-4">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.name}>
                  <a 
                    href={item.href} 
                    className={cn(
                      "flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800",
                      location === item.href && "bg-gray-800"
                    )}
                    onClick={toggleMenu}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    <span>{item.name}</span>
                  </a>
                </li>
              ))}
              <li>
                <button 
                  onClick={handleLogout}
                  className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 w-full"
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  <span>Logout</span>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
}
