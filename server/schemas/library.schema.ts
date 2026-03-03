import { z } from "zod";

export const LibraryTypeEnum = z.enum(["url", "doc", "note"]);
export type LibraryType = z.infer<typeof LibraryTypeEnum>;

export const LibrariesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().optional(),
  libraryType: z.enum(["all", "url", "doc", "note"]).optional(),
  type: z.enum(["all", "url", "doc", "note"]).optional(),
});

export const LibraryCreateSchema = z
  .object({
    title: z.string().trim().min(1).max(255),
    libraryType: LibraryTypeEnum.optional(),
    type: LibraryTypeEnum.optional(),
    url: z.string().url().nullable().optional(),
    docsUrl: z.string().url().nullable().optional(),
    content: z.string().max(10000).nullable().optional(),
  })
  .refine((data) => Boolean(data.libraryType || data.type), {
    message: "libraryType is required",
    path: ["libraryType"],
  });

export const LibraryUpdateSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  libraryType: LibraryTypeEnum.optional(),
  type: LibraryTypeEnum.optional(),
  url: z.string().url().nullable().optional(),
  docsUrl: z.string().url().nullable().optional(),
  content: z.string().max(10000).nullable().optional(),
});

export function parseLibrariesQuery(data: unknown) {
  const parsed = LibrariesQuerySchema.parse(data);

  return {
    ...parsed,
    libraryType: parsed.libraryType || parsed.type,
  };
}

export function validateLibraryCreate(data: unknown) {
  const parsed = LibraryCreateSchema.parse(data);

  return {
    ...parsed,
    libraryType: parsed.libraryType || parsed.type!,
  };
}

export function validateLibraryUpdate(data: unknown) {
  const parsed = LibraryUpdateSchema.parse(data);

  return {
    ...parsed,
    libraryType: parsed.libraryType || parsed.type,
  };
}
