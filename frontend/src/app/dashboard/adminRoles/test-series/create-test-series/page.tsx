"use client";
import { useEffect, useMemo, useState } from "react";
import { Save, UploadCloud, Filter, CheckCircle } from "lucide-react";
import apiClient from "@/lib/api";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/contexts/AuthContext";

type PaperLite = { _id?: string; id?: string; title: string; subject?: string; price?: number; createdAt?: string; savedAt?: string };

export default function CreateTestSeriesPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [papers, setPapers] = useState<PaperLite[]>([]);
  const [filter, setFilter] = useState("");
  const [domainFilter, setDomainFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "title">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [serverPapers, setServerPapers] = useState<PaperLite[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");

  const localPapers: PaperLite[] = useMemo(() => {
    if (typeof window === "undefined") return [];
    return JSON.parse(localStorage.getItem("local_papers") || "[]");
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get("/private/papers"); // Now using private route with questions
        const papersData = (res.data?.data || res.data || []) as PaperLite[];
        console.log("Fetched server papers:", papersData);
        setServerPapers(papersData);
      } catch (e) {
        console.error("Error fetching papers:", e);
        setServerPapers([]);
      }
    };
    load();
  }, []);

  const mergedPapers = useMemo(() => {
    const map = new Map<string, PaperLite>();
    for (const p of localPapers) map.set((p._id as any) || (p.id as any), p);
    for (const p of serverPapers) map.set((p._id as any) || (p.id as any), p);
    const merged = Array.from(map.values());
    console.log("Merged papers:", merged);
    return merged;
  }, [localPapers, serverPapers]);

  const addPaper = (p: PaperLite) => {
    console.log("Adding paper:", p);
    if (papers.some((x) => (x._id && x._id === p._id) || (x.id && x.id === p.id))) {
      console.log("Paper already exists, skipping");
      return;
    }
    setPapers((prev) => {
      const newPapers = [...prev, p];
      console.log("Updated papers list:", newPapers);
      return newPapers;
    });
  };

  const removePaper = (pid?: string) => {
    setPapers((prev) => prev.filter((p) => p._id !== pid));
  };

  const saveLocal = async () => {
    setIsSaving(true);
    setSaveMessage("");
    
    try {
      const entry = { id: crypto.randomUUID(), title, description, price, papers, savedAt: new Date().toISOString() };
      const list = JSON.parse(localStorage.getItem("local_series") || "[]");
      localStorage.setItem("local_series", JSON.stringify([entry, ...list]));
      setSaveMessage("Test series saved locally successfully!");
      
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
      setSaveMessage("Error saving test series locally");
      setTimeout(() => setSaveMessage(""), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const upload = async () => {
    if (!title.trim()) return;
    if (!price || price <= 0) return;
    
    setIsUploading(true);
    setUploadMessage("");
    
    try {
      // Only include papers that have _id (server papers) - local papers can't be added to server series
      const paperIds = papers.map((p) => p._id).filter(Boolean);
      
      console.log("Selected papers:", papers);
      console.log("Paper IDs to send:", paperIds);
      
      if (paperIds.length === 0 && papers.length > 0) {
        setUploadMessage("Warning: Only server papers can be added to test series. Upload papers first.");
        setTimeout(() => setUploadMessage(""), 5000);
        return;
      }
      
      const payload = { title, description, price, papers: paperIds };
      console.log("Sending payload:", payload);
      
      await apiClient.post("/admin/test-series", payload);
      setUploadMessage("Test series uploaded successfully!");
      
      // Clear form after successful upload
      setTitle("");
      setDescription("");
      setPrice(0);
      setPapers([]);
      
      setTimeout(() => setUploadMessage(""), 3000);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadMessage("Error uploading test series. Please try again.");
      setTimeout(() => setUploadMessage(""), 3000);
    } finally {
      setIsUploading(false);
    }
  };

  const available = useMemo(() => {
    let filtered = mergedPapers.filter((p) => (p.title || "").toLowerCase().includes(filter.toLowerCase()));
    
    // Filter by domain (subject)
    if (domainFilter !== "all") {
      filtered = filtered.filter((p) => p.subject === domainFilter);
    }
    
    // Sort papers
    filtered.sort((a, b) => {
      if (sortBy === "date") {
        const dateA = new Date(a.createdAt || a.savedAt || 0).getTime();
        const dateB = new Date(b.createdAt || b.savedAt || 0).getTime();
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
      } else {
        const titleA = (a.title || "").toLowerCase();
        const titleB = (b.title || "").toLowerCase();
        return sortOrder === "desc" ? titleB.localeCompare(titleA) : titleA.localeCompare(titleB);
      }
    });
    
    return filtered;
  }, [mergedPapers, filter, domainFilter, sortBy, sortOrder]);

  const {user} = useAuth();

  return (
    user?.role === "admin" ? (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="container mx-auto px-4 py-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          <h1 className="text-2xl font-bold mb-4">Create Test Series</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Title</label>
              <input className="w-full bg-zinc-800 rounded p-2" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Price</label>
              <input type="number" className="w-full bg-zinc-800 rounded p-2" value={price} onChange={(e) => setPrice(parseFloat(e.target.value || "0"))} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-zinc-400 mb-1">Description</label>
              <textarea className="w-full bg-zinc-800 rounded p-3" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Selected Papers ({papers.length})</h2>
            <div className="space-y-2">
              {papers.map((p, index) => (
                <div key={p._id || p.id} className="p-3 bg-zinc-800 border border-zinc-700 rounded flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{p.title}</div>
                      <div className="text-xs text-zinc-500">{p.subject} {p.price ? `• ₹${p.price}` : ""}</div>
                      <div className="text-xs mt-1">
                        {p._id ? (
                          <span className="text-green-400">✓ Server paper</span>
                        ) : (
                          <span className="text-yellow-400">⚠ Local only</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button className="text-red-400 text-sm ml-2" onClick={() => removePaper(p._id)}>Remove</button>
                </div>
              ))}
              {papers.length === 0 && <div className="text-sm text-zinc-500">No papers selected</div>}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <button 
                onClick={saveLocal} 
                disabled={isSaving}
                className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-700 disabled:cursor-not-allowed border border-zinc-700 px-4 py-2 rounded"
              >
                {isSaving ? <LoadingSpinner size="sm" /> : <Save size={16} />} 
                {isSaving ? "Saving..." : "Save locally"}
              </button>
              <button 
                onClick={upload} 
                disabled={isUploading || !title.trim() || !price || price <= 0}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed px-4 py-2 rounded"
              >
                {isUploading ? <LoadingSpinner size="sm" /> : <UploadCloud size={16} />} 
                {isUploading ? "Uploading..." : "Save & upload"}
              </button>
            </div>
            
            {/* Success/Error Messages */}
            {saveMessage && (
              <div className={`flex items-center gap-2 text-sm p-2 rounded ${
                saveMessage.includes("successfully") 
                  ? "bg-green-900/20 text-green-400 border border-green-800" 
                  : "bg-red-900/20 text-red-400 border border-red-800"
              }`}>
                <CheckCircle size={16} />
                {saveMessage}
              </div>
            )}
            
            {uploadMessage && (
              <div className={`flex items-center gap-2 text-sm p-2 rounded ${
                uploadMessage.includes("successfully") 
                  ? "bg-green-900/20 text-green-400 border border-green-800" 
                  : "bg-red-900/20 text-red-400 border border-red-800"
              }`}>
                <CheckCircle size={16} />
                {uploadMessage}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter size={16} className="text-zinc-400" />
              <input className="flex-1 bg-zinc-800 rounded p-2" placeholder="Filter papers..." value={filter} onChange={(e) => setFilter(e.target.value)} />
            </div>
            
            {/* Domain Filter */}
            <div className="mb-3">
              <select className="w-full bg-zinc-800 rounded p-2" value={domainFilter} onChange={(e) => setDomainFilter(e.target.value)}>
                <option value="all">All subjects</option>
                {Array.from(new Set(mergedPapers.map((p) => (p.subject || "").trim()).filter(Boolean))).map((subject) => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>
            
            {/* Sort Controls */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <select className="bg-zinc-800 rounded p-2" value={sortBy} onChange={(e) => setSortBy(e.target.value as "date" | "title")}>
                <option value="date">Sort by date</option>
                <option value="title">Sort by title</option>
              </select>
              <select className="bg-zinc-800 rounded p-2" value={sortOrder} onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}>
                <option value="desc">Newest first</option>
                <option value="asc">Oldest first</option>
              </select>
            </div>
            <div className="max-h-96 overflow-auto space-y-2">
              {available.map((p) => (
                <button key={p._id || p.id} onClick={() => addPaper(p)} className="w-full text-left p-3 rounded border border-zinc-700 bg-zinc-800">
                  <div className="text-sm font-medium">{p.title}</div>
                  <div className="text-xs text-zinc-500">{p.subject} {p.price ? `• ₹${p.price}` : ""}</div>
                  <div className="text-xs mt-1">
                    {p._id ? (
                      <span className="text-green-400">✓ Server paper</span>
                    ) : (
                      <span className="text-yellow-400">⚠ Local only</span>
                    )}
                  </div>
                </button>
              ))}
              {available.length === 0 && <div className="text-sm text-zinc-500">No papers found</div>}
            </div>
            <div className="mt-3 text-xs text-zinc-500">
              <div>Tip: Create papers first, then add here.</div>
              <div className="mt-1">
                <span className="text-green-400">✓ Server papers</span> can be uploaded • 
                <span className="text-yellow-400"> ⚠ Local papers</span> saved locally only
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    ):(<div>Only admins beyond this point</div>)
  );
}


