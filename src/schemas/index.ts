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
  id: z.uuid(),
  dayId: z.uuid()
})

export const StartWorkoutSessionResponseSchema = z.object({
  userWorkoutSessionId: z.cuid()
})

export const UpdateWorkoutSessionParamsSchema = z.object({
  id: z.uuid(),
  dayId: z.string().uuid(),
  sessionId: z.string().cuid()
})

export const UpdateWorkoutSessionBodySchema = z.object({
  completedAt: z.string().datetime()
})

export const UpdateWorkoutSessionResponseSchema = z.object({
  id: z.cuid(),
  completedAt: z.iso.datetime(),
  startedAt: z.iso.datetime()
})
export const HomeParamsSchema = z.object({
  date: z.string().date()
})

export const HomeResponseSchema = z.object({
  activeWorkoutPlanId: z.string().nullable(),
  todayWorkoutDay: z
    .object({
      workoutPlanId: z.string(),
      id: z.string(),
      name: z.string(),
      isRest: z.boolean(),
      weekDay: z.enum(WeekDay),
      estimatedDurationInSeconds: z.number(),
      coverImageUrl: z.string().nullable(),
      exercisesCount: z.number()
    })
    .nullable(),
  workoutStreak: z.number(),
  consistencyByDay: z.record(
    z.string(),
    z.object({
      workoutDayCompleted: z.boolean(),
      workoutDayStarted: z.boolean()
    })
  )
})
export const GetWorkoutPlanParamsSchema = z.object({
  id: z.string().uuid()
})

export const GetWorkoutPlanResponseSchema = z.object({
  id: z.string().cuid(),
  name: z.string(),
  workoutDays: z.array(
    z.object({
      id: z.string().cuid(),
      weekDay: z.enum(WeekDay),
      name: z.string(),
      isRest: z.boolean(),
      coverImageUrl: z.string().nullable(),
      estimatedDurationInSeconds: z.number(),
      exercisesCount: z.number()
    })
  )
})
export const GetWorkoutDayParamsSchema = z.object({
  id: z.string().uuid(),
  dayId: z.string().uuid()
})

export const GetWorkoutDayResponseSchema = z.object({
  id: z.cuid(),
  name: z.string(),
  isRest: z.boolean(),
  coverImageUrl: z.string().nullable(),
  estimatedDurationInSeconds: z.number(),
  exercises: z.array(
    z.object({
      id: z.string().cuid(),
      name: z.string(),
      order: z.number(),
      set: z.number(),
      rep: z.number(),
      restTime: z.number(),
      workoutDayId: z.string()
    })
  ),
  weekDay: z.enum(WeekDay),
  sessions: z.array(
    z.object({
      id: z.cuid(),
      workoutDayId: z.string(),
      startedAt: z.date().optional(),
      completedAt: z.date().optional()
    })
  )
})
