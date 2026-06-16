"use client";

import { useState } from "react";
import { UploadCloud, Film } from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { uploadLecture, parseApiError } from "@/lib/adminCourses";

interface LectureUploadFormProps {
  courseId: string;
  sectionId?: string | null;
  sectionTitle?: string;
  defaultOrder?: number;
  onUploaded: () => void;
}

export default function LectureUploadForm({
  courseId,
  sectionId = null,
  sectionTitle,
  defaultOrder = 0,
  onUploaded,
}: LectureUploadFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [order, setOrder] = useState(defaultOrder);
  const [isPreviewFree, setIsPreviewFree] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  const submit = async () => {
    if (!title.trim()) {
      setMessage("Lecture title is required");
      setError(true);
      return;
    }
    if (!videoFile) {
      setMessage("Select a video file");
      setError(true);
      return;
    }

    setUploading(true);
    setProgress(0);
    setMessage("");
    setError(false);

    try {
      const fd = new FormData();
      fd.append("video", videoFile);
      fd.append("title", title.trim());
      fd.append("courseId", courseId);
      if (sectionId) fd.append("sectionId", sectionId);
      if (description.trim()) fd.append("description", description.trim());
      fd.append("order", String(order));
      fd.append("isPreviewFree", String(isPreviewFree));

      await uploadLecture(fd, setProgress);

      setTitle("");
      setDescription("");
      setVideoFile(null);
      setProgress(0);
      setMessage("Lecture uploaded — transcoding complete.");
      setError(false);
      onUploaded();
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      setMessage(parseApiError(err));
      setError(true);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
        <Film size={16} className="text-blue-400" />
        Upload lecture{sectionTitle ? ` · ${sectionTitle}` : " · No section"}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Title *</label>
          <input
            className="w-full bg-zinc-800 rounded p-2 text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Introduction to Air Navigation"
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Order</label>
          <input
            type="number"
            className="w-full bg-zinc-800 rounded p-2 text-sm"
            value={order}
            onChange={(e) => setOrder(parseInt(e.target.value || "0", 10))}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs text-zinc-400 mb-1">Description</label>
          <textarea
            className="w-full bg-zinc-800 rounded p-2 text-sm"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs text-zinc-400 mb-1">Video file *</label>
          <input
            type="file"
            accept="video/*"
            className="w-full text-sm text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-zinc-700 file:text-zinc-200"
            onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
          />
          {videoFile && (
            <p className="text-xs text-zinc-500 mt-1">
              {videoFile.name} · {(videoFile.size / (1024 * 1024)).toFixed(1)} MB
            </p>
          )}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-zinc-300">
        <input
          type="checkbox"
          checked={isPreviewFree}
          onChange={(e) => setIsPreviewFree(e.target.checked)}
          className="rounded"
        />
        Free preview (no subscription required)
      </label>

      {uploading && (
        <div className="space-y-1">
          <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-zinc-400">
            Uploading & transcoding… {progress > 0 ? `${progress}%` : "please wait"}
          </p>
        </div>
      )}

      <button
        type="button"
        disabled={uploading}
        onClick={submit}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded text-sm font-medium ${
          uploading ? "bg-blue-500/50 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {uploading ? <LoadingSpinner size="sm" /> : <UploadCloud size={16} />}
        {uploading ? "Processing video…" : "Upload lecture"}
      </button>

      {message && (
        <p className={`text-sm ${error ? "text-red-400" : "text-green-400"}`}>{message}</p>
      )}
    </div>
  );
}
