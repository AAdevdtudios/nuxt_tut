import type {
  ProjectIcon,
  ProjectItem,
  ProjectLibrary,
  ProjectsResponse,
  ProjectSingleResponse,
} from "~/types/project.types";

type UnknownRecord = Record<string, any>;

const PROJECT_ICONS: ProjectIcon[] = [
  "graduation-cap",
  "file-text",
  "atom",
  "presentation",
  "book-open",
  "folder",
  "target",
  "sparkles",
];

export function normalizeProjectIcon(value: unknown): ProjectIcon {
  if (typeof value === "string" && PROJECT_ICONS.includes(value as ProjectIcon)) {
    return value as ProjectIcon;
  }

  if (typeof value === "number" && PROJECT_ICONS[value]) {
    return PROJECT_ICONS[value];
  }

  if (typeof value === "string") {
    const normalized = value
      .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
      .replace(/_/g, "-")
      .toLowerCase();

    if (PROJECT_ICONS.includes(normalized as ProjectIcon)) {
      return normalized as ProjectIcon;
    }
  }

  return "folder";
}

export function toProjectIconEnum(value: ProjectIcon | undefined): number | undefined {
  if (!value) return undefined;
  const index = PROJECT_ICONS.indexOf(value);
  return index >= 0 ? index : undefined;
}

function normalizeProjectLibrary(input: unknown): ProjectLibrary {
  const item = (input || {}) as UnknownRecord;
  const id = String(item.id || item.documentId || item.libraryItemId || "");
  const libraryType = item.libraryType ?? item.type ?? "note";

  return {
    id,
    documentId: id,
    title: item.title || "",
    url: item.url ?? null,
    content: item.content ?? null,
    docID: item.docID ?? item.fileId ?? null,
    libraryType:
      libraryType === "url" || libraryType === "doc" || libraryType === "note"
        ? libraryType
        : libraryType === "document"
          ? "doc"
          : "note",
    createdAt: item.createdAt ?? item.createdAtUtc ?? new Date().toISOString(),
    updatedAt: item.updatedAt ?? item.updatedAtUtc ?? new Date().toISOString(),
    publishedAt: item.publishedAt ?? null,
    libUUID: item.libUUID ?? id,
  };
}

export function normalizeProjectItem(input: unknown): ProjectItem {
  const item = (input || {}) as UnknownRecord;
  const id = String(
    item.id || item.documentId || item.projectId || item.projectUuid || "",
  );
  const libraries = Array.isArray(item.libraries)
    ? item.libraries
    : Array.isArray(item.libraryItems)
      ? item.libraryItems
      : Array.isArray(item.items)
        ? item.items
        : [];
  const normalizedLibraries = libraries.map(normalizeProjectLibrary);
  const noteLibraries = normalizedLibraries.filter(
    (library) => library.libraryType === "note",
  );
  const nonNoteLibraries = normalizedLibraries.filter(
    (library) => library.libraryType !== "note",
  );

  return {
    id,
    documentId: id,
    title: item.title || item.name || "",
    description: item.description ?? null,
    icons: normalizeProjectIcon(item.icon ?? item.icons),
    color: item.color ?? "6b7280",
    start: item.start ?? item.startAtUtc ?? item.createdAt ?? new Date().toISOString(),
    end: item.end ?? item.endAtUtc ?? item.updatedAt ?? new Date().toISOString(),
    createdAt: item.createdAt ?? item.createdAtUtc ?? new Date().toISOString(),
    updatedAt: item.updatedAt ?? item.updatedAtUtc ?? new Date().toISOString(),
    publishedAt: item.publishedAt ?? null,
    libraries: nonNoteLibraries,
    librariesCount: Number(
      item.librariesCount ??
        item.libraryCount ??
        item.totalLibraries ??
        nonNoteLibraries.length,
    ),
    notesCount: Number(
      item.notesCount ?? item.noteCount ?? item.totalNotes ?? noteLibraries.length,
    ),
  };
}

export function normalizeProjectsResponse(input: unknown): ProjectsResponse {
  const response = (input || {}) as UnknownRecord;
  const items = Array.isArray(response.items)
    ? response.items
    : Array.isArray(response.data)
      ? response.data
      : [];
  const page = Number(response.page ?? response.meta?.pagination?.page ?? 1);
  const pageSize = Number(
    response.pageSize ??
      response.meta?.pagination?.pageSize ??
      items.length ??
      10,
  );
  const total = Number(
    response.totalCount ?? response.count ?? response.meta?.pagination?.total ?? items.length,
  );

  return {
    data: items.map(normalizeProjectItem),
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

export function normalizeProjectSingleResponse(input: unknown): ProjectSingleResponse {
  const response = (input || {}) as UnknownRecord;
  const item =
    response.data && !Array.isArray(response.data) ? response.data : response;

  return {
    data: normalizeProjectItem(item),
  };
}

