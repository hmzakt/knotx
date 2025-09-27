"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Menu,
  X,
  User,
  CreditCard,
  Compass,
  Mail,
  Home,
  LogIn,
  Moon,
  Sun,
  Monitor,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouteLoading } from "@/contexts/RouteLoadingContext";
import { useTheme } from "@/contexts/ThemeContext";
import apiClient from "@/lib/api";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { user, logout } = useAuth();
  const { start, stop } = useRouteLoading();
  const { theme, setTheme, actualTheme } = useTheme();

  const toggleMenu = () => setIsOpen(!isOpen);

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Explore", href: "/explore", icon: Compass },
    { name: "Contact", href: "/contact", icon: Mail },
  ];

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      start("logout");
      await apiClient.post("/users/logout");
      logout();
      setIsOpen(false);
    } catch (error) {
      console.error("Logout error:", error);
      logout();
      setIsOpen(false);
    } finally {
      setIsLoggingOut(false);
      stop();
    }
  };

  const getThemeIcon = () => {
    if (theme === 'system') return Monitor;
    return actualTheme === 'dark' ? Moon : Sun;
  };

  const cycleTheme = () => {
    if (theme === 'dark') {
      setTheme('light');
    } else if (theme === 'light') {
      setTheme('system');
    } else {
      setTheme('dark');
    }
  };

  return (
    <nav className="opacity-95 sticky top-0 z-50 w-full border-b border-emerald-800/30 bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 backdrop-blur-lg shadow-lg">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 px-2 md:p-10">
            <Link
              href="/"
              onClick={() => start("nav")}
              onMouseDown={() => start("nav")}
              className="flex items-center text-2xl font-extrabold tracking-tight hover:opacity-90 transition-opacity"
            >
              <Image 
                src="/logo_hor.png" 
                alt="KnotX logo" 
                width={150} 
                height={50} 
                priority 
                className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => start("nav")}
                  onMouseDown={() => start("nav")}
                  className="px-3 py-2 text-sm font-medium rounded-md text-emerald-100 hover:text-white hover:bg-emerald-800/60 transition-all duration-200 flex items-center gap-2"
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Desktop Account Menu / Login Button */}
          <div className="hidden md:flex items-center gap-2">
            {/* Theme Toggle Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={cycleTheme}
              className="flex items-center gap-2 text-emerald-100 hover:bg-emerald-800/60 transition-colors"
              title={`Current: ${theme === 'system' ? 'System' : theme.charAt(0).toUpperCase() + theme.slice(1)}`}
            >
              {(() => {
                const Icon = getThemeIcon();
                return <Icon className="h-4 w-4" />;
              })()}
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 text-emerald-100 hover:bg-emerald-800/60 transition-colors"
                  >
                    <User className="h-4 w-4" />
                    Account
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-52 bg-emerald-900/95 backdrop-blur-sm border border-emerald-700/50 shadow-lg rounded-md"
                >
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard"
                      onClick={() => start("nav")}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/subscriptions"
                      onClick={() => start("nav")}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <CreditCard className="h-4 w-4" />
                      Subscriptions
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/settings"
                      onClick={() => start("nav")}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="flex items-center gap-2 w-full text-left disabled:opacity-70"
                    >
                      {isLoggingOut ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Signing out...
                        </span>
                      ) : (
                        <>Sign Out</>
                      )}
                    </button>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login" onClick={() => start("nav")}
                onMouseDown={() => start("nav")}
              >
                <Button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-md px-4 py-2 rounded-md transition-colors">
                  <LogIn className="h-4 w-4" />
                  Login
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 hover:bg-emerald-800/60 transition-colors"
            >
              {isOpen ? (
                <X className="h-6 w-6 text-emerald-100" />
              ) : (
                <Menu className="h-6 w-6 text-emerald-100" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isOpen && (
          <div className="md:hidden border-t border-emerald-800/40 bg-emerald-950/95 backdrop-blur-sm shadow-lg">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="hover:bg-emerald-800/60 px-3 py-2 rounded-md text-base font-medium flex items-center gap-2 text-emerald-100 transition-all"
                    onClick={() => { setIsOpen(false); start("nav"); }}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}

              {/* Mobile Account Section */}
              <div className="border-t border-emerald-800/40 pt-3 mt-3">
                {/* Mobile Theme Toggle */}
                <button
                  onClick={cycleTheme}
                  className="hover:bg-emerald-800/60 w-full px-3 py-2 rounded-md text-base flex items-center gap-2 text-emerald-100"
                >
                  {(() => {
                    const Icon = getThemeIcon();
                    return <Icon className="h-4 w-4" />;
                  })()}
                  Theme ({theme === 'system' ? 'System' : theme.charAt(0).toUpperCase() + theme.slice(1)})
                </button>

                {user ? (
                  <>
                    <div className="px-3 py-2 text-sm font-semibold text-emerald-200">
                      Account
                    </div>
                    <Link
                      href="/dashboard"
                      className="hover:bg-emerald-800/60 px-3 py-2 rounded-md text-base flex items-center gap-2 text-emerald-100"
                      onClick={() => setIsOpen(false)}
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                    <Link
                      href="/subscriptions"
                      className="hover:bg-emerald-800/60 px-3 py-2 rounded-md text-base flex items-center gap-2 text-emerald-100"
                      onClick={() => setIsOpen(false)}
                    >
                      <CreditCard className="h-4 w-4" />
                      Subscriptions
                    </Link>
                    <Link
                      href="/settings"
                      className="hover:bg-emerald-800/60 px-3 py-2 rounded-md text-base flex items-center gap-2 text-emerald-100"
                      onClick={() => setIsOpen(false)}
                    >
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="hover:bg-emerald-800/60 w-full px-3 py-2 rounded-md text-base flex items-center gap-2 text-emerald-100"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    className="hover:bg-emerald-800/60 px-3 py-2 rounded-md text-base flex items-center gap-2 text-emerald-100"
                    onClick={() => { setIsOpen(false); start('nav'); }}
                  >
                    <LogIn className="h-4 w-4" />
                    Login
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}