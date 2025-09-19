"use client";

import { useAuth } from "../../contexts/AuthContext";
import { useSubscription } from "../../contexts/SubscriptionContext";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  User,
  Mail,
  AtSign,
  Shield,
  Crown,
  FileText,
  Layers,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const {
    subscriptions,
    loading: subscriptionLoading,
    error: subscriptionError,
  } = useSubscription();

  const formatPrice = (price: number) => `₹${price}`;

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  // -------------------------
  // Loading & Error States
  // -------------------------
  if (subscriptionLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <LoadingSpinner size="lg" />
          <span className="text-white text-xl">Loading Dashboard...</span>
        </div>
      </div>
    );
  }

  if (subscriptionError) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-xl mb-4">
            Error loading subscriptions
          </p>
          <p className="text-gray-400">{subscriptionError}</p>
        </div>
      </div>
    );
  }

  // -------------------------
  // Main UI
  // -------------------------
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 py-12 shadow-lg">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-emerald-100">
            Welcome back, {user?.fullname || "User"}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 space-y-10">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow hover:border-emerald-500 transition">
            <Crown className="w-8 h-8 text-yellow-400 mb-2" />
            <h3 className="text-xl font-bold">
              {subscriptions?.subscriptions?.allAccess?.length || 0}
            </h3>
            <p className="text-gray-400">All-Access Plans</p>
          </div>
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow hover:border-emerald-500 transition">
            <FileText className="w-8 h-8 text-blue-400 mb-2" />
            <h3 className="text-xl font-bold">
              {subscriptions?.subscriptions?.singlePapers?.length || 0}
            </h3>
            <p className="text-gray-400">Individual Papers</p>
          </div>
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow hover:border-emerald-500 transition">
            <Layers className="w-8 h-8 text-purple-400 mb-2" />
            <h3 className="text-xl font-bold">
              {subscriptions?.subscriptions?.testSeries?.length || 0}
            </h3>
            <p className="text-gray-400">Test Series</p>
          </div>
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow hover:border-emerald-500 transition">
            {subscriptions?.hasAnySubscription ? (
              <CheckCircle2 className="w-8 h-8 text-green-400 mb-2" />
            ) : (
              <XCircle className="w-8 h-8 text-red-400 mb-2" />
            )}
            <h3 className="text-xl font-bold">
              {subscriptions?.hasAnySubscription ? "Active" : "Inactive"}
            </h3>
            <p className="text-gray-400">Subscription Status</p>
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 shadow-lg">
          <h2 className="text-2xl font-semibold mb-6">Account Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-gray-400 text-sm">Full Name</p>
                <p className="text-white text-lg">{user?.fullname}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-gray-400 text-sm">Email</p>
                <p className="text-white text-lg">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <AtSign className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-gray-400 text-sm">Username</p>
                <p className="text-white text-lg">@{user?.username}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-gray-400 text-sm">Role</p>
                <p className="text-white text-lg capitalize">{user?.role}</p>
              </div>
            </div>
          </div>

          {user?.role === "admin" && (
            <Link href="dashboard/adminRoles">
              <Button className="mt-6 bg-emerald-600 hover:bg-emerald-700">
                Admin Controls
              </Button>
            </Link>
          )}
        </div>

        {/* Subscription Details */}
        {subscriptions?.hasAnySubscription ? (
          <>
            {/* All Access */}
            {subscriptions?.subscriptions?.allAccess?.length > 0 && (
              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 shadow-lg">
                <h2 className="text-2xl font-semibold mb-4 flex items-center">
                  <Crown className="w-5 h-5 text-yellow-400 mr-2" />
                  All Access
                </h2>
                <div className="space-y-4">
                  {subscriptions.subscriptions.allAccess.map((subscription: any) => (
                    <div
                      key={subscription._id}
                      className="p-4 bg-gray-800 rounded-lg flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium text-green-400">All Access Plan</p>
                        <p className="text-sm text-gray-400">
                          Valid until {formatDate(subscription.endDate)}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-green-900/30 text-green-400 rounded-full text-sm font-medium">
                        Active
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Single Papers */}
            {subscriptions?.subscriptions?.singlePapers?.length > 0 && (
              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 shadow-lg">
                <h2 className="text-2xl font-semibold mb-4 flex items-center">
                  <FileText className="w-5 h-5 text-blue-400 mr-2" />
                  Individual Papers
                </h2>
                <div className="space-y-4">
                  {subscriptions.subscriptions.singlePapers.map((subscription: any) => {
                    const paper = subscription.itemId as any;
                    return (
                      <div
                        key={subscription._id}
                        className="p-4 bg-gray-800 rounded-lg flex justify-between items-center"
                      >
                        <div>
                          <p className="font-medium">{paper?.title || "Paper"}</p>
                          <p className="text-sm text-gray-400">
                            {paper?.subject && `${paper.subject} • `}
                            {paper?.price && `${formatPrice(paper.price)} • `}
                            Valid until {formatDate(subscription.endDate)}
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-blue-900/30 text-blue-400 rounded-full text-sm font-medium">
                          Active
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Test Series */}
            {subscriptions?.subscriptions?.testSeries?.length > 0 && (
              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 shadow-lg">
                <h2 className="text-2xl font-semibold mb-4 flex items-center">
                  <Layers className="w-5 h-5 text-purple-400 mr-2" />
                  Test Series
                </h2>
                <div className="space-y-4">
                  {subscriptions.subscriptions.testSeries.map((subscription: any) => {
                    const testSeries = subscription.itemId as any;
                    return (
                      <div
                        key={subscription._id}
                        className="p-4 bg-gray-800 rounded-lg flex justify-between items-center"
                      >
                        <div>
                          <p className="font-medium">
                            {testSeries?.title || "Test Series"}
                          </p>
                          <p className="text-sm text-gray-400">
                            {testSeries?.description && `${testSeries.description} • `}
                            {testSeries?.price && `${formatPrice(testSeries.price)} • `}
                            {testSeries?.papers &&
                              `${testSeries.papers.length} papers • `}
                            Valid until {formatDate(subscription.endDate)}
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-purple-900/30 text-purple-400 rounded-full text-sm font-medium">
                          Active
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          // No Subscription
          <div className="bg-gray-900 rounded-xl p-10 border border-gray-800 text-center shadow-lg">
            <XCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold mb-2">No Active Subscriptions</h3>
            <p className="text-gray-400 mb-6">
              You don’t have any active subscriptions. Purchase papers or test
              series to get started.
            </p>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              Browse Content
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
