"use client";
import { useEffect, useMemo, useState } from "react";
import { Save, UploadCloud, Filter } from "lucide-react";
import apiClient from "@/lib/api";

type PaperLite = { _id?: string; id?: string; title: string; subject?: string; price?: number };

export default function CreateTestSeriesPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [papers, setPapers] = useState<PaperLite[]>([]);
  const [filter, setFilter] = useState("");
  const [serverPapers, setServerPapers] = useState<PaperLite[]>([]);

  const localPapers: PaperLite[] = useMemo(() => {
    if (typeof window === "undefined") return [];
    return JSON.parse(localStorage.getItem("local_papers") || "[]");
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get("/public/papers");
        setServerPapers((res.data?.data || res.data || []) as PaperLite[]);
      } catch (e) {
        setServerPapers([]);
      }
    };
    load();
  }, []);

  const mergedPapers = useMemo(() => {
    const map = new Map<string, PaperLite>();
    for (const p of localPapers) map.set((p._id as any) || (p.id as any), p);
    for (const p of serverPapers) map.set((p._id as any) || (p.id as any), p);
    return Array.from(map.values());
  }, [localPapers, serverPapers]);

  const addPaper = (p: PaperLite) => {
    if (papers.some((x) => (x._id && x._id === p._id) || (x.id && x.id === p.id))) return;
    setPapers((prev) => [...prev, p]);
  };

  const removePaper = (pid?: string) => {
    setPapers((prev) => prev.filter((p) => p._id !== pid));
  };

  const saveLocal = () => {
    const entry = { id: crypto.randomUUID(), title, description, price, papers };
    const list = JSON.parse(localStorage.getItem("local_series") || "[]");
    localStorage.setItem("local_series", JSON.stringify([entry, ...list]));
  };

  const upload = async () => {
    if (!title.trim()) return;
    if (!price || price <= 0) return;
    const paperIds = papers.map((p) => p._id).filter(Boolean);
    await apiClient.post("/admin/test-series", { title, description, price, papers: paperIds });
  };

  const available = mergedPapers.filter((p) => (p.title || "").toLowerCase().includes(filter.toLowerCase()));

  return (
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
            <h2 className="text-lg font-semibold mb-2">Selected Papers</h2>
            <div className="space-y-2">
              {papers.map((p) => (
                <div key={p._id || p.id} className="p-3 bg-zinc-800 border border-zinc-700 rounded flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{p.title}</div>
                    <div className="text-xs text-zinc-500">{p.subject} {p.price ? `• ₹${p.price}` : ""}</div>
                  </div>
                  <button className="text-red-400 text-sm" onClick={() => removePaper(p._id)}>Remove</button>
                </div>
              ))}
              {papers.length === 0 && <div className="text-sm text-zinc-500">No papers selected</div>}
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button onClick={saveLocal} className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-4 py-2 rounded">
              <Save size={16} /> Save locally
            </button>
            <button onClick={upload} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
              <UploadCloud size={16} /> Save & upload
            </button>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter size={16} className="text-zinc-400" />
              <input className="flex-1 bg-zinc-800 rounded p-2" placeholder="Filter papers..." value={filter} onChange={(e) => setFilter(e.target.value)} />
            </div>
            <div className="max-h-96 overflow-auto space-y-2">
              {available.map((p) => (
                <button key={p._id || p.id} onClick={() => addPaper(p)} className="w-full text-left p-3 rounded border border-zinc-700 bg-zinc-800">
                  <div className="text-sm font-medium">{p.title}</div>
                  <div className="text-xs text-zinc-500">{p.subject} {p.price ? `• ₹${p.price}` : ""}</div>
                </button>
              ))}
              {available.length === 0 && <div className="text-sm text-zinc-500">No papers found</div>}
            </div>
            <div className="mt-3 text-xs text-zinc-500">Tip: Create papers first, then add here.</div>
          </div>
        </div>
      </div>
    </div>
  );
}


