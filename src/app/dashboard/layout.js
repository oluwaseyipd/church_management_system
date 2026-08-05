"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Music, 
  Menu, 
  X, 
  User, 
  Users,
  LogOut, 
  Settings,
  Globe,
  Tag
} from "lucide-react";

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState({ name: "Admin Account", email: "media@hgbcinfluencers.org" });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch (err) {
        console.error("Failed to load user details", err);
      }
    };
    fetchUser();
  }, []);

  const navigation = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Manage Sermons", href: "/dashboard/sermons", icon: Music },
    { name: "Featured Series", href: "/dashboard/featured-series", icon: Tag },
    { name: "Team Members", href: "/dashboard/team", icon: Users },
  ];

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST"
      });
      if (res.ok) {
        router.push("/login");
        router.refresh();
      }
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Sidebar Back Drop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 text-white transform transition-transform duration-300 ease-in-out lg:hidden flex flex-col ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex items-center justify-between h-20 px-6 border-b border-slate-900 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <Image 
              src="https://res.cloudinary.com/yttbshx3/image/upload/v1782975092/icon_logo_kajuv5.png" 
              alt="HGBC Logo" 
              width={40}
              height={40}
              className="object-contain"
            />
            <div>
              <h1 className="font-bold tracking-tight text-white leading-tight">HGBC</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Influencers</p>
            </div>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? "bg-brand-orange-600 text-white shadow-lg shadow-brand-orange-600/25" 
                    : "text-slate-400 hover:bg-slate-900 hover:text-white"
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-900 space-y-2 flex-shrink-0">
          <a
            href="https://hgbcinfluencers.org"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-900 hover:text-white transition-colors"
          >
            <Globe className="w-5 h-5" />
            <span>View Website</span>
          </a>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-72 bg-slate-950 text-white flex-shrink-0 border-r border-slate-900">
        <div className="flex items-center space-x-3 h-20 px-6 border-b border-slate-900">
          <Image 
            src="https://res.cloudinary.com/yttbshx3/image/upload/v1782975092/icon_logo_kajuv5.png" 
            alt="HGBC Logo" 
            width={40}
            height={40}
            className="object-contain"
          />
          <div>
            <h1 className="font-bold tracking-tight text-white leading-tight">HGBC</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Influencers</p>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? "bg-brand-orange-600 text-white shadow-lg shadow-brand-orange-600/25" 
                    : "text-slate-400 hover:bg-slate-900 hover:text-white"
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-900 space-y-2">
          <a
            href="https://hgbcinfluencers.org"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-900 hover:text-white transition-colors"
          >
            <Globe className="w-5 h-5" />
            <span>View Website</span>
          </a>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* Main Content Side */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 flex items-center justify-between px-6 sm:px-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              {pathname === "/dashboard" 
                ? "Overview" 
                : pathname.startsWith("/dashboard/sermons/upload") 
                ? "Upload New Sermon" 
                : pathname.startsWith("/dashboard/featured-series")
                ? "Featured Series"
                : pathname.startsWith("/dashboard/team")
                ? "Team Members"
                : "Manage Sermons"}
            </h2>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200/60 rounded-full py-1.5 pl-3 pr-4">
              <div className="w-8 h-8 rounded-full bg-brand-orange-100 flex items-center justify-center text-brand-orange-700 font-bold text-sm select-none">
                {user.name ? user.name[0].toUpperCase() : "A"}
              </div>
              <div className="hidden sm:block text-left leading-none">
                <p className="text-xs font-semibold text-slate-800">{user.name}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[140px]">{user.email}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
