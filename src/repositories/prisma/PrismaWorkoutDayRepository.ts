import { WorkoutDay } from '@prisma/client'

import { prisma } from '../../lib/db.js'
import {
  IWorkoutDayRepository,
  WorkoutDayWithExercises,
  WorkoutDayWithExercisesAndSessions
} from '../interfaces/IWorkoutDayRepository.js'

export class PrismaWorkoutDayRepository implements IWorkoutDayRepository {
  async findById(id: string): Promise<WorkoutDay | null> {
    return prisma.workoutDay.findUnique({
      where: { id }
    })
  }

  async findByIdWithExercises(
    id: string
  ): Promise<WorkoutDayWithExercises | null> {
    return prisma.workoutDay.findUnique({
      where: { id },
      include: {
        workoutExercises: {
          orderBy: { order: 'asc' }
        }
      }
    })
  }

  async findByIdWithExercisesAndSessions(
    id: string
  ): Promise<WorkoutDayWithExercisesAndSessions | null> {
    return prisma.workoutDay.findUnique({
      where: { id },
      include: {
        workoutExercises: {
          orderBy: { order: 'asc' }
        },
        workoutSessions: {
          orderBy: { startedAt: 'desc' },
          take: 1 // Geralmente nos interessa a última/atual sessão, porém a rota pegava todas nas specs originais
        }
      }
    })
  }
}
