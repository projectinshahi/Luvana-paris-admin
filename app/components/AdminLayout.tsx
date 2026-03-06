"use client";

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "./ui/button";
import {
  Users,
  Settings,
  LogOut,
  Library,
  LayoutDashboard,
  Signpost,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  BadgePercent,
  Percent,
  Package,
  Dice1,
  ShoppingCart,
  PersonStanding,
  Flag,
  Menu,
  X
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [usersOpen, setUsersOpen] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  // Show loading initially
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user !== undefined) {
      setIsLoading(false);
      console.log('✅ User loaded:', user);
      // console.log('✅ User permissions:', user?.permissions);
    }
  }, [user]);

  // Simple check if user has permission
  const hasPermission = (module: string) => {
    // if (!user || !user.permissions) return false;
    // return user.permissions.includes(module);
    return true; // Enable all permissions for now
  };

  // Define all regular menu items (excluding Settings and Users section)
  const getRegularMenuItems = () => {
    // if (!user) return [];

    const regularItems = [
      { 
        title: "Dashboard", 
        icon: <LayoutDashboard className="h-5 w-5" />, 
        path: "/admin/dashboard",
        permission: "dashboard",
        visible: true,//hasPermission("dashboard")
      },
      { 
        title: "Category", 
        icon: <Library className="h-5 w-5" />, 
        path: "/admin/category",
        permission: "category",
        visible: true,//hasPermission("category")
      },
      { 
        title: "Brand", 
        icon: <Dice1 className="h-5 w-5" />, 
        path: "/admin/brand",
        permission: "brand",
        visible: true,//hasPermission("brand")
      },
      {
        title: "Customers",
        icon: <Users className="h-5 w-5" />,
        path: "/admin/customer",
        permission: "customers",
        visible: true,
      },
      { 
        title: "Product", 
        icon: <Package className="h-5 w-5" />, 
        path: "/admin/product",
        permission: "product",
        visible: true,//hasPermission("product")
      },
      { 
        title: "Banner", 
        icon: <Signpost className="h-5 w-5" />, 
        path: "/admin/banner",
        permission: "banner",
        visible: true,//hasPermission("banner")
      },
      { 
        title: "Promotion Strip", 
        icon: <BadgePercent className="h-5 w-5" />, 
        path: "/admin/promotion-strip",
        permission: "promotion-strip",
        visible: true,//hasPermission("promotion-strip")
      },
      { 
        title: "Influencer", 
        icon: <PersonStanding className="h-5 w-5" />, 
        path: "/admin/influencer",
        permission: "influencer",
        visible: true,//hasPermission("influencer")
      },
      { 
        title: "Country", 
        icon: <Flag className="h-5 w-5" />, 
        path: "/admin/country",
        permission: "country",
        visible: true,//hasPermission("country")
      },
      { 
        title: "Orders", 
        icon: <ShoppingCart className="h-5 w-5" />, 
        path: "/admin/order",
        permission: "order",
        visible: true,//hasPermission("order")
      },
    ];

    return regularItems.filter(item => item.visible);
  };

  // Check if users section should be visible
  const shouldShowUsersSection = () => {
    if (!user) return false;
    return hasPermission("roles") || hasPermission("users");
  };

  // Check if Settings should be visible
  const shouldShowSettings = () => {
    return hasPermission("settings");
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const isPathActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + "/");
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4 mx-auto"></div>
          <p className="text-slate-300">Loading...</p>
        </div>
      </div>
    );
  }

  const regularMenuItems = getRegularMenuItems();
  const showUsers = shouldShowUsersSection();
  const showSettings = shouldShowSettings();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 z-40 h-screen w-64 bg-gradient-to-b from-slate-900 to-slate-800 border-r border-slate-700 transition-transform duration-300 ${!sidebarOpen && '-translate-x-full md:translate-x-0'}`}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="border-b border-slate-700 px-6 py-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">Luvana Paris</h1>
              <p className="text-xs text-slate-400 mt-1">Admin Panel</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
            {/* Show regular menu items */}
            {regularMenuItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center space-x-3 rounded-lg px-4 py-3 transition-all duration-200 group ${
                  isPathActive(item.path) 
                    ? "bg-blue-600 text-white shadow-lg" 
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
              >
                <span className={`transition-transform ${isPathActive(item.path) ? 'scale-110' : 'group-hover:scale-110'}`}>
                  {item.icon}
                </span>
                <span className="font-medium">{item.title}</span>
              </Link>
            ))}

            {/* Users Section - Conditional */}
            {showUsers && (
              <div>
                <button
                  type="button"
                  onClick={() => setUsersOpen((s) => !s)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
                    usersOpen 
                      ? "bg-slate-700 text-white" 
                      : "text-slate-300 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5" />
                    <span className="font-medium">Users</span>
                  </div>
                  {usersOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>

                {usersOpen && (
                  <div className="ml-6 mt-2 space-y-1">
                    {hasPermission("roles") && (
                      <Link
                        href="/admin/roles"
                        className={`flex items-center space-x-2 rounded-lg px-3 py-2 text-sm transition-all duration-200 ${
                          isPathActive("/admin/roles") 
                            ? "bg-blue-600 text-white" 
                            : "text-slate-400 hover:bg-slate-700 hover:text-white"
                        }`}
                      >
                        <ShieldCheck className="h-4 w-4" />
                        <span>Roles</span>
                      </Link>
                    )}
                    {hasPermission("users") && (
                      <Link
                        href="/admin/users"
                        className={`flex items-center space-x-2 rounded-lg px-3 py-2 text-sm transition-all duration-200 ${
                          isPathActive("/admin/users") 
                            ? "bg-blue-600 text-white" 
                            : "text-slate-400 hover:bg-slate-700 hover:text-white"
                        }`}
                      >
                        <Users className="h-4 w-4" />
                        <span>All Users</span>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Settings - ALWAYS LAST */}
            {/* {showSettings && (
              <Link
                href="/admin/settings"
                className={`flex items-center space-x-3 rounded-lg px-4 py-3 transition-all duration-200 ${
                  isPathActive("/admin/settings") 
                    ? "bg-blue-600 text-white shadow-lg" 
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
              >
                <Settings className="h-5 w-5" />
                <span className="font-medium">Settings</span>
              </Link>
            )} */}

            {/* If no menu items at all */}
            {regularMenuItems.length === 0 && !showUsers && !showSettings && (
              <div className="px-4 py-8 text-center text-sm text-slate-400">
                <p>No permissions assigned</p>
                <p className="text-xs mt-2">Contact administrator</p>
              </div>
            )}
          </nav>

          {/* User Info & Logout */}
          <div className="border-t border-slate-700 p-4 space-y-3">
            {user && (
              <div className="px-2 py-2 text-sm">
                <p className="text-slate-300 font-medium truncate">{user.email || 'Admin User'}</p>
                <p className="text-xs text-slate-500">Administrator</p>
              </div>
            )}
            <Button 
              variant="ghost" 
              className="w-full justify-start space-x-3 text-slate-300 hover:bg-red-600 hover:text-white transition-all duration-200" 
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Top Header Bar */}
      <header className="fixed top-0 right-0 left-0 md:left-64 h-16 bg-white border-b border-slate-200 shadow-sm z-30">
        <div className="flex items-center justify-between px-6 h-full">
          <div className="md:hidden">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
          <div className="flex-1"></div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">{user?.email || 'Admin'}</p>
              <p className="text-xs text-slate-500">Welcome back</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="md:pl-64 pt-16">
        <div className="min-h-screen p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;