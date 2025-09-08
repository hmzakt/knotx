"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Menu, X, User, CreditCard, Compass, Mail, Home, LogIn } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import apiClient from "@/lib/api"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, logout } = useAuth()

  const toggleMenu = () => setIsOpen(!isOpen)

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Explore", href: "/explore", icon: Compass },
    { name: "Contact", href: "/contact", icon: Mail },
  ]

  const handleLogout = async () => {
    try {
      await apiClient.post("/users/logout")
      logout() 
      setIsOpen(false)
    } catch (error) {
      console.error("Logout error:", error)
      logout()
      setIsOpen(false)
    }
  }

  return (
    <nav className="backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 bg-sky-900 w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 bg-sky-950">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-xl font-bold text-sky-100 hover:text-sky-200 transition-colors mx-2.5">
              Logo
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="hover:text-foreground hover:bg-accent/50 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 text-sky-100"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Desktop Account Menu / Login Button */}
          <div className="hidden md:block">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="text-sky-100 px-1.5" asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 hover:bg-accent/50 transition-colors"
                  >
                    <User className="h-4 w-4" />
                    Account
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-popover/95 backdrop-blur-sm border-border/50">
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/subscriptions" className="flex items-center gap-2 cursor-pointer">
                      <CreditCard className="h-4 w-4" />
                      Subscriptions
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/" onClick={handleLogout} className="flex items-center gap-2 cursor-pointer">
                      Sign Out
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 hover:bg-accent/50 transition-colors text-sky-100"
                >
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
              className="inline-flex items-center justify-center p-2 hover:bg-accent/50 transition-colors"
            >
              {isOpen ? <X className="h-6 w-6 text-sky-200" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-border/40 backdrop-blur-sm bg-transparent">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="hover:text-foreground hover:bg-accent/50 px-3 py-2 rounded-md text-base font-medium transition-all duration-200 flex items-center gap-2 text-sky-200"
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                )
              })}

              {/* Mobile Account Section */}
              <div className="border-t border-border/40 pt-3 mt-3">
                {user ? (
                  <>
                    <div className="px-3 py-2 text-sm font-medium text-sky-100">Account</div>
                    <Link
                      href="/profile"
                      className="hover:text-foreground hover:bg-accent/50 px-3 py-2 rounded-md text-base font-medium transition-all duration-200 flex items-center gap-2 text-sky-200"
                      onClick={() => setIsOpen(false)}
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                    <Link
                      href="/subscriptions"
                      className="hover:text-foreground hover:bg-accent/50 px-3 py-2 rounded-md text-base font-medium transition-all duration-200 flex items-center gap-2 text-sky-200"
                      onClick={() => setIsOpen(false)}
                    >
                      <CreditCard className="h-4 w-4" />
                      Subscriptions
                    </Link>
                    <Link
                      href="/settings"
                      className="hover:text-foreground hover:bg-accent/50 block px-3 py-2 rounded-md text-base font-medium transition-all duration-200 text-sky-200"
                      onClick={() => setIsOpen(false)}
                    >
                      Settings
                    </Link>
                    <Link
                      href="/"
                      className="hover:text-foreground hover:bg-accent/50 block px-3 py-2 rounded-md text-base font-medium transition-all duration-200 text-sky-200"
                      onClick={handleLogout}
                    >
                      Sign Out
                    </Link>
                  </>
                ) : (
                  <Link
                    href="/login"
                    className="hover:text-foreground hover:bg-accent/50 px-3 py-2 rounded-md text-base font-medium transition-all duration-200 flex items-center gap-2 text-sky-200"
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
  )
}