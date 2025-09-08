"use client";
import { useEffect, useMemo, useState } from "react";
import { Save, UploadCloud, Filter, Plus, Trash2 } from "lucide-react";
import apiClient from "@/lib/api";

type Series = { _id?: string; id?: string; title: string; description?: string; price?: number; papers?: any[] };
type PaperLite = { _id?: string; id?: string; title: string; subject?: string; price?: number };

export default function UpdateTestSeriesPage() {
  const [selected, setSelected] = useState<Series | null>(null);
  const [filterSeries, setFilterSeries] = useState("");
  const [filterPapers, setFilterPapers] = useState("");
  const [serverSeries, setServerSeries] = useState<Series[]>([]);
  const [serverPapers, setServerPapers] = useState<PaperLite[]>([]);

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
          apiClient.get("/public/papers"),
          apiClient.get("/public/test-series"),
        ]);
        setServerPapers((papersRes.data?.data || papersRes.data || []) as PaperLite[]);
        setServerSeries((seriesRes.data?.data || seriesRes.data || []) as Series[]);
      } catch (e) {
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

  const saveLocal = () => {
    if (!selected) return;
    const list = JSON.parse(localStorage.getItem("local_series") || "[]");
    const idx = list.findIndex((s: any) => s._id === selected._id || s.id === (selected as any).id);
    if (idx >= 0) list[idx] = selected; else list.unshift(selected);
    localStorage.setItem("local_series", JSON.stringify(list));
  };

  const upload = async () => {
    if (!selected?._id) return;
    // add paper to test-series endpoint exists per-paper
    // Here we push any papers with _id via /admin/test-series/:id/add-paper
    const ids = (selected.papers || []).map((p: any) => p._id).filter(Boolean);
    for (const pid of ids) {
      await apiClient.post(`/admin/test-series/${selected._id}/add-paper`, { paperId: pid });
    }
  };

  const filteredSeries = mergedSeries.filter((s) => (s.title || "").toLowerCase().includes(filterSeries.toLowerCase()));
  const filteredPapers = mergedPapers.filter((p) => (p.title || "").toLowerCase().includes(filterPapers.toLowerCase()));

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="container mx-auto px-4 py-8 grid gap-6 lg:grid-cols-3">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={16} className="text-zinc-400" />
            <input className="flex-1 bg-zinc-800 rounded p-2" placeholder="Filter series..." value={filterSeries} onChange={(e) => setFilterSeries(e.target.value)} />
          </div>
          <div className="max-h-96 overflow-auto space-y-2">
            {filteredSeries.map((s) => (
              <button key={s._id || s.id} onClick={() => setSelected(s)} className={`w-full text-left p-3 rounded border ${selected?._id === s._id ? "border-blue-500" : "border-zinc-700"} bg-zinc-800`}>
                <div className="text-sm font-medium">{s.title}</div>
                <div className="text-xs text-zinc-500">{s.price ? `₹${s.price}` : ""}</div>
              </button>
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

              <div className="flex items-center gap-3">
                <button onClick={saveLocal} className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-4 py-2 rounded">
                  <Save size={16} /> Save locally
                </button>
                <button onClick={upload} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
                  <UploadCloud size={16} /> Save & upload
                </button>
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
    </div>
  );
}


