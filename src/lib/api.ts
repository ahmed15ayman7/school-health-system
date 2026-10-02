import { NextResponse } from "next/server";

export type ApiMeta = {
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
};

export type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; details?: unknown };
  meta?: ApiMeta;
};

export function ok<T>(data: T, meta?: ApiMeta, status = 200) {
  const body: ApiEnvelope<T> = { success: true, data, meta };
  return NextResponse.json(body, { status });
}

export function fail(code: string, message: string, status = 400, details?: unknown) {
  const body: ApiEnvelope<never> = {
    success: false,
    error: { code, message, details },
  };
  return NextResponse.json(body, { status });
}

export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const rawSize = parseInt(searchParams.get("pageSize") ?? searchParams.get("limit") ?? "20", 10) || 20;
  const pageSize = Math.min(100, Math.max(1, rawSize));
  return { page, pageSize, skip: (page - 1) * pageSize };
}

export function paginationMeta(total: number, page: number, pageSize: number): ApiMeta {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize) || 1,
  };
}
