"use client";

import { useRef, useState } from "react";
import { ImageIcon, UploadCloud } from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface ThumbnailUploadProps {
  label: string;
  currentUrl?: string;
  onUpload: (file: File) => Promise<void>;
  compact?: boolean;
}

export default function ThumbnailUpload({
  label,
  currentUrl,
  onUpload,
  compact = false,
}: ThumbnailUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const displayUrl = preview || currentUrl;

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setMessage("Please select an image file.");
      return;
    }
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    setMessage("");
    try {
      await onUpload(file);
      setMessage("Thumbnail uploaded.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Upload failed");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-16 h-10 rounded overflow-hidden bg-zinc-900 border border-zinc-700 flex-shrink-0">
          {displayUrl ? (
            <img src={displayUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon size={14} className="text-zinc-600" />
            </div>
          )}
        </div>
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="text-xs px-2 py-1 rounded border border-zinc-600 hover:border-zinc-500 disabled:opacity-50"
        >
          {uploading ? "…" : "Thumbnail"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-zinc-300">{label}</p>
      <div
        className={`relative rounded-lg overflow-hidden border border-zinc-700 bg-zinc-800 ${
          compact ? "aspect-video max-w-xs" : "aspect-video max-w-md"
        }`}
      >
        {displayUrl ? (
          <img src={displayUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 gap-2">
            <ImageIcon size={28} />
            <span className="text-xs">No thumbnail</span>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <LoadingSpinner size="md" />
          </div>
        )}
      </div>
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded border border-zinc-600 hover:bg-zinc-800 disabled:opacity-50"
      >
        <UploadCloud size={16} />
        {uploading ? "Uploading…" : displayUrl ? "Replace thumbnail" : "Upload thumbnail"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      {message && (
        <p className={`text-xs ${message.includes("failed") || message.includes("Please") ? "text-red-400" : "text-green-400"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
