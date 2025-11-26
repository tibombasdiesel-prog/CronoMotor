import z from "zod";

export const UserSchema = z.object({
  id: z.number(),
  full_name: z.string(),
  username: z.string(),
  is_admin: z.boolean(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type User = z.infer<typeof UserSchema>;

export const LoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().length(4),
});

export const CreateUserSchema = z.object({
  full_name: z.string().min(1),
  username: z.string().min(1),
  password: z.string().length(4),
});

export const EngineSessionSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  os_number: z.string(),
  engine_model: z.string(),
  status: z.enum(['active', 'paused', 'finished']),
  started_at: z.string(),
  finished_at: z.string().nullable(),
  total_time_seconds: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type EngineSession = z.infer<typeof EngineSessionSchema>;

export const PauseSchema = z.object({
  id: z.number(),
  session_id: z.number(),
  paused_at: z.string(),
  resumed_at: z.string().nullable(),
  observation: z.string(),
  duration_seconds: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Pause = z.infer<typeof PauseSchema>;

export const StartSessionSchema = z.object({
  os_number: z.string().min(1),
  engine_model: z.string().min(1),
});

export const PauseSessionSchema = z.object({
  observation: z.string().min(1),
});
