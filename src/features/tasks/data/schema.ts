import { z } from 'zod'

export const taskInputSchema = z.object({
  title: z.string().trim().min(1, 'Title is required.'),
  status: z.enum(['todo', 'in progress', 'done', 'canceled', 'backlog']),
  label: z.enum(['bug', 'feature', 'documentation']),
  priority: z.enum(['low', 'medium', 'high']),
})

export const taskSchema = taskInputSchema.extend({ id: z.string().min(1) })

export type Task = z.infer<typeof taskSchema>
export type TaskInput = z.infer<typeof taskInputSchema>

export type TaskWrite =
  | { type: 'create'; values: TaskInput }
  | { type: 'update'; ids: string[]; changes: Partial<TaskInput> }
  | { type: 'delete'; ids: string[] }
