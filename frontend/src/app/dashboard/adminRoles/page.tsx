"use client";
import Link from "next/link";
import { FolderPlus, FileEdit, ListChecks, FilePlus2, ClipboardEdit, ClipboardPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminRolesHome() {
  const {user} = useAuth();
  const cards = [
    {
      title: "Create Test Series",
      href: "/dashboard/adminRoles/test-series/create-test-series",
      icon: FolderPlus,
      description: "Add a new test series and set price/papers",
    },
    {
      title: "Update Test Series",
      href: "/dashboard/adminRoles/test-series/update-test-series",
      icon: ListChecks,
      description: "Filter, review and add papers to a series",
    },
    {
      title: "Create Paper",
      href: "/dashboard/adminRoles/papers/create-paper",
      icon: FilePlus2,
      description: "Create a paper and attach existing/new questions",
    },
    {
      title: "Update Paper",
      href: "/dashboard/adminRoles/papers/update-paper",
      icon: FileEdit,
      description: "Filter, review and add/remove questions",
    },
    {
      title: "Create Question",
      href: "/dashboard/adminRoles/questions/create-questions",
      icon: ClipboardPlus,
      description: "Add a new question with 4 options",
    },
    {
      title: "Update Question",
      href: "/dashboard/adminRoles/questions/update-questions",
      icon: ClipboardEdit,
      description: "Edit or delete existing questions by ID",
    },
  ];

  return (
    user?.role === "admin" ? (
      <div className="min-h-screen bg-zinc-950 text-white">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Admin Controls</h1>
          <p className="text-zinc-400 mb-8">Create and manage test series, papers, and questions.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map(({ title, href, icon: Icon, description }) => (
              <Link key={href} href={href} className="group">
                <div className="h-full bg-zinc-900 border border-zinc-800 rounded-lg p-5 hover:border-zinc-600 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-md bg-zinc-800 text-zinc-100">
                      <Icon size={20} />
                    </div>
                    <h2 className="text-xl font-semibold">{title}</h2>
                  </div>
                  <p className="text-zinc-400 text-sm">{description}</p>
                  <div className="mt-4 text-blue-400 text-sm">Open →</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    ) : (
      <div>only admins beyond this point</div>
    )
  );
}


