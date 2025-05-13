import Sidebar from "./sidebar";
import MobileMenu from "./mobile-menu";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar for desktop */}
      <Sidebar />
      
      {/* Mobile menu */}
      <MobileMenu />
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 bg-gray-50 overflow-y-auto pt-16 md:pt-0">
          {children}
        </main>
      </div>
    </div>
  );
}
