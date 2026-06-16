import apiClient from "@/lib/api";

export type CourseLevel = "beginner" | "intermediate" | "advanced";

export interface ThumbnailRef {
  url?: string;
  public_id?: string;
}

export interface CourseAdminSummary {
  _id: string;
  title: string;
  slug: string;
  isPublished: boolean;
  price: number;
  isFree: boolean;
  totalDuration: number;
  thumbnail?: ThumbnailRef;
  createdAt: string;
}

export interface LectureAdmin {
  _id: string;
  title: string;
  description?: string;
  duration: number;
  order: number;
  section?: string | null;
  isPreviewFree: boolean;
  isPublished: boolean;
  processingStatus: string;
  videoKey?: string;
  thumbnail?: ThumbnailRef;
}

export interface SectionAdmin {
  _id: string;
  title: string;
  order: number;
  lectures: LectureAdmin[];
}

export interface CourseAdminDetail {
  _id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  isFree: boolean;
  isPublished: boolean;
  category?: string;
  tags: string[];
  level: CourseLevel;
  language: string;
  requirements: string[];
  learningOutcomes: string[];
  totalDuration: number;
  thumbnail?: ThumbnailRef;
  sections: SectionAdmin[];
  lectures: LectureAdmin[];
}

export interface CreateCoursePayload {
  title: string;
  description: string;
  shortDescription?: string;
  price?: number;
  isFree?: boolean;
  category?: string;
  tags?: string[];
  level?: CourseLevel;
  language?: string;
  requirements?: string[];
  learningOutcomes?: string[];
}

function unwrap<T>(res: { data?: { data?: T } }): T {
  return (res.data?.data ?? res.data) as T;
}

function parseApiError(err: unknown): string {
  const e = err as { response?: { data?: { message?: string } }; message?: string };
  return e?.response?.data?.message || e?.message || "Request failed";
}

export async function listCoursesAdmin(): Promise<CourseAdminSummary[]> {
  const res = await apiClient.get("/courses/admin/all");
  return unwrap<CourseAdminSummary[]>(res) ?? [];
}

export async function getCourseAdmin(id: string): Promise<CourseAdminDetail> {
  const res = await apiClient.get(`/courses/admin/${id}`);
  return unwrap<CourseAdminDetail>(res);
}

export async function createCourse(payload: CreateCoursePayload) {
  const res = await apiClient.post("/courses", payload);
  return unwrap<CourseAdminDetail>(res);
}

export async function updateCourse(id: string, payload: Partial<CreateCoursePayload>) {
  const res = await apiClient.put(`/courses/${id}`, payload);
  return unwrap<CourseAdminDetail>(res);
}

export async function publishCourse(id: string) {
  const res = await apiClient.patch(`/courses/${id}/publish`);
  return unwrap(res);
}

export async function unpublishCourse(id: string) {
  const res = await apiClient.patch(`/courses/${id}/unpublish`);
  return unwrap(res);
}

export async function deleteCourse(id: string) {
  await apiClient.delete(`/courses/${id}`);
}

export async function createSection(courseId: string, title: string, order?: number) {
  const res = await apiClient.post(`/courses/${courseId}/sections`, { title, order });
  return unwrap<SectionAdmin>(res);
}

export async function updateSection(
  courseId: string,
  sectionId: string,
  payload: { title?: string; order?: number }
) {
  const res = await apiClient.put(`/courses/${courseId}/sections/${sectionId}`, payload);
  return unwrap<SectionAdmin>(res);
}

export async function deleteSection(courseId: string, sectionId: string) {
  await apiClient.delete(`/courses/${courseId}/sections/${sectionId}`);
}

export async function reorderSections(courseId: string, orderedIds: string[]) {
  await apiClient.patch(`/courses/${courseId}/sections/reorder`, { orderedIds });
}

export async function uploadLecture(
  formData: FormData,
  onProgress?: (pct: number) => void
): Promise<LectureAdmin> {
  const res = await apiClient.post("/lectures/upload", formData, {
    timeout: 0,
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (evt) => {
      if (evt.total && onProgress) {
        onProgress(Math.round((evt.loaded / evt.total) * 100));
      }
    },
  });
  return unwrap<LectureAdmin>(res);
}

export async function updateLecture(
  lectureId: string,
  payload: Partial<{
    title: string;
    description: string;
    order: number;
    isPreviewFree: boolean;
    isPublished: boolean;
  }>
) {
  const res = await apiClient.patch(`/lectures/${lectureId}`, payload);
  return unwrap<LectureAdmin>(res);
}

export async function deleteLecture(lectureId: string) {
  await apiClient.delete(`/lectures/${lectureId}`);
}

export async function uploadCourseThumbnail(courseId: string, file: File): Promise<ThumbnailRef> {
  const fd = new FormData();
  fd.append("thumbnail", file);
  const res = await apiClient.patch(`/courses/${courseId}/thumbnail`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return unwrap<ThumbnailRef>(res);
}

export async function uploadLectureThumbnail(lectureId: string, file: File): Promise<ThumbnailRef> {
  const fd = new FormData();
  fd.append("thumbnail", file);
  const res = await apiClient.patch(`/lectures/${lectureId}/thumbnail`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return unwrap<ThumbnailRef>(res);
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function parseLines(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export function joinLines(items: string[] | undefined): string {
  return (items ?? []).join("\n");
}

export { parseApiError };
