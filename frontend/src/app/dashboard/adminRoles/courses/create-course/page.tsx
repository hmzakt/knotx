"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Save, UploadCloud, CheckCircle, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import {
  createCourse,
  parseApiError,
  parseLines,
  type CourseLevel,
  type CreateCoursePayload,
} from "@/lib/adminCourses";

const LEVELS: CourseLevel[] = ["beginner", "intermediate", "advanced"];

export default function CreateCoursePage() {
  const { user } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [isFree, setIsFree] = useState(false);
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [level, setLevel] = useState<CourseLevel>("beginner");
  const [language, setLanguage] = useState("English");
  const [requirements, setRequirements] = useState("");
  const [learningOutcomes, setLearningOutcomes] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const buildPayload = (): CreateCoursePayload => ({
    title: title.trim(),
    description: description.trim(),
    shortDescription: shortDescription.trim() || undefined,
    price: isFree ? 0 : price,
    isFree: isFree || price === 0,
    category: category.trim() || undefined,
    tags: tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    level,
    language: language.trim() || "English",
    requirements: parseLines(requirements),
    learningOutcomes: parseLines(learningOutcomes),
  });

  const saveLocal = () => {
    const entry = {
      id: crypto.randomUUID(),
      ...buildPayload(),
      savedAt: new Date().toISOString(),
    };
    const list = JSON.parse(localStorage.getItem("local_courses") || "[]");
    localStorage.setItem("local_courses", JSON.stringify([entry, ...list]));
    setMessage("Course draft saved locally.");
    setIsError(false);
    setTimeout(() => setMessage(""), 3000);
  };

  const upload = async () => {
    if (!title.trim() || !description.trim()) {
      setMessage("Title and description are required.");
      setIsError(true);
      return;
    }

    setIsSaving(true);
    setMessage("");
    setIsError(false);

    try {
      const course = await createCourse(buildPayload());
      setMessage("Course created! Redirecting to manage sections & lectures…");
      setIsError(false);
      setTimeout(() => {
        router.push(`/dashboard/adminRoles/courses/update-course?id=${course._id}`);
      }, 800);
    } catch (err) {
      setMessage(parseApiError(err));
      setIsError(true);
    } finally {
      setIsSaving(false);
    }
  };

  if (user?.role !== "admin") {
    return <div className="min-h-screen bg-zinc-950 text-white p-8">Only admins beyond this point.</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link
          href="/dashboard/adminRoles"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white mb-6"
        >
          <ArrowLeft size={16} /> Admin Controls
        </Link>

        <h1 className="text-2xl font-bold mb-1">Create Video Course</h1>
        <p className="text-zinc-400 text-sm mb-8">
          Set up course metadata first. After creation, add sections and upload lectures on the update page.
        </p>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm text-zinc-400 mb-1">Title *</label>
              <input
                className="w-full bg-zinc-800 rounded p-2"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="DGCA Air Navigation — Complete Course"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-zinc-400 mb-1">Short description</label>
              <input
                className="w-full bg-zinc-800 rounded p-2"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="One-line summary for course cards"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-zinc-400 mb-1">Full description *</label>
              <textarea
                className="w-full bg-zinc-800 rounded p-3"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Price (₹)</label>
              <input
                type="number"
                className="w-full bg-zinc-800 rounded p-2"
                value={price}
                disabled={isFree}
                onChange={(e) => setPrice(parseFloat(e.target.value || "0"))}
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} />
                Free course
              </label>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Category</label>
              <input
                className="w-full bg-zinc-800 rounded p-2"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Air Navigation"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Level</label>
              <select
                className="w-full bg-zinc-800 rounded p-2"
                value={level}
                onChange={(e) => setLevel(e.target.value as CourseLevel)}
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l.charAt(0).toUpperCase() + l.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Language</label>
              <input
                className="w-full bg-zinc-800 rounded p-2"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Tags (comma-separated)</label>
              <input
                className="w-full bg-zinc-800 rounded p-2"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="DGCA, CPL, Navigation"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Requirements (one per line)</label>
              <textarea
                className="w-full bg-zinc-800 rounded p-2 text-sm"
                rows={3}
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Learning outcomes (one per line)</label>
              <textarea
                className="w-full bg-zinc-800 rounded p-2 text-sm"
                rows={3}
                value={learningOutcomes}
                onChange={(e) => setLearningOutcomes(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={saveLocal}
              className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-4 py-2 rounded"
            >
              <Save size={16} /> Save locally
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={upload}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded ${
                isSaving ? "bg-blue-500/50 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isSaving ? <LoadingSpinner size="sm" /> : <UploadCloud size={16} />}
              {isSaving ? "Creating…" : "Create course"}
            </button>
          </div>

          {message && (
            <div
              className={`flex items-center gap-2 text-sm p-3 rounded border ${
                isError
                  ? "border-red-800 bg-red-950/40 text-red-300"
                  : "border-green-800 bg-green-950/40 text-green-300"
              }`}
            >
              {!isError && <CheckCircle size={16} />}
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
