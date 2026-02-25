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

  // Show loading initially
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user !== undefined) {
      setIsLoading(false);
      console.log('✅ User loaded:', user);
      console.log('✅ User permissions:', user?.permissions);
    }
  }, [user]);

  // Simple check if user has permission
  const hasPermission = (module: string) => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(module);
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
      // { 
      //   title: "Coupon", 
      //   icon: <Percent className="h-5 w-5" />, 
      //   path: "/admin/coupon",
      //   permission: "coupon",
      //   visible: true,//hasPermission("coupon")
      // },
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4 mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If no user
  // if (!user) {
  //   return (
  //     <div className="min-h-screen bg-background flex items-center justify-center">
  //       <div className="text-center">
  //         <p className="text-muted-foreground mb-4">Not authorized. Please login.</p>
  //         <Button onClick={() => router.push("/login")}>Go to Login</Button>
  //       </div>
  //     </div>
  //   );
  // }

  const regularMenuItems = getRegularMenuItems();
  const showUsers = shouldShowUsersSection();
  const showSettings = shouldShowSettings();

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-card">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="border-b px-6 py-4">
            <h1 className="text-xl font-bold">Admin Panel</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {/* Show regular menu items */}
            {regularMenuItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center space-x-3 rounded-lg px-3 py-2 transition-colors
                  ${isPathActive(item.path) ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}
              >
                {item.icon}
                <span>{item.title}</span>
              </Link>
            ))}

            {/* Users Section - Conditional (comes before Settings) */}
            {showUsers && (
              <div>
                <button
                  type="button"
                  onClick={() => setUsersOpen((s) => !s)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors
                    ${usersOpen ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}
                >
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5" />
                    <span>Users</span>
                  </div>
                  {usersOpen ? (
                    <ChevronDown className="h-3 w-3 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-3 w-3 text-gray-400" />
                  )}
                </button>

                {usersOpen && (
                  <div className="ml-6 mt-1 space-y-1">
                    {hasPermission("roles") && (
                      <Link
                        href="/admin/roles"
                        className={`flex items-center space-x-2 rounded-lg px-3 py-2 text-sm transition-colors
                          ${isPathActive("/admin/roles") ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}
                      >
                        <ShieldCheck className="h-4 w-4" />
                        <span>Roles</span>
                      </Link>
                    )}
                    {hasPermission("users") && (
                      <Link
                        href="/admin/users"
                        className={`flex items-center space-x-2 rounded-lg px-3 py-2 text-sm transition-colors
                          ${isPathActive("/admin/users") ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}
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
            {showSettings && (
              <Link
                href="/admin/settings"
                className={`flex items-center space-x-3 rounded-lg px-3 py-2 transition-colors
                  ${isPathActive("/admin/settings") ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}
              >
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </Link>
            )}

            {/* If no menu items at all */}
            {regularMenuItems.length === 0 && !showUsers && !showSettings && (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                <p>No permissions assigned</p>
                <p className="text-xs mt-1">Contact administrator</p>
              </div>
            )}
          </nav>

          {/* Logout */}
          <div className="border-t p-4">
            <Button variant="ghost" className="w-full justify-start space-x-3" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="pl-64">
        <div className="container mx-auto p-6">{children}</div>
      </main>
    </div>
  );
};

export default AdminLayout;