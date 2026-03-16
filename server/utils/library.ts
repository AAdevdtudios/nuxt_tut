import type {
  LibraryItem,
  LibrariesResponse,
  LibrarySingleResponse,
} from "~/types/library.types";

type UnknownRecord = Record<string, any>;

function normalizeLibraryType(value: unknown): LibraryItem["libraryType"] {
  if (value === "url" || value === "note" || value === "doc") {
    return value;
  }

  if (value === "docs" || value === "Docs" || value === "DOCS") return "doc";
  if (value === "document" || value === "Document" || value === "DOCUMENT") return "doc";
  if (value === "url" || value === "Url" || value === "URL") return "url";
  if (value === "note" || value === "Note" || value === "NOTE") return "note";
  if (value === 0) return "doc";
  if (value === 1) return "url";
  if (value === 2) return "note";
  if (value === "0") return "doc";
  if (value === "1") return "url";
  if (value === "2") return "note";
  return "note";
}

export function toBackendLibraryType(
  value: LibraryItem["libraryType"] | undefined,
): "Docs" | "Url" | "Note" | undefined {
  if (!value) return undefined;
  if (value === "doc") return "Docs";
  if (value === "url") return "Url";
  if (value === "note") return "Note";
  return undefined;
}

export function normalizeLibraryItem(input: unknown): LibraryItem {
  const item = (input || {}) as UnknownRecord;
  const id = String(
    item.id ||
      item.documentId ||
      item.libraryItemId ||
      item.libraryItemIdGuid ||
      "",
  );

  return {
    id,
    documentId: id,
    title: item.title ?? item.Title ?? "",
    url: item.url ?? item.Url ?? null,
    content: item.content ?? item.Content ?? null,
    docID: item.docID ?? item.documentId ?? item.fileId ?? null,
    libraryType: normalizeLibraryType(
      item.type ??
        item.Type ??
        item.libraryType ??
        item.LibraryType ??
        item.libraryItemType ??
        item.LibraryItemType,
    ),
    createdAt: item.createdAt ?? item.createdAtUtc ?? new Date().toISOString(),
    updatedAt: item.updatedAt ?? item.updatedAtUtc ?? new Date().toISOString(),
    publishedAt: item.publishedAt ?? null,
    libUUID: item.libUUID ?? id,
    fileName: item.fileName ?? item.documentName ?? null,
    fileUrl: item.fileUrl ?? item.documentUrl ?? item.docsUrl ?? item.DocsUrl ?? null,
  };
}

export function normalizeLibrariesResponse(input: unknown): LibrariesResponse {
  const response = (input || {}) as UnknownRecord;
  const nestedData =
    response.data && typeof response.data === "object"
      ? (response.data as UnknownRecord)
      : null;
  const items = Array.isArray(response.items)
    ? response.items
    : Array.isArray(response.data)
      ? response.data
      : Array.isArray(nestedData?.items)
        ? nestedData!.items
        : Array.isArray(nestedData?.data)
          ? nestedData!.data
          : [];
  const rawPageSize =
    response.pageSize ??
    nestedData?.pageSize ??
    response.meta?.pagination?.pageSize ??
    nestedData?.meta?.pagination?.pageSize ??
    items.length ??
    25;
  const rawTotal =
    response.totalCount ??
    response.count ??
    nestedData?.totalCount ??
    nestedData?.count ??
    response.meta?.pagination?.total ??
    nestedData?.meta?.pagination?.total ??
    items.length;

  const page = Number(
    response.page ??
      nestedData?.page ??
      response.meta?.pagination?.page ??
      nestedData?.meta?.pagination?.page ??
      1,
  );
  const pageSize = Number(rawPageSize || 25);
  const total = Number(rawTotal || items.length);

  return {
    data: items.map(normalizeLibraryItem),
    meta: {
      pagination: {
        page,
        pageSize,
        pageCount: Math.max(1, Math.ceil(total / Math.max(1, pageSize))),
        total,
      },
    },
  };
}

export function normalizeLibrarySingleResponse(
  input: unknown,
): LibrarySingleResponse {
  const response = (input || {}) as UnknownRecord;
  const item =
    response.data && !Array.isArray(response.data) ? response.data : response;

  return {
    data: normalizeLibraryItem(item),
  };
}
