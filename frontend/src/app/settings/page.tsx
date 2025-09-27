"use client";

import { useState, useEffect, FormEvent } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Moon, Sun, Monitor, Settings as SettingsIcon, Lock, Eye, EyeOff } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import apiClient from "@/lib/api";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  
  // Password change states
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState({ old: false, new: false, confirm: false });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  

  const themeOptions = [
    {
      value: "light",
      label: "Light",
      icon: Sun,
      description: "Light theme for bright environments"
    },
    {
      value: "dark",
      label: "Dark",
      icon: Moon,
      description: "Dark theme for low-light environments"
    },
    {
      value: "system",
      label: "System",
      icon: Monitor,
      description: "Follow your system preference"
    }
  ];

  // Password change handlers
  const handleChangePassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMessage("New passwords don't match");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage("Password must be at least 6 characters");
      return;
    }

    setIsChangingPassword(true);
    setPasswordMessage("");

    try {
      await apiClient.post("/users/change-password", {
        oldPassword,
        newPassword
      });
      setPasswordMessage("Password changed successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowChangePassword(false);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setPasswordMessage(error.response?.data?.message || "Failed to change password");
      } else if (error instanceof Error) {
        setPasswordMessage(error.message || "Failed to change password");
      } else {
        setPasswordMessage("Failed to change password");
      }
    } finally {
      setIsChangingPassword(false);
    }
  };


  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
            <SettingsIcon className="h-8 w-8" />
            Settings
          </h1>
          <p className="text-muted-foreground">
            Customize your experience and preferences
          </p>
        </div>

        <div className="space-y-6">
          {/* Theme Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>
                Choose how KnotX looks to you. Select a theme that works best for you.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {themeOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = theme === option.value;
                  
                  return (
                    <Button
                      key={option.value}
                      variant={isSelected ? "default" : "outline"}
                      className={`h-auto p-4 flex flex-col items-center gap-3 ${
                        isSelected 
                          ? "bg-primary text-primary-foreground" 
                          : "hover:bg-muted"
                      }`}
                      onClick={() => setTheme(option.value as "light" | "dark" | "system")}
                    >
                      <Icon className="h-6 w-6" />
                      <div className="text-center">
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs opacity-70 mt-1">
                          {option.description}
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
              
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Current theme:</strong> {theme === "system" ? "System (Auto)" : theme.charAt(0).toUpperCase() + theme.slice(1)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Password Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Password & Security
              </CardTitle>
              <CardDescription>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Change Password Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Change Password</h4>
                    <p className="text-sm text-muted-foreground">
                      Update your password by confirming your current one
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowChangePassword(!showChangePassword)}
                  >
                    {showChangePassword ? "Cancel" : "Change Password"}
                  </Button>
                </div>

                {showChangePassword && (
                  <form onSubmit={handleChangePassword} className="space-y-3 p-4 border rounded-lg">
                    <div>
                      <label className="text-sm font-medium">Current Password</label>
                      <div className="relative">
                        <input
                          type={showPasswords.old ? "text" : "password"}
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          className="w-full px-3 py-2 border rounded-md pr-10"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, old: !prev.old }))}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        >
                          {showPasswords.old ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">New Password</label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-3 py-2 border rounded-md pr-10"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        >
                          {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Confirm New Password</label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-3 py-2 border rounded-md pr-10"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        >
                          {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <Button type="submit" disabled={isChangingPassword} className="w-full">
                      {isChangingPassword ? "Changing..." : "Change Password"}
                    </Button>

                    {passwordMessage && (
                      <p className={`text-sm ${passwordMessage.includes("successfully") ? "text-green-600" : "text-red-600"}`}>
                        {passwordMessage}
                      </p>
                    )}
                  </form>
                )}
              </div>

            </CardContent>
          </Card>

          {/* Privacy Settings Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Privacy & Security</CardTitle>
              <CardDescription>
                Control your privacy settings and data preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Privacy controls will be available here in future updates.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
