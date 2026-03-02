import { WorkoutPlan } from '../../generated/prisma/client.js'
import { prisma } from '../../lib/db.js'
import {
  CreateWorkoutPlanPayload,
  IWorkoutPlanRepository,
  WorkoutPlanFullData,
  WorkoutPlanWithDays
} from '../interfaces/IWorkoutPlanRepository.js'

export class PrismaWorkoutPlanRepository implements IWorkoutPlanRepository {
  async findById(id: string): Promise<WorkoutPlan | null> {
    return prisma.workoutPlan.findUnique({ where: { id } })
  }

  async findByIdWithDays(id: string): Promise<WorkoutPlanWithDays | null> {
    return prisma.workoutPlan.findUnique({
      where: { id },
      include: {
        workoutDays: {
          select: {
            id: true,
            name: true,
            weekDay: true,
            isRest: true,
            coverImageUrl: true,
            workoutExercises: {
              select: {
                id: true // usado pra contagem na camada acima
              }
            }
          },
          orderBy: {
            createdAt: 'asc' // ou ordernar por weekDay
          }
        }
      }
    })
  }

  async findActiveByUserId(
    userId: string
  ): Promise<WorkoutPlanWithDays | null> {
    return prisma.workoutPlan.findFirst({
      where: {
        userId,
        isActive: true
      },
      include: {
        workoutDays: {
          select: {
            id: true,
            name: true,
            weekDay: true,
            isRest: true,
            coverImageUrl: true,
            workoutExercises: {
              select: {
                id: true
              }
            }
          }
        }
      }
    })
  }

  async findManyByUserId(
    userId: string
  ): Promise<Pick<WorkoutPlan, 'id' | 'name' | 'isActive' | 'createdAt'>[]> {
    return prisma.workoutPlan.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        isActive: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  async createWithDeactivation(
    input: CreateWorkoutPlanPayload
  ): Promise<WorkoutPlanFullData> {
    // Desconstrui user/nome do resto
    const { userId, name, isActive = true, workoutDays } = input

    return prisma.$transaction(async (tx) => {
      // 1. Procurar plano ativo
      const activePlan = await tx.workoutPlan.findFirst({
        where: { userId, isActive: true }
      })

      // 2. Desativar se existir
      if (activePlan) {
        await tx.workoutPlan.update({
          where: { id: activePlan.id },
          data: { isActive: false }
        })
      }

      // 3. Criar
      return tx.workoutPlan.create({
        data: {
          name,
          userId,
          isActive,
          workoutDays: {
            create: workoutDays.map((day) => ({
              name: day.name,
              weekDay: day.weekDay,
              isRest: day.isRest,
              coverImageUrl: day.coverImageUrl,
              workoutExercises: {
                create: day.workoutExercises.map((ex) => ({
                  order: ex.order,
                  name: ex.name,
                  set: ex.set,
                  rep: ex.rep,
                  restTime: ex.restTime
                }))
              }
            }))
          }
        },
        include: {
          workoutDays: {
            include: {
              workoutExercises: true
            }
          }
        }
      }) as unknown as WorkoutPlanFullData
    })
  }
}
