import { z } from 'zod'

import { WeekDay } from '../generated/prisma/enums.js'

export const ErrorSchema = z.object({
  error: z.string(),
  code: z.string()
})

export const WorkoutExerciseSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  order: z.number(),
  set: z.number(),
  rep: z.number(),
  restTime: z.number()
})

export const WorkoutDaySchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  weekDay: z.enum(WeekDay),
  isRest: z.boolean(),
  workoutExercises: z.array(WorkoutExerciseSchema)
})

export const WorkoutPlanSchema = z.object({
  id: z.string(),
  name: z.string(),
  isActive: z.boolean(),
  workoutDays: z.array(WorkoutDaySchema)
})

export const CreateWorkoutPlanParamsSchema = z.object({
  name: z.string(),
  workoutDays: z.array(
    z.object({
      name: z.string(),
      weekDay: z.enum(WeekDay),
      isRest: z.boolean(),
      workoutExercises: z.array(
        z.object({
          name: z.string(),
          order: z.number(),
          set: z.number(),
          rep: z.number(),
          restTime: z.number()
        })
      )
    })
  )
})

export const StartWorkoutSessionParamsSchema = z.object({
  id: z.string().uuid(),
  dayId: z.string().uuid()
})

export const StartWorkoutSessionResponseSchema = z.object({
  userWorkoutSessionId: z.string().cuid()
})

export const UpdateWorkoutSessionParamsSchema = z.object({
  id: z.string().uuid(),
  dayId: z.string().uuid(),
  sessionId: z.string().cuid()
})

export const UpdateWorkoutSessionBodySchema = z.object({
  completedAt: z.string().datetime()
})

export const UpdateWorkoutSessionResponseSchema = z.object({
  id: z.string().cuid(),
  completedAt: z.string().datetime(),
  startedAt: z.string().datetime()
})
