import { NotFoundError } from '../errors/index.js'
import { WeekDay } from '../generated/prisma/enums.js'
import { prisma } from '../lib/db.js'

export interface CreateWorkoutPlanInputDto {
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

export interface CreateWorkoutPlanOutputDto {
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
  async execute(
    dto: CreateWorkoutPlanInputDto
  ): Promise<CreateWorkoutPlanOutputDto> {
    const existingWorkoutPlan = await prisma.workoutPlan.findFirst({
      where: {
        userId: dto.userId,
        isActive: true
      }
    })

    return prisma.$transaction(async (tx) => {
      if (existingWorkoutPlan) {
        await tx.workoutPlan.update({
          where: { id: existingWorkoutPlan.id },
          data: { isActive: false }
        })
      }

      const workoutPlan = await tx.workoutPlan.create({
        data: {
          name: dto.name,
          userId: dto.userId,
          isActive: true,
          workoutDays: {
            create: dto.workoutDays.map((day) => ({
              name: day.name,
              weekDay: day.weekDay,
              isRest: day.isRest,
              sessionId: dto.sessionId,
              workoutExercises: {
                create: day.workoutExercises.map((exercise) => ({
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
        throw new NotFoundError('Workout plan not found after creation')
      }

      return {
        id: result.id,
        name: result.name,
        isActive: result.isActive,
        workoutDays: result.workoutDays.map((day) => ({
          id: day.id,
          name: day.name,
          weekDay: day.weekDay as WeekDay,
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
