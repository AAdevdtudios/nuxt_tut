import { z } from "zod";

/**
 * Project validation schemas using Zod
 * Ensures type-safe validation for all project operations
 */

// Icon enum - valid icon types for projects
export const IconEnum = z.enum([
  "graduation-cap",
  "file-text",
  "atom",
  "presentation",
  "book-open",
  "folder",
  "target",
  "sparkles",
]);
export type Icon = z.infer<typeof IconEnum>;

/**
 * Query parameters validation for fetching projects
 */
export const ProjectsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().optional(),
});

export type ProjectsQuery = z.infer<typeof ProjectsQuerySchema>;

/**
 * Create project validation schema
 */
export const ProjectCreateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(255, "Title must be less than 255 characters"),
  description: z
    .string()
    .trim()
    .max(1000, "Description must be less than 1000 characters")
    .optional(),
  icons: IconEnum,
  color: z
    .string()
    .regex(/^[0-9a-fA-F]{6}$/, "Color must be a valid hex code (6 characters)"),
  start: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  end: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  libraries: z.array(z.string().uuid()).optional(),
});

export type ProjectCreate = z.infer<typeof ProjectCreateSchema>;

/**
 * Update project validation schema (all fields optional)
 */
export const ProjectUpdateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(255, "Title must be less than 255 characters")
    .optional(),
  description: z
    .string()
    .trim()
    .max(1000, "Description must be less than 1000 characters")
    .optional(),
  icons: IconEnum.optional(),
  color: z
    .string()
    .regex(/^[0-9a-fA-F]{6}$/, "Color must be a valid hex code")
    .optional(),
  start: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .optional(),
  end: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .optional(),
  libraries: z.array(z.string().uuid()).optional(),
});

export type ProjectUpdate = z.infer<typeof ProjectUpdateSchema>;

/**
 * Library item in project context (subset of full library data)
 */
export const ProjectLibrarySchema = z.object({
  id: z.string(),
  documentId: z.string(),
  title: z.string(),
  url: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  docID: z.union([z.number(), z.string()]).nullable().optional(),
  libraryType: z.enum(["url", "doc", "note"]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  publishedAt: z.string().datetime().nullable().optional(),
  libUUID: z.string().optional(),
});

export type ProjectLibrary = z.infer<typeof ProjectLibrarySchema>;

/**
 * Project response schema (from Strapi)
 */
export const ProjectItemSchema = z.object({
  id: z.string(),
  documentId: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  icons: IconEnum,
  color: z.string(),
  start: z.string().datetime(),
  end: z.string().datetime(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  publishedAt: z.string().datetime().nullable().optional(),
  libraries: z.array(ProjectLibrarySchema).optional(),
  librariesCount: z.number().optional(), // Total count of non-note libraries
});

export type ProjectItem = z.infer<typeof ProjectItemSchema>;

/**
 * Project response with libraries metadata
 */
export const ProjectWithMetaSchema = ProjectItemSchema.extend({
  librariesCount: z.number(),
  notesCount: z.number(),
});

export type ProjectWithMeta = z.infer<typeof ProjectWithMetaSchema>;

/**
 * Pagination metadata
 */
export const PaginationMetaSchema = z.object({
  page: z.number(),
  pageSize: z.number(),
  pageCount: z.number(),
  total: z.number(),
});

export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;

/**
 * Projects list response schema
 */
export const ProjectsResponseSchema = z.object({
  data: z.array(ProjectWithMetaSchema),
  meta: z.object({
    pagination: PaginationMetaSchema,
  }),
});

export type ProjectsResponse = z.infer<typeof ProjectsResponseSchema>;

/**
 * Single project response schema
 */
export const ProjectSingleResponseSchema = z.object({
  data: ProjectWithMetaSchema,
  meta: z.object({}).optional(),
});

export type ProjectSingleResponse = z.infer<typeof ProjectSingleResponseSchema>;

/**
 * Validates and parses project query parameters
 */
export function parseProjectsQuery(data: unknown) {
  return ProjectsQuerySchema.parse(data);
}

/**
 * Validates project creation payload
 */
export function validateProjectCreate(data: unknown) {
  return ProjectCreateSchema.parse(data);
}

/**
 * Validates project update payload
 */
export function validateProjectUpdate(data: unknown) {
  return ProjectUpdateSchema.parse(data);
}
