"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Save,
  UploadCloud,
  Filter,
  Trash2,
  Plus,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  ArrowLeft,
  Layers,
  Film,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import LectureUploadForm from "@/components/admin/LectureUploadForm";
import ThumbnailUpload from "@/components/admin/ThumbnailUpload";
import {
  listCoursesAdmin,
  getCourseAdmin,
  updateCourse,
  publishCourse,
  unpublishCourse,
  deleteCourse,
  createSection,
  updateSection,
  deleteSection,
  reorderSections,
  updateLecture,
  deleteLecture,
  uploadCourseThumbnail,
  uploadLectureThumbnail,
  parseApiError,
  parseLines,
  joinLines,
  formatDuration,
  type CourseAdminDetail,
  type CourseAdminSummary,
  type CourseLevel,
  type LectureAdmin,
  type SectionAdmin,
} from "@/lib/adminCourses";

const LEVELS: CourseLevel[] = ["beginner", "intermediate", "advanced"];

function LectureRow({
  lecture,
  onRefresh,
}: {
  lecture: LectureAdmin;
  onRefresh: () => void;
}) {
  const [busy, setBusy] = useState(false);

  const togglePreview = async () => {
    setBusy(true);
    try {
      await updateLecture(lecture._id, { isPreviewFree: !lecture.isPreviewFree });
      onRefresh();
    } finally {
      setBusy(false);
    }
  };

  const togglePublished = async () => {
    setBusy(true);
    try {
      await updateLecture(lecture._id, { isPublished: !lecture.isPublished });
      onRefresh();
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm(`Delete lecture "${lecture.title}"? This removes the video permanently.`)) return;
    setBusy(true);
    try {
      await deleteLecture(lecture._id);
      onRefresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-zinc-800 border border-zinc-700 rounded">
      <ThumbnailUpload
        compact
        label=""
        currentUrl={lecture.thumbnail?.url}
        onUpload={async (file) => {
          await uploadLectureThumbnail(lecture._id, file);
          onRefresh();
        }}
      />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{lecture.title}</div>
        <div className="text-xs text-zinc-500 mt-0.5">
          {formatDuration(lecture.duration)} · Order {lecture.order} · {lecture.processingStatus}
          {lecture.isPreviewFree && " · Preview"}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={togglePreview}
          className="text-xs px-2 py-1 rounded border border-zinc-600 hover:border-zinc-500"
        >
          {lecture.isPreviewFree ? "Preview ✓" : "Set preview"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={togglePublished}
          className="text-xs px-2 py-1 rounded border border-zinc-600 hover:border-zinc-500 inline-flex items-center gap-1"
        >
          {lecture.isPublished ? <Eye size={12} /> : <EyeOff size={12} />}
          {lecture.isPublished ? "Live" : "Hidden"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={remove}
          className="text-red-400 text-xs inline-flex items-center gap-1 px-2 py-1"
        >
          <Trash2 size={12} /> Delete
        </button>
      </div>
    </div>
  );
}

function SectionBlock({
  courseId,
  section,
  index,
  total,
  onRefresh,
  onMove,
}: {
  courseId: string;
  section: SectionAdmin;
  index: number;
  total: number;
  onRefresh: () => void;
  onMove: (direction: "up" | "down") => void;
}) {
  const [title, setTitle] = useState(section.title);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    setTitle(section.title);
  }, [section.title]);

  const saveTitle = async () => {
    if (title.trim() === section.title) return;
    setSaving(true);
    try {
      await updateSection(courseId, section._id, { title: title.trim() });
      onRefresh();
    } catch (err) {
      alert(parseApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const removeSection = async () => {
    if (
      !confirm(
        `Delete section "${section.title}" and all ${section.lectures.length} lecture(s)?`
      )
    )
      return;
    try {
      await deleteSection(courseId, section._id);
      onRefresh();
    } catch (err) {
      alert(parseApiError(err));
    }
  };

  return (
    <div className="border border-zinc-700 rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 p-3 bg-zinc-800/80">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-zinc-400 hover:text-white text-xs"
        >
          {expanded ? "▼" : "▶"}
        </button>
        <Layers size={16} className="text-amber-400 shrink-0" />
        <input
          className="flex-1 bg-zinc-900 rounded px-2 py-1 text-sm min-w-0"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={saveTitle}
        />
        {saving && <LoadingSpinner size="sm" />}
        <span className="text-xs text-zinc-500 hidden sm:inline">
          {section.lectures.length} lecture(s)
        </span>
        <div className="flex items-center gap-1 ml-auto">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMove("up")}
            className="p-1 rounded hover:bg-zinc-700 disabled:opacity-30"
            title="Move up"
          >
            <ChevronUp size={16} />
          </button>
          <button
            type="button"
            disabled={index === total - 1}
            onClick={() => onMove("down")}
            className="p-1 rounded hover:bg-zinc-700 disabled:opacity-30"
            title="Move down"
          >
            <ChevronDown size={16} />
          </button>
          <button
            type="button"
            onClick={removeSection}
            className="p-1 rounded text-red-400 hover:bg-zinc-700"
            title="Delete section"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-4 space-y-3 bg-zinc-900/50">
          {section.lectures.length === 0 ? (
            <p className="text-sm text-zinc-500">No lectures in this section yet.</p>
          ) : (
            section.lectures.map((lec) => (
              <LectureRow key={lec._id} lecture={lec} onRefresh={onRefresh} />
            ))
          )}
          <LectureUploadForm
            courseId={courseId}
            sectionId={section._id}
            sectionTitle={section.title}
            defaultOrder={section.lectures.length}
            onUploaded={onRefresh}
          />
        </div>
      )}
    </div>
  );
}

export default function UpdateCoursePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <UpdateCourseContent />
    </Suspense>
  );
}

function UpdateCourseContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialId = searchParams.get("id");

  const [courses, setCourses] = useState<CourseAdminSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(initialId);
  const [course, setCourse] = useState<CourseAdminDetail | null>(null);
  const [filter, setFilter] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingCourse, setLoadingCourse] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [isFree, setIsFree] = useState(false);
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [level, setLevel] = useState<CourseLevel>("beginner");
  const [language, setLanguage] = useState("English");
  const [requirements, setRequirements] = useState("");
  const [learningOutcomes, setLearningOutcomes] = useState("");

  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [addingSection, setAddingSection] = useState(false);

  const loadCourses = useCallback(async () => {
    setLoadingList(true);
    try {
      const list = await listCoursesAdmin();
      setCourses(list);
    } catch {
      setCourses([]);
    } finally {
      setLoadingList(false);
    }
  }, []);

  const loadCourse = useCallback(async (id: string) => {
    setLoadingCourse(true);
    setStatus(null);
    try {
      const data = await getCourseAdmin(id);
      setCourse(data);
      setTitle(data.title);
      setDescription(data.description);
      setShortDescription(data.shortDescription ?? "");
      setPrice(data.price);
      setIsFree(data.isFree);
      setCategory(data.category ?? "");
      setTags((data.tags ?? []).join(", "));
      setLevel(data.level ?? "beginner");
      setLanguage(data.language ?? "English");
      setRequirements(joinLines(data.requirements));
      setLearningOutcomes(joinLines(data.learningOutcomes));
    } catch (err) {
      setCourse(null);
      setStatus(parseApiError(err));
    } finally {
      setLoadingCourse(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    if (selectedId) loadCourse(selectedId);
    else setCourse(null);
  }, [selectedId, loadCourse]);

  const filteredCourses = useMemo(
    () =>
      courses.filter((c) => c.title.toLowerCase().includes(filter.toLowerCase())),
    [courses, filter]
  );

  const refresh = () => {
    if (selectedId) loadCourse(selectedId);
    loadCourses();
  };

  const saveMetadata = async () => {
    if (!selectedId) return;
    setSaving(true);
    setStatus(null);
    try {
      await updateCourse(selectedId, {
        title: title.trim(),
        description: description.trim(),
        shortDescription: shortDescription.trim() || undefined,
        price: isFree ? 0 : price,
        isFree: isFree || price === 0,
        category: category.trim() || undefined,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        level,
        language: language.trim() || "English",
        requirements: parseLines(requirements),
        learningOutcomes: parseLines(learningOutcomes),
      });
      setStatus("Course metadata saved.");
      refresh();
    } catch (err) {
      setStatus(parseApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async () => {
    if (!selectedId || !course) return;
    try {
      if (course.isPublished) await unpublishCourse(selectedId);
      else await publishCourse(selectedId);
      refresh();
      setStatus(course.isPublished ? "Course unpublished." : "Course published.");
    } catch (err) {
      setStatus(parseApiError(err));
    }
  };

  const removeCourse = async () => {
    if (!selectedId || !course) return;
    if (!confirm(`Delete "${course.title}" and ALL sections, lectures, and videos?`)) return;
    try {
      await deleteCourse(selectedId);
      setSelectedId(null);
      setCourse(null);
      refresh();
      setStatus("Course deleted.");
    } catch (err) {
      setStatus(parseApiError(err));
    }
  };

  const addSection = async () => {
    if (!selectedId || !newSectionTitle.trim()) return;
    setAddingSection(true);
    try {
      await createSection(selectedId, newSectionTitle.trim());
      setNewSectionTitle("");
      refresh();
      setStatus("Section added.");
    } catch (err) {
      setStatus(parseApiError(err));
    } finally {
      setAddingSection(false);
    }
  };

  const moveSection = async (index: number, direction: "up" | "down") => {
    if (!selectedId || !course?.sections) return;
    const sections = [...course.sections].sort((a, b) => a.order - b.order);
    const swap = direction === "up" ? index - 1 : index + 1;
    if (swap < 0 || swap >= sections.length) return;
    [sections[index], sections[swap]] = [sections[swap], sections[index]];
    try {
      await reorderSections(
        selectedId,
        sections.map((s) => s._id)
      );
      refresh();
    } catch (err) {
      setStatus(parseApiError(err));
    }
  };

  if (user?.role !== "admin") {
    return <div className="min-h-screen bg-zinc-950 text-white p-8">Only admins beyond this point.</div>;
  }

  const sortedSections = [...(course?.sections ?? [])].sort((a, b) => a.order - b.order);
  const flatLectures = course?.lectures ?? [];

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="container mx-auto px-4 py-8">
        <Link
          href="/dashboard/adminRoles"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white mb-6"
        >
          <ArrowLeft size={16} /> Admin Controls
        </Link>

        <h1 className="text-2xl font-bold mb-1">Manage Video Courses</h1>
        <p className="text-zinc-400 text-sm mb-6">
          Edit course details, organize sections, and upload lecture videos.
        </p>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Course list */}
          <div className="lg:col-span-3 bg-zinc-900 border border-zinc-800 rounded-lg p-4 h-fit">
            <div className="flex items-center gap-2 mb-3">
              <Filter size={16} className="text-zinc-400" />
              <input
                className="flex-1 bg-zinc-800 rounded p-2 text-sm"
                placeholder="Filter courses…"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
            {loadingList ? (
              <div className="py-8 flex justify-center">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="max-h-[70vh] overflow-auto space-y-2">
                {filteredCourses.map((c) => (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => setSelectedId(c._id)}
                    className={`w-full text-left p-3 rounded border transition-colors ${
                      selectedId === c._id
                        ? "border-blue-500 bg-zinc-800"
                        : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                    }`}
                  >
                    <div className="text-sm font-medium line-clamp-2">{c.title}</div>
                    <div className="text-xs text-zinc-500 mt-1 flex flex-wrap gap-2">
                      <span>{c.isPublished ? "Published" : "Draft"}</span>
                      <span>·</span>
                      <span>{c.isFree ? "Free" : `₹${c.price}`}</span>
                      <span>·</span>
                      <span>{formatDuration(c.totalDuration)}</span>
                    </div>
                  </button>
                ))}
                {filteredCourses.length === 0 && (
                  <p className="text-sm text-zinc-500 py-4">No courses found.</p>
                )}
              </div>
            )}
            <Link
              href="/dashboard/adminRoles/courses/create-course"
              className="mt-4 block text-center text-sm text-blue-400 hover:text-blue-300"
            >
              + Create new course
            </Link>
          </div>

          {/* Main editor */}
          <div className="lg:col-span-9 space-y-6">
            {!selectedId ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-zinc-500 text-center">
                Select a course from the list, or create a new one.
              </div>
            ) : loadingCourse ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-12 flex justify-center">
                <LoadingSpinner size="lg" />
              </div>
            ) : course ? (
              <>
                {/* Status bar */}
                <div className="flex flex-wrap items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                  <span
                    className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded ${
                      course.isPublished
                        ? "bg-green-900/50 text-green-300 border border-green-800"
                        : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                    }`}
                  >
                    {course.isPublished ? "Published" : "Draft"}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {sortedSections.length} section(s) · {flatLectures.length} flat lecture(s) ·{" "}
                    {formatDuration(course.totalDuration)} total
                  </span>
                  <div className="flex flex-wrap gap-2 ml-auto">
                    <button
                      type="button"
                      onClick={togglePublish}
                      className="text-sm px-3 py-1.5 rounded border border-zinc-600 hover:bg-zinc-800 inline-flex items-center gap-1"
                    >
                      {course.isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
                      {course.isPublished ? "Unpublish" : "Publish"}
                    </button>
                    <button
                      type="button"
                      onClick={removeCourse}
                      className="text-sm px-3 py-1.5 rounded border border-red-900 text-red-400 hover:bg-red-950/30 inline-flex items-center gap-1"
                    >
                      <Trash2 size={14} /> Delete course
                    </button>
                  </div>
                </div>

                {/* Metadata */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
                  <h2 className="text-lg font-semibold mb-4">Course details</h2>
                  <div className="mb-6 pb-6 border-b border-zinc-800">
                    <ThumbnailUpload
                      label="Course thumbnail"
                      currentUrl={course.thumbnail?.url}
                      onUpload={async (file) => {
                        await uploadCourseThumbnail(selectedId!, file);
                        refresh();
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm text-zinc-400 mb-1">Title</label>
                      <input
                        className="w-full bg-zinc-800 rounded p-2"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm text-zinc-400 mb-1">Short description</label>
                      <input
                        className="w-full bg-zinc-800 rounded p-2"
                        value={shortDescription}
                        onChange={(e) => setShortDescription(e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm text-zinc-400 mb-1">Description</label>
                      <textarea
                        className="w-full bg-zinc-800 rounded p-3"
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Price (₹)</label>
                      <input
                        type="number"
                        className="w-full bg-zinc-800 rounded p-2"
                        value={price}
                        disabled={isFree}
                        onChange={(e) => setPrice(parseFloat(e.target.value || "0"))}
                      />
                    </div>
                    <div className="flex items-end pb-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={isFree}
                          onChange={(e) => setIsFree(e.target.checked)}
                        />
                        Free course
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Category</label>
                      <input
                        className="w-full bg-zinc-800 rounded p-2"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Level</label>
                      <select
                        className="w-full bg-zinc-800 rounded p-2"
                        value={level}
                        onChange={(e) => setLevel(e.target.value as CourseLevel)}
                      >
                        {LEVELS.map((l) => (
                          <option key={l} value={l}>
                            {l.charAt(0).toUpperCase() + l.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Language</label>
                      <input
                        className="w-full bg-zinc-800 rounded p-2"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Tags</label>
                      <input
                        className="w-full bg-zinc-800 rounded p-2"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Requirements</label>
                      <textarea
                        className="w-full bg-zinc-800 rounded p-2 text-sm"
                        rows={3}
                        value={requirements}
                        onChange={(e) => setRequirements(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Learning outcomes</label>
                      <textarea
                        className="w-full bg-zinc-800 rounded p-2 text-sm"
                        rows={3}
                        value={learningOutcomes}
                        onChange={(e) => setLearningOutcomes(e.target.value)}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={saveMetadata}
                    className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded ${
                      saving ? "bg-blue-500/50" : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {saving ? <LoadingSpinner size="sm" /> : <Save size={16} />}
                    Save course details
                  </button>
                </div>

                {/* Sections */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <h2 className="text-lg font-semibold inline-flex items-center gap-2">
                      <Layers size={18} className="text-amber-400" />
                      Sections & lectures
                    </h2>
                    <div className="flex gap-2 flex-1 max-w-md">
                      <input
                        className="flex-1 bg-zinc-800 rounded p-2 text-sm"
                        placeholder="New section title…"
                        value={newSectionTitle}
                        onChange={(e) => setNewSectionTitle(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addSection()}
                      />
                      <button
                        type="button"
                        disabled={addingSection || !newSectionTitle.trim()}
                        onClick={addSection}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-sm disabled:opacity-50"
                      >
                        {addingSection ? <LoadingSpinner size="sm" /> : <Plus size={16} />}
                        Add
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {sortedSections.length === 0 ? (
                      <p className="text-sm text-zinc-500">
                        No sections yet. Add a section, then upload lectures into it — or use flat
                        lectures below without a section.
                      </p>
                    ) : (
                      sortedSections.map((sec, idx) => (
                        <SectionBlock
                          key={sec._id}
                          courseId={selectedId}
                          section={sec}
                          index={idx}
                          total={sortedSections.length}
                          onRefresh={refresh}
                          onMove={(dir) => moveSection(idx, dir)}
                        />
                      ))
                    )}
                  </div>
                </div>

                {/* Flat lectures */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
                  <h2 className="text-lg font-semibold mb-1 inline-flex items-center gap-2">
                    <Film size={18} className="text-blue-400" />
                    Lectures without a section
                  </h2>
                  <p className="text-xs text-zinc-500 mb-4">
                    Optional — use for standalone videos not grouped into a section.
                  </p>
                  <div className="space-y-3 mb-4">
                    {flatLectures.length === 0 ? (
                      <p className="text-sm text-zinc-500">No flat lectures.</p>
                    ) : (
                      flatLectures.map((lec) => (
                        <LectureRow key={lec._id} lecture={lec} onRefresh={refresh} />
                      ))
                    )}
                  </div>
                  <LectureUploadForm
                    courseId={selectedId}
                    defaultOrder={flatLectures.length}
                    onUploaded={refresh}
                  />
                </div>
              </>
            ) : (
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-red-400">
                {status || "Failed to load course."}
              </div>
            )}

            {status && course && (
              <p className="text-sm text-zinc-400 border border-zinc-800 bg-zinc-900 rounded p-3">
                {status}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
