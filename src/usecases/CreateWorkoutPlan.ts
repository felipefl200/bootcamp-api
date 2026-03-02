import crypto from 'node:crypto'

import { NotFoundError } from '../errors/index.js'
import { WeekDay } from '../generated/prisma/enums.js'
import { prisma } from '../lib/db.js'

// Data Transfer Object
interface InputDto {
  userId: string
  sessionId: string
  name: string
  workoutDays: Array<{
    name: string
    weekDay: WeekDay
    isRest: boolean
    workoutExercises: Array<{
      order: number
      name: string
      set: number
      rep: number
      restTime: number
    }>
  }>
}

interface OutputDto {
  id: string
  name: string
  isActive: boolean
  workoutDays: Array<{
    id: string
    name: string
    weekDay: WeekDay
    isRest: boolean
    workoutExercises: Array<{
      id: string
      order: number
      name: string
      set: number
      rep: number
      restTime: number
    }>
  }>
}

export class CreateWorkoutPlan {
  async execute(dto: InputDto): Promise<OutputDto> {
    const existingWorkoutPlan = await prisma.workoutPlan.findFirst({
      where: {
        userId: dto.userId,
        isActive: true
      }
    })
    // Transaction - Atomicidade
    return prisma.$transaction(async (tx) => {
      if (existingWorkoutPlan) {
        await tx.workoutPlan.update({
          where: { id: existingWorkoutPlan.id },
          data: { isActive: false }
        })
      }
      const workoutPlan = await tx.workoutPlan.create({
        data: {
          id: crypto.randomUUID(),
          name: dto.name,
          userId: dto.userId,
          isActive: true,
          workoutDays: {
            create: dto.workoutDays.map((workoutDay) => ({
              id: crypto.randomUUID(),
              name: workoutDay.name,
              weekDay: workoutDay.weekDay,
              isRest: workoutDay.isRest,
              coverImageUrl: null,
              sessions: {
                connect: { id: dto.sessionId }
              },
              workoutExercises: {
                create: workoutDay.workoutExercises.map((exercise) => ({
                  id: crypto.randomUUID(),
                  name: exercise.name,
                  order: exercise.order,
                  set: exercise.set,
                  rep: exercise.rep,
                  restTime: exercise.restTime
                }))
              }
            }))
          }
        }
      })
      const result = await tx.workoutPlan.findUnique({
        where: { id: workoutPlan.id },
        include: {
          workoutDays: {
            include: {
              workoutExercises: true
            }
          }
        }
      })
      if (!result) {
        throw new NotFoundError('Workout plan not found')
      }
      return {
        id: result.id,
        name: result.name,
        isActive: result.isActive,
        workoutDays: result.workoutDays.map((day) => ({
          id: day.id,
          name: day.name,
          weekDay: day.weekDay,
          isRest: day.isRest,
          workoutExercises: day.workoutExercises.map((exercise) => ({
            id: exercise.id,
            order: exercise.order,
            name: exercise.name,
            set: exercise.set,
            rep: exercise.rep,
            restTime: exercise.restTime
          }))
        }))
      }
    })
  }
}
