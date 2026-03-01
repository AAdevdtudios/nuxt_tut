import { z } from "zod";

/**
 * Library validation schemas using Zod
 * Ensures type-safe validation for all library operations
 */

// Library type enum - matches Strapi CMS field values
export const LibraryTypeEnum = z.enum(["url", "doc", "note"]);
export type LibraryType = z.infer<typeof LibraryTypeEnum>;

/**
 * Query parameters validation for fetching libraries
 */
export const LibrariesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().optional(),
  libraryType: z.enum(["all", "url", "doc", "note"]).optional(),
});

export type LibrariesQuery = z.infer<typeof LibrariesQuerySchema>;

/**
 * Create library validation schema
 */
export const LibraryCreateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(255, "Title must be less than 255 characters"),
  libraryType: LibraryTypeEnum,
  url: z.string().url("Invalid URL format").nullable().optional(),
  content: z.string().max(10000, "Content too long").nullable().optional(),
  docID: z.union([z.number(), z.string()]).nullable().optional(),
  libUUID: z.string().optional(),
  locale: z.string().optional(),
});

export type LibraryCreate = z.infer<typeof LibraryCreateSchema>;

/**
 * Update library validation schema (all fields optional)
 */
export const LibraryUpdateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(255, "Title must be less than 255 characters")
    .optional(),
  libraryType: LibraryTypeEnum.optional(),
  url: z.string().url("Invalid URL format").nullable().optional(),
  content: z.string().max(10000, "Content too long").nullable().optional(),
  docID: z.union([z.number(), z.string()]).nullable().optional(),
});

export type LibraryUpdate = z.infer<typeof LibraryUpdateSchema>;

/**
 * Library response schema (from Strapi)
 */
export const LibraryItemSchema = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
  url: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  docID: z.union([z.number(), z.string()]).nullable().optional(),
  libraryType: LibraryTypeEnum,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  publishedAt: z.string().datetime().nullable().optional(),
  libUUID: z.string().optional(),
});

export type LibraryItem = z.infer<typeof LibraryItemSchema>;

/**
 * Pagination metadata schema
 */
export const PaginationMetaSchema = z.object({
  pagination: z.object({
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    pageCount: z.number().int().nonnegative(),
    total: z.number().int().nonnegative(),
  }),
});

export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;

/**
 * Libraries list response schema
 */
export const LibrariesResponseSchema = z.object({
  data: z.array(LibraryItemSchema),
  meta: PaginationMetaSchema,
});

export type LibrariesResponse = z.infer<typeof LibrariesResponseSchema>;

/**
 * Single library response schema
 */
export const LibrarySingleResponseSchema = z.object({
  data: LibraryItemSchema,
});

export type LibrarySingleResponse = z.infer<typeof LibrarySingleResponseSchema>;

/**
 * Upload response schema
 */
export const UploadedFileSchema = z.object({
  id: z.number(),
  name: z.string(),
  alternativeText: z.string().nullable().optional(),
  caption: z.string().nullable().optional(),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  formats: z.record(z.string(), z.any()).nullable().optional(),
  hash: z.string(),
  ext: z.string(),
  mime: z.string(),
  size: z.number(),
  url: z.string(),
  previewUrl: z.string().nullable().optional(),
  provider: z.string(),
  provider_metadata: z.record(z.string(), z.any()).nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type UploadedFile = z.infer<typeof UploadedFileSchema>;

export const UploadResponseSchema = z.array(UploadedFileSchema);

export type UploadResponse = z.infer<typeof UploadResponseSchema>;

/**
 * Validates and parses library query parameters
 */
export function parseLibrariesQuery(data: unknown) {
  return LibrariesQuerySchema.parse(data);
}

/**
 * Validates library creation payload
 */
export function validateLibraryCreate(data: unknown) {
  return LibraryCreateSchema.parse(data);
}

/**
 * Validates library update payload
 */
export function validateLibraryUpdate(data: unknown) {
  return LibraryUpdateSchema.parse(data);
}
