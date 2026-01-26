// ~/schemas/subjects.step.schema.ts
import { z } from "zod";

export const SubjectsStepSchema = z
  .object({
    subjects: z
      .array(z.string().min(1))
      .min(1, "At least one subject is required"),

    prioritySubjects: z.array(z.string()),
  })
  .refine(
    (data) => data.prioritySubjects.every((p) => data.subjects.includes(p)),
    {
      message: "Priority subjects must be selected from subjects list",
      path: ["prioritySubjects"],
    }
  );

export type SubjectsStepData = z.infer<typeof SubjectsStepSchema>;
