import type {
  Category,
  CategoriesResponse,
  Explore,
  ExploresResponse,
} from "~/types/explore.types";

type UnknownRecord = Record<string, any>;

export function normalizeCategory(input: unknown): Category {
  const item = (input || {}) as UnknownRecord;

  return {
    id: String(item.id || ""),
    name: item.name || "",
    description: item.description ?? null,
    createdAtUtc: item.createdAtUtc,
  };
}

export function normalizeExplore(input: unknown): Explore {
  const item = (input || {}) as UnknownRecord;

  return {
    id: String(item.id || ""),
    title: item.title || item.Title || "",
    description: item.description || item.Description || "",
    copyright: item.copyright || item.Copyright || "",
    url: item.url || "",
    categoryId: String(item.categoryId || ""),
    downloads: Number(item.downloads ?? item.Downloads ?? 0),
    createdAtUtc: item.createdAtUtc,
    updatedAtUtc: item.updatedAtUtc,
  };
}

export function normalizeCategoriesResponse(input: unknown): CategoriesResponse {
  const response = (input || {}) as UnknownRecord;
  const items = Array.isArray(response.items)
    ? response.items.map(normalizeCategory)
    : Array.isArray(response.data)
      ? response.data.map(normalizeCategory)
      : [];

  return {
    items,
    count: Number(response.count ?? items.length),
    totalCount: Number(response.totalCount ?? response.count ?? items.length),
    page: Number(response.page ?? 1),
    pageSize: Number((response.pageSize ?? items.length) || 20),
  };
}

export function normalizeExploresResponse(input: unknown): ExploresResponse {
  const response = (input || {}) as UnknownRecord;
  const items = Array.isArray(response.items)
    ? response.items.map(normalizeExplore)
    : Array.isArray(response.data)
      ? response.data.map(normalizeExplore)
      : [];

  return {
    items,
    count: Number(response.count ?? items.length),
    totalCount: Number(response.totalCount ?? response.count ?? items.length),
    page: Number(response.page ?? 1),
    pageSize: Number((response.pageSize ?? items.length) || 10),
  };
}
