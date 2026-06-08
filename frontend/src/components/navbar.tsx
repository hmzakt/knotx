"use client";

import { useState, useEffect } from "react";
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
  PlayCircle,
  ChevronDown,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useRouteLoading } from "@/contexts/RouteLoadingContext";
import { useTheme } from "@/contexts/ThemeContext";
import apiClient from "@/lib/api";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const { start, stop } = useRouteLoading();
  const { theme, setTheme, actualTheme } = useTheme();

  const toggleMenu = () => setIsOpen(!isOpen);

  // Transparent-to-opaque scroll behavior
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Explore", href: "/explore", icon: Compass },
    { name: "Courses", href: "/courses", icon: PlayCircle },
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
    if (theme === "system") return Monitor;
    return actualTheme === "dark" ? Moon : Sun;
  };

  const cycleTheme = () => {
    if (theme === "dark") {
      setTheme("light");
    } else if (theme === "light") {
      setTheme("system");
    } else {
      setTheme("dark");
    }
  };

  return (
    <nav
      id="main-navbar"
      className="sticky top-0 z-50 w-full transition-all duration-300"
      style={{
        background: scrolled
          ? "var(--nav-bg-solid)"
          : "var(--nav-bg-transparent)",
        borderBottom: scrolled
          ? "1px solid var(--nav-border)"
          : "1px solid transparent",
        backdropFilter: scrolled ? "blur(16px) saturate(180%)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(16px) saturate(180%)" : "none",
        boxShadow: scrolled
          ? "0 1px 24px rgba(0,0,0,0.08)"
          : "none",
      }}
    >
      <div className="w-full px-4 sm:px-6 lg:px-12">
        <div className="flex justify-between items-center h-[60px]">

          {/* Logo */}
          <div className="flex-shrink-0">
            <Link
              href="/"
              onClick={() => start("nav")}
              onMouseDown={() => start("nav")}
              className="flex items-center gap-2 hover:opacity-85 transition-opacity"
            >
              <Image
                src="/logo_hor.png"
                alt="KnotX logo"
                width={120}
                height={40}
                priority
                className="h-8 w-auto object-contain"
              />
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => start("nav")}
                onMouseDown={() => start("nav")}
                className="group relative px-4 py-2 text-sm font-medium uppercase tracking-widest transition-all duration-200"
                style={{ color: "var(--nav-text)" }}
              >
                {item.name}
                {/* Amber underline hover */}
                <span
                  className="absolute bottom-0 left-4 right-4 h-0.5 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-200 rounded-full"
                  style={{ background: "var(--av-amber)" }}
                />
              </Link>
            ))}
          </div>

          {/* Desktop Right Side */}
          <div className="hidden md:flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={cycleTheme}
              className="p-2 rounded-lg transition-all duration-200 hover:scale-105"
              style={{
                color: "var(--nav-text-muted)",
                background: "transparent",
              }}
              title={`Theme: ${theme}`}
              id="theme-toggle-btn"
            >
              {(() => {
                const Icon = getThemeIcon();
                return <Icon className="h-4 w-4" />;
              })()}
            </button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                    style={{
                      color: "var(--nav-text)",
                      border: "1px solid var(--nav-border)",
                    }}
                    id="account-menu-btn"
                  >
                    <User className="h-3.5 w-3.5" />
                    <span className="uppercase tracking-wider text-xs">Account</span>
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 mt-1 rounded-lg overflow-hidden shadow-xl"
                  style={{
                    background: "var(--av-card-bg)",
                    border: "1px solid var(--av-card-border)",
                  }}
                >
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" onClick={() => start("nav")} className="flex items-center gap-2 cursor-pointer px-3 py-2 text-sm">
                      <User className="h-4 w-4" style={{ color: "var(--av-amber)" }} />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/subscriptions" onClick={() => start("nav")} className="flex items-center gap-2 cursor-pointer px-3 py-2 text-sm">
                      <CreditCard className="h-4 w-4" style={{ color: "var(--av-amber)" }} />
                      Subscriptions
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" onClick={() => start("nav")} className="flex items-center gap-2 cursor-pointer px-3 py-2 text-sm">
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm disabled:opacity-70"
                      style={{ color: "var(--av-signal)" }}
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
              <Link href="/login" onClick={() => start("nav")} onMouseDown={() => start("nav")}>
                <button
                  id="login-btn"
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold uppercase tracking-wider transition-all duration-200 hover:scale-[1.03] hover:shadow-lg"
                  style={{
                    background: "var(--av-amber)",
                    color: "#0d1117",
                  }}
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Login
                </button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={cycleTheme}
              className="p-2 rounded-lg"
              style={{ color: "var(--nav-text-muted)" }}
            >
              {(() => {
                const Icon = getThemeIcon();
                return <Icon className="h-4 w-4" />;
              })()}
            </button>
            <button
              onClick={toggleMenu}
              className="p-2 rounded-lg transition-all"
              style={{ color: "var(--nav-text)" }}
              id="mobile-menu-btn"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isOpen && (
          <div
            className="md:hidden border-t pb-4 pt-2"
            style={{ borderColor: "var(--nav-border)" }}
          >
            <div className="space-y-1 pt-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium uppercase tracking-widest transition-all"
                    style={{ color: "var(--nav-text)" }}
                    onClick={() => { setIsOpen(false); start("nav"); }}
                  >
                    <Icon className="h-4 w-4" style={{ color: "var(--av-amber)" }} />
                    {item.name}
                  </Link>
                );
              })}
            </div>

            {/* Mobile Account */}
            <div className="border-t mt-3 pt-3" style={{ borderColor: "var(--nav-border)" }}>
              {user ? (
                <>
                  <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm" style={{ color: "var(--nav-text)" }} onClick={() => setIsOpen(false)}>
                    <User className="h-4 w-4" style={{ color: "var(--av-amber)" }} />
                    Profile
                  </Link>
                  <Link href="/subscriptions" className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm" style={{ color: "var(--nav-text)" }} onClick={() => setIsOpen(false)}>
                    <CreditCard className="h-4 w-4" style={{ color: "var(--av-amber)" }} />
                    Subscriptions
                  </Link>
                  <Link href="/settings" className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm" style={{ color: "var(--nav-text)" }} onClick={() => setIsOpen(false)}>
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium"
                    style={{ color: "var(--av-signal)" }}
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold"
                  style={{ color: "var(--av-amber)" }}
                  onClick={() => { setIsOpen(false); start("nav"); }}
                >
                  <LogIn className="h-4 w-4" />
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}