"use client";
import { useState, useEffect } from "react";
import apiClient from "../lib/api";

export interface Course {
  _id: string;
  title: string;
  slug: string;
  shortDescription?: string;
  thumbnail?: { url?: string };
  price: number;
  isFree: boolean;
  level: "beginner" | "intermediate" | "advanced";
  language: string;
  totalDuration: number; // seconds
  totalEnrollments: number;
  ratingsAverage: number;
  ratingsQuantity: number;
  category?: string;
  tags: string[];
  instructor: { _id: string; fullname: string; avatar?: string };
  createdAt: string;
}

interface UseCourses {
  courses: Course[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useCourses = (): UseCourses => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get("/courses");
      // backend wraps in ApiResponse: { data: [...] }
      const data = res.data?.data ?? res.data;
      setCourses(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch courses");
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  return { courses, loading, error, refetch: fetchCourses };
};
