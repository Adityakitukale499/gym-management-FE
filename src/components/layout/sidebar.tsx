import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Crown, 
  UserPlus, 
  Calendar,
  LogOut 
} from "lucide-react";

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

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
    {
      name: "Festival",
      href: "/festival",
      icon: Calendar,
    },
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Format initials for the avatar
  const getInitials = () => {
    if (!user || !user.gymName) return "G";
    return user.gymName.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="sidebar bg-gray-900 text-white w-64 flex-shrink-0 hidden md:block">
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-xl font-bold mr-3">
              <span>{getInitials()}</span>
            </div>
            <div>
              <h2 className="font-bold">{user?.gymName || "Gym Management"}</h2>
              <p className="text-xs text-gray-400">Gym Management</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.name}>
                <a 
                  href={item.href} 
                  className={cn(
                    "flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg mx-2",
                    location === item.href && "bg-gray-800"
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  <span>{item.name}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="p-4 border-t border-gray-800">
          <button 
            onClick={handleLogout}
            className="flex items-center text-gray-300 hover:text-white w-full"
          >
            <LogOut className="mr-3 h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
