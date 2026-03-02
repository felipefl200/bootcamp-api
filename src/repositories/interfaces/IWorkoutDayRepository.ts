import {
  WorkoutDay,
  WorkoutExercise,
  WorkoutSession
} from '../../generated/prisma/client.js'

export type WorkoutDayWithExercises = WorkoutDay & {
  workoutExercises: WorkoutExercise[]
}

export type WorkoutDayWithExercisesAndSessions = WorkoutDayWithExercises & {
  workoutSessions: WorkoutSession[]
}

export interface IWorkoutDayRepository {
  findById(id: string): Promise<WorkoutDay | null>
  findByIdWithExercises(id: string): Promise<WorkoutDayWithExercises | null>
  findByIdWithExercisesAndSessions(
    id: string
  ): Promise<WorkoutDayWithExercisesAndSessions | null>
}
