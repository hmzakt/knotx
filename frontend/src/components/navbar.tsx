"use client";

import { useState } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import apiClient from "@/lib/api";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();

  const toggleMenu = () => setIsOpen(!isOpen);

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Explore", href: "/explore", icon: Compass },
    { name: "Contact", href: "/contact", icon: Mail },
  ];

  const handleLogout = async () => {
    try {
      await apiClient.post("/users/logout");
      logout();
      setIsOpen(false);
    } catch (error) {
      console.error("Logout error:", error);
      logout();
      setIsOpen(false);
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-gradient-to-r from-sky-950 via-sky-900 to-sky-950 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link
              href="/"
              className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
            >
              SkillBridge
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="px-3 py-2 text-sm font-medium rounded-md text-sky-100 hover:text-sky-50 hover:bg-sky-800/60 transition-all duration-200 flex items-center gap-2"
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Desktop Account Menu / Login Button */}
          <div className="hidden md:block">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 text-sky-100 hover:bg-sky-800/60 transition-colors"
                  >
                    <User className="h-4 w-4" />
                    Account
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-52 bg-background/95 backdrop-blur-sm border border-border/50 shadow-lg rounded-md"
                >
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/subscriptions"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <CreditCard className="h-4 w-4" />
                      Subscriptions
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/settings"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full text-left"
                    >
                      Sign Out
                    </button>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                <Button className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white shadow-md transition-colors">
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
              className="inline-flex items-center justify-center p-2 hover:bg-sky-800/60 transition-colors"
            >
              {isOpen ? (
                <X className="h-6 w-6 text-sky-100" />
              ) : (
                <Menu className="h-6 w-6 text-sky-100" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isOpen && (
          <div className="md:hidden border-t border-border/40 bg-sky-950/95 backdrop-blur-sm shadow-lg">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="hover:bg-sky-800/60 px-3 py-2 rounded-md text-base font-medium flex items-center gap-2 text-sky-100 transition-all"
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}

              {/* Mobile Account Section */}
              <div className="border-t border-border/40 pt-3 mt-3">
                {user ? (
                  <>
                    <div className="px-3 py-2 text-sm font-semibold text-sky-200">
                      Account
                    </div>
                    <Link
                      href="/dashboard"
                      className="hover:bg-sky-800/60 px-3 py-2 rounded-md text-base flex items-center gap-2 text-sky-100"
                      onClick={() => setIsOpen(false)}
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                    <Link
                      href="/subscriptions"
                      className="hover:bg-sky-800/60 px-3 py-2 rounded-md text-base flex items-center gap-2 text-sky-100"
                      onClick={() => setIsOpen(false)}
                    >
                      <CreditCard className="h-4 w-4" />
                      Subscriptions
                    </Link>
                    <Link
                      href="/settings"
                      className="hover:bg-sky-800/60 px-3 py-2 rounded-md text-base flex items-center gap-2 text-sky-100"
                      onClick={() => setIsOpen(false)}
                    >
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="hover:bg-sky-800/60 w-full px-3 py-2 rounded-md text-base flex items-center gap-2 text-sky-100"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    className="hover:bg-sky-800/60 px-3 py-2 rounded-md text-base flex items-center gap-2 text-sky-100"
                    onClick={() => setIsOpen(false)}
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
