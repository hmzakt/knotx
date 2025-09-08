"use client";
import {useEffect, useMemo, useState } from "react";

import { Save, UploadCloud, Filter, Plus, Trash2 } from "lucide-react";
import { useContent } from "@/hooks/useContent";
import apiClient from "@/lib/api";
type Paper = { _id: string; title: string; subject: string; price: number };
type QuestionLite = { _id?: string; id?: string; text: string; difficulty?: string; domain?: string };

export default function UpdatePaperPage() {
  const { papers } = useContent();
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [questions, setQuestions] = useState<QuestionLite[]>([]);
  const [filterPaper, setFilterPaper] = useState("");
  const [filterLocal, setFilterLocal] = useState("");
  const [serverQuestions, setServerQuestions] = useState<QuestionLite[]>([]);
  const [difficulty, setDifficulty] = useState<string>("all");
  const [topic, setTopic] = useState<string>("all");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [loadingPaper, setLoadingPaper] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const localQuestions: QuestionLite[] = useMemo(() => {
    if (typeof window === "undefined") return [];
    return JSON.parse(localStorage.getItem("local_questions") || "[]");
  }, []);

  // Load selected paper details including its questions from server
  useEffect(() => {
    const fetchDetails = async () => {
      if (!selectedPaper?._id) return;
      setLoadingPaper(true);
      setStatus(null);
      try {
        const res = await apiClient.get(`/private/paper/${selectedPaper._id}`);
        const data = res.data?.data || res.data;
        const srvQs: QuestionLite[] = (data?.questions || []).map((q: any) => ({ _id: q._id, text: q.text, difficulty: q.difficulty, domain: q.domain }));
        setQuestions(srvQs);
        // sync editable fields with latest server data if present
        if (data?.title || data?.subject || data?.price) {
          setSelectedPaper((prev) => (prev ? { ...prev, title: data.title ?? prev.title, subject: data.subject ?? prev.subject, price: data.price ?? prev.price } : prev));
        }
      } catch (e) {
        // keep existing questions if server fails
      } finally {
        setLoadingPaper(false);
      }
    };
    // Reset view immediately when switching paper to avoid stale details
    setQuestions([]);
    fetchDetails();
  }, [selectedPaper?._id]);

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const res = await apiClient.get("/private/questions");
        const list: QuestionLite[] = res.data?.data || res.data || [];
        setServerQuestions(list);
      } catch (e) {
        setServerQuestions([]);
      }
    };
    loadQuestions();
  }, []);

  const addLocalQuestion = (q: QuestionLite) => {
    if (questions.some((s) => (s._id && s._id === q._id) || (s.id && s.id === q.id))) return;
    setQuestions((prev) => [...prev, q]);
  };

  const removeQuestion = (qid?: string) => {
    setQuestions((prev) => prev.filter((q) => q._id !== qid));
  };

  const saveLocal = () => {
    if (!selectedPaper) return;
    const list = JSON.parse(localStorage.getItem("local_papers") || "[]");
    const idx = list.findIndex((p: any) => p._id === selectedPaper._id || p.id === (selectedPaper as any).id);
    const entry = { ...(idx >= 0 ? list[idx] : {}), ...selectedPaper, questions };
    if (idx >= 0) list[idx] = entry; else list.unshift(entry);
    localStorage.setItem("local_papers", JSON.stringify(list));
    setStatus("Saved locally");
  };

  const validate = (): string | null => {
    if (!selectedPaper) return "No paper selected";
    if (!selectedPaper.title?.trim()) return "Title is required";
    if (!selectedPaper.subject?.trim()) return "Subject is required";
    if (selectedPaper.price == null || Number.isNaN(selectedPaper.price) || selectedPaper.price < 0) return "Price must be a valid non-negative number";
    // Questions optional, but if present, must have ids or text
    if (questions.some((q) => !(q._id || q.text))) return "Invalid question entry";
    return null;
  };

  const upload = async () => {
    const err = validate();
    if (err) { setStatus(err); return; }
    if (!selectedPaper?._id) { setStatus("Missing paper id"); return; }
    setUploading(true);
    setStatus(null);
    try {
      const questionIds = questions.map((q) => q._id).filter(Boolean);
      await apiClient.put(`/admin/paper/${selectedPaper._id}`, {
        title: selectedPaper.title,
        subject: selectedPaper.subject,
        price: selectedPaper.price,
        questions: questionIds,
      });
      setStatus("Updated on server");
    } catch (e: any) {
      setStatus(e?.message || "Update failed");
    } finally {
      setUploading(false);
    }
  };

  const filteredPapers = papers.filter((p) => p.title.toLowerCase().includes(filterPaper.toLowerCase()));
  const availableLocal = useMemo(() => {
    const map = new Map<string, QuestionLite>();
    for (const q of localQuestions) map.set((q._id as any) || (q.id as any), q);
    for (const q of serverQuestions) map.set((q._id as any) || (q.id as any), q);
    const all = Array.from(map.values());
    const filtered = all
      .filter((q) => (q.text || "").toLowerCase().includes(filterLocal.toLowerCase()))
      .filter((q) => (difficulty === "all" ? true : q.difficulty === difficulty))
      .filter((q) => (topic === "all" ? true : q.domain === topic))
      .sort((a: any, b: any) => {
        const ad = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bd = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return sortDir === "desc" ? bd - ad : ad - bd;
      });
    return filtered;
  }, [localQuestions, serverQuestions, filterLocal]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="container mx-auto px-4 py-8 grid gap-6 lg:grid-cols-3">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={16} className="text-zinc-400" />
            <input className="flex-1 bg-zinc-800 rounded p-2" placeholder="Filter papers..." value={filterPaper} onChange={(e) => setFilterPaper(e.target.value)} />
          </div>
          <div className="max-h-96 overflow-auto space-y-2">
            {filteredPapers.map((p) => (
              <button key={p._id} onClick={() => { setSelectedPaper(p as any); setStatus(null); }} className={`w-full text-left p-3 rounded border ${selectedPaper?._id === p._id ? "border-blue-500" : "border-zinc-700"} bg-zinc-800`}>
                <div className="text-sm font-medium">{p.title}</div>
                <div className="text-xs text-zinc-500">{p.subject} • ₹{p.price}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          {!selectedPaper ? (
            <div className="text-zinc-500">Select a paper to update.</div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Title</label>
                  <input className="w-full bg-zinc-800 rounded p-2" value={selectedPaper.title} onChange={(e) => setSelectedPaper({ ...selectedPaper, title: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Subject</label>
                  <input className="w-full bg-zinc-800 rounded p-2" value={selectedPaper.subject} onChange={(e) => setSelectedPaper({ ...selectedPaper, subject: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Price</label>
                  <input type="number" className="w-full bg-zinc-800 rounded p-2" value={selectedPaper.price} onChange={(e) => setSelectedPaper({ ...selectedPaper, price: parseFloat(e.target.value || "0") })} />
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-2">Questions</h2>
                <div className="space-y-2">
                  {loadingPaper && <div className="text-sm text-zinc-500">Loading questions...</div>}
                  {questions.map((q) => (
                    <div key={q._id || q.id} className="p-3 bg-zinc-800 border border-zinc-700 rounded flex items-center justify-between">
                      <div className="text-sm line-clamp-2">{q.text}</div>
                      <button className="text-red-400 text-sm inline-flex items-center gap-1" onClick={() => removeQuestion(q._id)}>
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                  ))}
                  {questions.length === 0 && <div className="text-sm text-zinc-500">No questions</div>}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={saveLocal} className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-4 py-2 rounded">
                  <Save size={16} /> Save locally
                </button>
                <button disabled={uploading} onClick={upload} className={`inline-flex items-center gap-2 px-4 py-2 rounded ${uploading ? "bg-blue-500/50 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}>
                  <UploadCloud size={16} /> {uploading ? "Updating..." : "Save & upload"}
                </button>
              </div>
              {status && <div className="text-sm text-zinc-400">{status}</div>}
            </div>
          )}
        </div>

        <div className="lg:col-span-3 grid md:grid-cols-2 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter size={16} className="text-zinc-400" />
              <input className="flex-1 bg-zinc-800 rounded p-2" placeholder="Filter local questions..." value={filterLocal} onChange={(e) => setFilterLocal(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
              <select className="w-full bg-zinc-800 rounded p-2" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                <option value="all">All difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
              <select className="w-full bg-zinc-800 rounded p-2" value={topic} onChange={(e) => setTopic(e.target.value)}>
                <option value="all">All topics</option>
                {Array.from(new Set(availableLocal.map((q) => (q.domain || "").trim()).filter(Boolean))).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <select className="w-full bg-zinc-800 rounded p-2" value={sortDir} onChange={(e) => setSortDir(e.target.value as any)}>
                <option value="desc">Newest first</option>
                <option value="asc">Oldest first</option>
              </select>
            </div>
            <div className="max-h-64 overflow-auto space-y-2">
              {availableLocal.map((q) => (
                <button key={q._id || (q as any).id} onClick={() => addLocalQuestion(q)} className="w-full text-left p-3 rounded border border-zinc-700 bg-zinc-800">
                  <div className="text-sm line-clamp-2">{(q as any).text}</div>
                  <div className="text-xs text-zinc-500 mt-1">{(q as any).difficulty} • {(q as any).domain}</div>
                </button>
              ))}
              {availableLocal.length === 0 && <div className="text-sm text-zinc-500">No local questions found</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


