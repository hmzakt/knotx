"use client";
import { useEffect, useMemo, useState } from "react";

import { Save, UploadCloud, Filter, PlusCircle } from "lucide-react";
import apiClient from "@/lib/api";
import { useContent } from "@/hooks/useContent";

type QuestionLite = { _id?: string; id?: string; text: string; difficulty?: string; domain?: string };

export default function CreatePaperPage() {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [selectedQuestions, setSelectedQuestions] = useState<QuestionLite[]>([]);

  const { papers } = useContent(); // not strictly needed here, but keeps parity

  const localQuestions: QuestionLite[] = useMemo(() => {
    if (typeof window === "undefined") return [];
    const raw = JSON.parse(localStorage.getItem("local_questions") || "[]");
    return raw.map((q: any) => ({ id: q.id, _id: q._id, text: q.text, difficulty: q.difficulty, domain: q.domain }));
  }, []);

  const [filter, setFilter] = useState("");
  const available = localQuestions.filter((q) => (q.text || "").toLowerCase().includes(filter.toLowerCase()));

  const saveLocal = () => {
    const entry = { id: crypto.randomUUID(), title, subject, price, questions: selectedQuestions, savedAt: new Date().toISOString() };
    const list = JSON.parse(localStorage.getItem("local_papers") || "[]");
    localStorage.setItem("local_papers", JSON.stringify([entry, ...list]));
  };

  const upload = async () => {
    if (!title.trim()) return;
    if (!subject.trim()) return;
    if (!price || price <= 0) return;
    const questionIds = selectedQuestions.map((q) => q._id).filter(Boolean);
    await apiClient.post("/admin/paper", { title, subject, price, questions: questionIds });
  };

  const addQuestion = (q: QuestionLite) => {
    if (selectedQuestions.some((s) => (s._id && s._id === q._id) || (s.id && s.id === q.id))) return;
    setSelectedQuestions((prev) => [...prev, q]);
  };

  const removeQuestion = (qid?: string) => {
    setSelectedQuestions((prev) => prev.filter((q) => q._id !== qid));
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="container mx-auto px-4 py-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          <h1 className="text-2xl font-bold mb-4">Create Paper</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Title</label>
              <input className="w-full bg-zinc-800 rounded p-2" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Subject</label>
              <input className="w-full bg-zinc-800 rounded p-2" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Price</label>
              <input type="number" className="w-full bg-zinc-800 rounded p-2" value={price} onChange={(e) => setPrice(parseFloat(e.target.value || "0"))} />
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Selected Questions</h2>
            <div className="space-y-2">
              {selectedQuestions.map((q) => (
                <div key={q._id || q.id} className="p-3 bg-zinc-800 border border-zinc-700 rounded flex items-center justify-between">
                  <div className="text-sm line-clamp-2">{q.text}</div>
                  <button className="text-red-400 text-sm" onClick={() => removeQuestion(q._id)}>
                    Remove
                  </button>
                </div>
              ))}
              {selectedQuestions.length === 0 && <div className="text-sm text-zinc-500">No questions selected</div>}
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
              <input className="flex-1 bg-zinc-800 rounded p-2" placeholder="Filter local pre-uploaded questions..." value={filter} onChange={(e) => setFilter(e.target.value)} />
            </div>
            <div className="max-h-96 overflow-auto space-y-2">
              {available.map((q) => (
                <button key={q._id || q.id} onClick={() => addQuestion(q)} className="w-full text-left p-3 rounded border border-zinc-700 bg-zinc-800">
                  <div className="text-sm line-clamp-2">{q.text}</div>
                  <div className="text-xs text-zinc-500 mt-1">{q.difficulty} • {q.domain}</div>
                </button>
              ))}
              {available.length === 0 && <div className="text-sm text-zinc-500">No local questions found</div>}
            </div>

            <div className="mt-4 text-xs text-zinc-500">
              Tip: Use "Create Question" to upload new questions first, then add here.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


