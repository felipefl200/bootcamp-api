import { WorkoutSession } from '../../generated/prisma/client.js'
import { prisma } from '../../lib/db.js'
import { IWorkoutSessionRepository } from '../interfaces/IWorkoutSessionRepository.js'

export class PrismaWorkoutSessionRepository implements IWorkoutSessionRepository {
  async findById(id: string): Promise<WorkoutSession | null> {
    return prisma.workoutSession.findUnique({
      where: { id }
    })
  }

  async findActiveSessionForDay(
    workoutDayId: string
  ): Promise<WorkoutSession | null> {
    return prisma.workoutSession.findFirst({
      where: {
        workoutDayId,
        completedAt: null // Sessão que ainda não foi finalizada
      }
    })
  }

  async findSessionsInPeriod(
    userId: string,
    from: Date,
    to: Date
  ): Promise<WorkoutSession[]> {
    return prisma.workoutSession.findMany({
      where: {
        workoutDay: {
          workoutPlan: {
            userId
          }
        },
        startedAt: {
          gte: from,
          lte: to
        }
      },
      orderBy: {
        startedAt: 'desc'
      }
    })
  }

  async create(workoutDayId: string): Promise<WorkoutSession> {
    return prisma.workoutSession.create({
      data: { workoutDayId, startedAt: new Date() }
    })
  }

  async markAsCompleted(
    id: string,
    startedAt: Date,
    completedAt: Date
  ): Promise<WorkoutSession> {
    return prisma.workoutSession.update({
      where: { id },
      data: {
        startedAt,
        completedAt
      }
    })
  }
}
