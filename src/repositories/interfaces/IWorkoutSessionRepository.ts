import { WorkoutSession } from '../../generated/prisma/client.js'

export interface IWorkoutSessionRepository {
  findById(id: string): Promise<WorkoutSession | null>
  findActiveSessionForDay(workoutDayId: string): Promise<WorkoutSession | null>

  findSessionsInPeriod(
    userId: string,
    from: Date,
    to: Date
  ): Promise<WorkoutSession[]>

  create(workoutDayId: string): Promise<WorkoutSession>
  markAsCompleted(
    id: string,
    startedAt: Date,
    completedAt: Date
  ): Promise<WorkoutSession>
}
