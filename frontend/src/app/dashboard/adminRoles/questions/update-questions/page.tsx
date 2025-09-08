"use client";
import { useEffect, useState } from "react";
import { Save, UploadCloud, Trash2, Search, Filter } from "lucide-react";
import apiClient from "@/lib/api";

type Question = {
  _id: string;
  text: string;
  options: { optionText: string; isCorrect?: boolean }[];
  explanation?: string;
  difficulty: string;
  domain: string;
  createdAt?: string;
  updatedAt?: string;
};

export default function UpdateQuestionsPage() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Question[]>([]);
  const [selected, setSelected] = useState<Question | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<string>("all");
  const [topic, setTopic] = useState<string>("all");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get("/private/questions");
        const server = (res.data?.data || res.data || []) as Question[];
        const local = JSON.parse(localStorage.getItem("local_questions") || "[]");
        const map = new Map<string, Question>();
        for (const q of local) map.set((q as any)._id || (q as any).id, q);
        for (const q of server) map.set((q as any)._id || (q as any).id, q);
        setItems(Array.from(map.values()));
      } catch (e) {
        const local = JSON.parse(localStorage.getItem("local_questions") || "[]");
        setItems(local);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const loadById = async (id: string) => {
    // no dedicated GET endpoint provided; allow admin to paste data manually or use local cache
    setStatus("ID mode: paste full data not supported; using local cache if exists");
  };

  const saveLocal = () => {
    if (!selected) return;
    const list = JSON.parse(localStorage.getItem("local_questions") || "[]");
    const idx = list.findIndex((q: any) => q._id ? q._id === selected._id : q.id === (selected as any).id);
    if (idx >= 0) list[idx] = { ...list[idx], ...selected };
    else list.unshift({ ...selected, id: (selected as any).id || crypto.randomUUID() });
    localStorage.setItem("local_questions", JSON.stringify(list));
    setStatus("Saved locally");
  };

  const upload = async () => {
    if (!selected?._id) {
      setStatus("Missing _id for update");
      return;
    }
    if (!selected.text?.trim()) return setStatus("Error: text is required");
    if (!selected.domain?.trim()) return setStatus("Error: domain is required");
    if (!selected.options || selected.options.length < 4 || selected.options.some((o) => !o.optionText?.trim())) return setStatus("Error: 4 non-empty options required");
    if (!selected.options.some((o) => o.isCorrect)) return setStatus("Error: select one correct option");
    if (!["easy", "medium", "hard"].includes(selected.difficulty)) return setStatus("Error: invalid difficulty");
    await apiClient.put(`/admin/question/${selected._id}`, selected);
    setStatus("Updated on server");
  };

  const remove = async () => {
    if (!selected?._id) return;
    await apiClient.delete(`/admin/question/${selected._id}`);
    setStatus("Deleted on server");
  };

  const domainOptions = Array.from(
    new Set(items.map((q) => (q.domain || "").trim()).filter(Boolean))
  );

  const filtered = items
    .filter((q) => (q.text || "").toLowerCase().includes(query.toLowerCase()))
    .filter((q) => (difficulty === "all" ? true : q.difficulty === difficulty))
    .filter((q) => (topic === "all" ? true : q.domain === topic))
    .sort((a, b) => {
      const ad = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bd = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortDir === "desc" ? bd - ad : ad - bd;
    });

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="container mx-auto px-4 py-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <h1 className="text-2xl font-bold mb-4">Update Questions</h1>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Search size={16} className="text-zinc-400" />
              <input className="flex-1 bg-zinc-800 rounded p-2" placeholder="Filter by text..." value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-zinc-400" />
                <select className="w-full bg-zinc-800 rounded p-2" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                  <option value="all">All difficulties</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <select className="w-full bg-zinc-800 rounded p-2" value={topic} onChange={(e) => setTopic(e.target.value)}>
                  <option value="all">All topics</option>
                  {domainOptions.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mb-3">
              <select className="w-full bg-zinc-800 rounded p-2" value={sortDir} onChange={(e) => setSortDir(e.target.value as any)}>
                <option value="desc">Newest first</option>
                <option value="asc">Oldest first</option>
              </select>
            </div>
            <div className="max-h-96 overflow-auto space-y-2">
              {filtered.map((q) => (
                <button key={(q as any)._id || (q as any).id} onClick={() => setSelected(q)} className={`w-full text-left p-3 rounded border ${selected === q ? "border-blue-500" : "border-zinc-700"} bg-zinc-800`}>
                  <div className="text-sm line-clamp-2">{q.text}</div>
                  <div className="text-xs text-zinc-500 mt-1">{q.difficulty} • {q.domain}</div>
                </button>
              ))}
              {filtered.length === 0 && <div className="text-sm text-zinc-500">No items</div>}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 min-h-[400px]">
            {!selected ? (
              <div className="text-zinc-500">Select an item to edit.</div>
            ) : (
              <QuestionEditor q={selected} onChange={setSelected} onSaveLocal={saveLocal} onUpload={upload} onDelete={remove} status={status} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuestionEditor({ q, onChange, onSaveLocal, onUpload, onDelete, status }: { q: Question; onChange: (v: Question) => void; onSaveLocal: () => void; onUpload: () => void; onDelete: () => void; status: string | null }) {
  const setOption = (idx: number, text: string) => {
    onChange({ ...q, options: q.options.map((o, i) => (i === idx ? { ...o, optionText: text } : o)) });
  };
  const setCorrect = (idx: number) => {
    onChange({ ...q, options: q.options.map((o, i) => ({ ...o, isCorrect: i === idx })) });
  };
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-zinc-400 mb-1">Question Text</label>
        <textarea className="w-full bg-zinc-800 rounded p-3" rows={4} value={q.text} onChange={(e) => onChange({ ...q, text: e.target.value })} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-zinc-400 mb-1">Difficulty</label>
          <select className="w-full bg-zinc-800 rounded p-2" value={q.difficulty} onChange={(e) => onChange({ ...q, difficulty: e.target.value })}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
            <option value="expert">Expert</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-zinc-400 mb-1">Domain</label>
          <input className="w-full bg-zinc-800 rounded p-2" value={q.domain} onChange={(e) => onChange({ ...q, domain: e.target.value })} />
        </div>
      </div>
      <div>
        <label className="block text-sm text-zinc-400 mb-2">Explanation</label>
        <textarea className="w-full bg-zinc-800 rounded p-3" rows={3} value={q.explanation || ""} onChange={(e) => onChange({ ...q, explanation: e.target.value })} />
      </div>
      <div>
        <label className="block text-sm text-zinc-400 mb-2">Options</label>
        <div className="space-y-3">
          {q.options.map((opt, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <button type="button" onClick={() => setCorrect(idx)} className={`p-2 rounded border ${opt.isCorrect ? "border-green-500 text-green-400" : "border-zinc-700 text-zinc-400"}`}>✔</button>
              <input className="flex-1 bg-zinc-800 rounded p-2" value={opt.optionText} onChange={(e) => setOption(idx, e.target.value)} placeholder={`Option ${idx + 1}`} />
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={onSaveLocal} className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-4 py-2 rounded">
          <Save size={16} /> Save locally
        </button>
        <button onClick={onUpload} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
          <UploadCloud size={16} /> Save & upload
        </button>
        <button onClick={onDelete} className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded">
          <Trash2 size={16} /> Delete
        </button>
      </div>
      {status && <div className="text-sm text-green-400">{status}</div>}
    </div>
  );
}


