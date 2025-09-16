"use client";
import { useState } from "react";
import { Save, UploadCloud, Plus, CheckCircle2 } from "lucide-react";
import apiClient from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

type Option = { optionText: string; isCorrect: boolean };

export default function CreateQuestionPage() {
  const [text, setText] = useState("");
  const [explanation, setExplanation] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
  const [domain, setDomain] = useState("general");
  const [paperId, setPaperId] = useState("");
  const [options, setOptions] = useState<Option[]>([
    { optionText: "", isCorrect: false },
    { optionText: "", isCorrect: false },
    { optionText: "", isCorrect: false },
    { optionText: "", isCorrect: false },
  ]);
  const [status, setStatus] = useState<string | null>(null);

  const resetForm = () => {
    setText("");
    setExplanation("");
    setDifficulty("easy");
    setDomain("general");
    setPaperId("");
    setOptions([
      { optionText: "", isCorrect: false },
      { optionText: "", isCorrect: false },
      { optionText: "", isCorrect: false },
      { optionText: "", isCorrect: false },
    ]);
  };

  const setCorrect = (idx: number) => {
    setOptions((prev) => prev.map((o, i) => ({ ...o, isCorrect: i === idx })));
  };

  const toPayload = () => ({ text, options, explanation, difficulty, domain, paperId: paperId || undefined });

  const saveLocal = () => {
    const existing = JSON.parse(localStorage.getItem("local_questions") || "[]");
    const newEntry = { id: crypto.randomUUID(), ...toPayload(), savedAt: new Date().toISOString() };
    localStorage.setItem("local_questions", JSON.stringify([newEntry, ...existing]));
    setStatus("Saved locally");
    resetForm();
  };

  const upload = async () => {
    setStatus(null);
    // validations per model
    if (!text.trim()) return setStatus("Error: text is required");
    const hasFour = options.length >= 4 && options.every((o) => o.optionText.trim());
    if (!hasFour) return setStatus("Error: 4 non-empty options required");
    if (!options.some((o) => o.isCorrect)) return setStatus("Error: select one correct option");
    if (!["easy", "medium", "hard"].includes(difficulty)) return setStatus("Error: invalid difficulty");
    if (!domain.trim()) return setStatus("Error: domain is required");
    const payload = toPayload();
    await apiClient.post("/admin/question", payload);
    setStatus("Uploaded to server");
    resetForm();
  };

  const {user} = useAuth();

  return (
    user?.role === "admin" ? (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-2xl font-bold mb-6">Create Question</h1>

        <div className="space-y-5 bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Question Text</label>
            <textarea className="w-full bg-zinc-800 rounded p-3 outline-none" rows={4} value={text} onChange={(e) => setText(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Difficulty</label>
              <select className="w-full bg-zinc-800 rounded p-2" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Domain</label>
              <input className="w-full bg-zinc-800 rounded p-2" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="e.g. mathematics" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">Explanation</label>
            <textarea className="w-full bg-zinc-800 rounded p-3 outline-none" rows={3} value={explanation} onChange={(e) => setExplanation(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-2">Options (select one correct)</label>
            <div className="space-y-3">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <button type="button" onClick={() => setCorrect(idx)} className={`p-2 rounded border ${opt.isCorrect ? "border-green-500 text-green-400" : "border-zinc-700 text-zinc-400"}`}>
                    <CheckCircle2 size={18} />
                  </button>
                  <input className="flex-1 bg-zinc-800 rounded p-2" value={opt.optionText} onChange={(e) => setOptions((prev) => prev.map((o, i) => (i === idx ? { ...o, optionText: e.target.value } : o)))} placeholder={`Option ${idx + 1}`} />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">Attach to Paper (optional, paperId)</label>
            <input className="w-full bg-zinc-800 rounded p-2" value={paperId} onChange={(e) => setPaperId(e.target.value)} placeholder="Paste paper _id" />
          </div>

          <div className="flex items-center gap-3">
            <button onClick={saveLocal} className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-4 py-2 rounded">
              <Save size={16} /> Save locally
            </button>
            <button onClick={upload} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
              <UploadCloud size={16} /> Save & upload
            </button>
            <button onClick={resetForm} className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-4 py-2 rounded">
              Reset
            </button>
          </div>

          {status && <div className="text-sm text-green-400">{status}</div>}
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-3">Locally Saved Questions</h2>
          <LocalQuestionsList />
        </div>
      </div>
    </div>
    ):(<div>No trespassers</div>)
  );
}

function LocalQuestionsList() {
  const [filter, setFilter] = useState("");
  const items = (typeof window !== "undefined" ? JSON.parse(localStorage.getItem("local_questions") || "[]") : []) as any[];
  const filtered = items.filter((q) => (q.text || "").toLowerCase().includes(filter.toLowerCase()));
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      <div className="mb-3">
        <input className="w-full bg-zinc-800 rounded p-2" placeholder="Filter by text..." value={filter} onChange={(e) => setFilter(e.target.value)} />
      </div>
      <div className="space-y-3 max-h-64 overflow-auto">
        {filtered.map((q) => (
          <div key={q.id} className="p-3 rounded bg-zinc-800 border border-zinc-700">
            <div className="text-sm text-zinc-300 line-clamp-2">{q.text}</div>
            <div className="text-xs text-zinc-500 mt-1">{q.difficulty} • {q.domain}</div>
          </div>
        ))}
        {filtered.length === 0 && <div className="text-sm text-zinc-500">No local questions</div>}
      </div>
    </div>
  );
}


