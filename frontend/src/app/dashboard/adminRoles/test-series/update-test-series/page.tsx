"use client";
import { useEffect, useMemo, useState } from "react";
import { Save, UploadCloud, Filter, Trash2, CheckCircle, AlertTriangle } from "lucide-react";
import apiClient from "@/lib/api";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/contexts/AuthContext";

type Series = { _id?: string; id?: string; title: string; description?: string; price?: number; papers?: any[] };
type PaperLite = { _id?: string; id?: string; title: string; subject?: string; price?: number; createdAt?: string; savedAt?: string };

export default function UpdateTestSeriesPage() {
  const [selected, setSelected] = useState<Series | null>(null);
  const [filterSeries, setFilterSeries] = useState("");
  const [filterPapers, setFilterPapers] = useState("");
  const [domainFilter, setDomainFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "title">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [serverSeries, setServerSeries] = useState<Series[]>([]);
  const [serverPapers, setServerPapers] = useState<PaperLite[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");
  const [deleteMessage, setDeleteMessage] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [seriesToDelete, setSeriesToDelete] = useState<Series | null>(null);

  const localSeries: Series[] = useMemo(() => {
    if (typeof window === "undefined") return [];
    return JSON.parse(localStorage.getItem("local_series") || "[]");
  }, []);
  const localPapers: PaperLite[] = useMemo(() => {
    if (typeof window === "undefined") return [];
    return JSON.parse(localStorage.getItem("local_papers") || "[]");
  }, []);

  useEffect(() => {
    const loadLists = async () => {
      try {
        const [papersRes, seriesRes] = await Promise.all([
          apiClient.get("/private/papers"), // Now using private route with questions
          apiClient.get("/private/test-series"), // Now using private route with papers
        ]);
        setServerPapers((papersRes.data?.data || papersRes.data || []) as PaperLite[]);
        setServerSeries((seriesRes.data?.data || seriesRes.data || []) as Series[]);
      } catch (e) {
        console.error("Error loading data:", e);
        setServerPapers([]);
        setServerSeries([]);
      }
    };
    loadLists();
  }, []);

  const mergedSeries = useMemo(() => {
    const map = new Map<string, Series>();
    for (const s of localSeries) map.set((s._id as any) || (s.id as any), s);
    for (const s of serverSeries) map.set((s._id as any) || (s.id as any), s);
    return Array.from(map.values());
  }, [localSeries, serverSeries]);

  const mergedPapers = useMemo(() => {
    const map = new Map<string, PaperLite>();
    for (const p of localPapers) map.set((p._id as any) || (p.id as any), p);
    for (const p of serverPapers) map.set((p._id as any) || (p.id as any), p);
    return Array.from(map.values());
  }, [localPapers, serverPapers]);

  const addPaper = (p: PaperLite) => {
    if (!selected) return;
    if (selected.papers?.some((x: any) => (x._id && x._id === p._id) || (x.id && x.id === p.id))) return;
    setSelected({ ...selected, papers: [...(selected.papers || []), p] });
  };

  const removePaper = (pid?: string) => {
    if (!selected) return;
    setSelected({ ...selected, papers: (selected.papers || []).filter((p: any) => p._id !== pid) });
  };

  const saveLocal = async () => {
    if (!selected) return;
    setIsSaving(true);
    setSaveMessage("");
    
    try {
      const list = JSON.parse(localStorage.getItem("local_series") || "[]");
      const idx = list.findIndex((s: any) => s._id === selected._id || s.id === (selected as any).id);
      if (idx >= 0) list[idx] = selected; else list.unshift(selected);
      localStorage.setItem("local_series", JSON.stringify(list));
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
    if (!selected?._id) return;
    
    setIsUploading(true);
    setUploadMessage("");
    
    try {
      // Get the original papers from server to compare
      const originalRes = await apiClient.get(`/admin/test-series/${selected._id}`);
      const originalSeries = originalRes.data?.data || originalRes.data;
      const originalPaperIds = (originalSeries?.papers || []).map((p: any) => p._id);
      
      // Get current desired paper IDs
      const currentPaperIds = (selected.papers || []).map((p: any) => p._id).filter(Boolean);
      
      // Find papers to add (in current but not in original)
      const papersToAdd = currentPaperIds.filter((id: string) => !originalPaperIds.includes(id));
      
      // Find papers to remove (in original but not in current)
      const papersToRemove = originalPaperIds.filter((id: string) => !currentPaperIds.includes(id));
      
      console.log("Original papers:", originalPaperIds);
      console.log("Current papers:", currentPaperIds);
      console.log("Papers to add:", papersToAdd);
      console.log("Papers to remove:", papersToRemove);
      
      // Add new papers
      for (const paperId of papersToAdd) {
        await apiClient.post(`/admin/test-series/${selected._id}/add-paper`, { paperId });
      }
      
      // Remove papers
      for (const paperId of papersToRemove) {
        await apiClient.post(`/admin/test-series/${selected._id}/remove-paper`, { paperId });
      }
      
      setUploadMessage("Test series updated successfully!");
      
      // Refresh the series data to get updated state
      const seriesRes = await apiClient.get("/private/test-series");
      setServerSeries((seriesRes.data?.data || seriesRes.data || []) as Series[]);
      
      setTimeout(() => setUploadMessage(""), 3000);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadMessage("Error updating test series. Please try again.");
      setTimeout(() => setUploadMessage(""), 3000);
    } finally {
      setIsUploading(false);
    }
  };

  const deleteSeries = async () => {
    if (!seriesToDelete?._id) return;
    
    setIsDeleting(true);
    setDeleteMessage("");
    
    try {
      await apiClient.delete(`/admin/test-series/${seriesToDelete._id}`);
      setDeleteMessage("Test series deleted successfully!");
      
      // Clear selection and close dialog immediately
      setSelected(null);
      setShowDeleteConfirm(false);
      setSeriesToDelete(null);
      
      // Refresh server series list
      const seriesRes = await apiClient.get("/private/test-series");
      setServerSeries((seriesRes.data?.data || seriesRes.data || []) as Series[]);
      
      setTimeout(() => setDeleteMessage(""), 3000);
    } catch (error) {
      console.error("Delete error:", error);
      setDeleteMessage("Error deleting test series. Please try again.");
      setTimeout(() => setDeleteMessage(""), 3000);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredSeries = mergedSeries.filter((s) => (s.title || "").toLowerCase().includes(filterSeries.toLowerCase()));
  
  const filteredPapers = useMemo(() => {
    let filtered = mergedPapers.filter((p) => (p.title || "").toLowerCase().includes(filterPapers.toLowerCase()));
    
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
  }, [mergedPapers, filterPapers, domainFilter, sortBy, sortOrder]);

  const {user} = useAuth()

  return (
    user?.role === "admin" ? (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="container mx-auto px-4 py-8 grid gap-6 lg:grid-cols-3">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={16} className="text-zinc-400" />
            <input className="flex-1 bg-zinc-800 rounded p-2" placeholder="Filter series..." value={filterSeries} onChange={(e) => setFilterSeries(e.target.value)} />
          </div>
          <div className="max-h-96 overflow-auto space-y-2">
            {filteredSeries.map((s) => (
              <div key={s._id || s.id} className={`p-3 rounded border ${selected?._id === s._id ? "border-blue-500" : "border-zinc-700"} bg-zinc-800`}>
                <button 
                  onClick={() => setSelected(s)} 
                  className="w-full text-left"
                >
                  <div className="text-sm font-medium">{s.title}</div>
                  <div className="text-xs text-zinc-500">{s.price ? `₹${s.price}` : ""}</div>
                </button>
                {s._id && (
                  <button
                    onClick={() => {
                      setSeriesToDelete(s);
                      setShowDeleteConfirm(true);
                    }}
                    className="mt-2 text-red-400 hover:text-red-300 text-xs inline-flex items-center gap-1"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          {!selected ? (
            <div className="text-zinc-500">Select a test series to update.</div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Title</label>
                  <input className="w-full bg-zinc-800 rounded p-2" value={selected.title} onChange={(e) => setSelected({ ...selected, title: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Price</label>
                  <input type="number" className="w-full bg-zinc-800 rounded p-2" value={selected.price || 0} onChange={(e) => setSelected({ ...selected, price: parseFloat(e.target.value || "0") })} />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-sm text-zinc-400 mb-1">Description</label>
                  <textarea className="w-full bg-zinc-800 rounded p-3" rows={3} value={selected.description || ""} onChange={(e) => setSelected({ ...selected, description: e.target.value })} />
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-2">Papers</h2>
                <div className="space-y-2">
                  {(selected.papers || []).map((p: any) => (
                    <div key={p._id || p.id} className="p-3 bg-zinc-800 border border-zinc-700 rounded flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{p.title}</div>
                        <div className="text-xs text-zinc-500">{p.subject} {p.price ? `• ₹${p.price}` : ""}</div>
                      </div>
                      <button className="text-red-400 text-sm inline-flex items-center gap-1" onClick={() => removePaper(p._id)}>
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                  ))}
                  {(selected.papers || []).length === 0 && <div className="text-sm text-zinc-500">No papers</div>}
                </div>
              </div>

              <div className="flex flex-col gap-3">
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
                    disabled={isUploading || !selected?._id}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed px-4 py-2 rounded"
                  >
                    {isUploading ? <LoadingSpinner size="sm" /> : <UploadCloud size={16} />} 
                    {isUploading ? "Updating..." : "Save & upload"}
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
                
                {deleteMessage && (
                  <div className={`flex items-center gap-2 text-sm p-2 rounded ${
                    deleteMessage.includes("successfully") 
                      ? "bg-green-900/20 text-green-400 border border-green-800" 
                      : "bg-red-900/20 text-red-400 border border-red-800"
                  }`}>
                    <CheckCircle size={16} />
                    {deleteMessage}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-3 grid md:grid-cols-2 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter size={16} className="text-zinc-400" />
              <input className="flex-1 bg-zinc-800 rounded p-2" placeholder="Filter papers..." value={filterPapers} onChange={(e) => setFilterPapers(e.target.value)} />
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
            <div className="max-h-64 overflow-auto space-y-2">
              {filteredPapers.map((p) => (
                <button key={p._id || p.id} onClick={() => addPaper(p)} className="w-full text-left p-3 rounded border border-zinc-700 bg-zinc-800">
                  <div className="text-sm font-medium">{p.title}</div>
                  <div className="text-xs text-zinc-500">{p.subject} {p.price ? `• ₹${p.price}` : ""}</div>
                </button>
              ))}
              {filteredPapers.length === 0 && <div className="text-sm text-zinc-500">No papers found</div>}
            </div>
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="text-red-400" size={24} />
              <h3 className="text-lg font-semibold text-white">Delete Test Series</h3>
            </div>
            <p className="text-zinc-300 mb-6">
              Are you sure you want to delete "{seriesToDelete?.title}"? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSeriesToDelete(null);
                }}
                className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={deleteSeries}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-500 disabled:cursor-not-allowed text-white rounded inline-flex items-center gap-2"
              >
                {isDeleting ? <LoadingSpinner size="sm" /> : <Trash2 size={16} />}
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    ):(<div>Admin only page</div>)
  );
}


