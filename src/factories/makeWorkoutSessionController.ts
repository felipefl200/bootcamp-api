import {
  StartWorkoutSessionController,
  UpdateWorkoutSessionController
} from '../controllers/WorkoutSessionController.js'
import { PrismaWorkoutDayRepository } from '../repositories/prisma/PrismaWorkoutDayRepository.js'
import { PrismaWorkoutPlanRepository } from '../repositories/prisma/PrismaWorkoutPlanRepository.js'
import { PrismaWorkoutSessionRepository } from '../repositories/prisma/PrismaWorkoutSessionRepository.js'
import { StartWorkoutSession } from '../usecases/StartWorkoutSession.js'
import { UpdateWorkoutSession } from '../usecases/UpdateWorkoutSession.js'

export const makeStartWorkoutSessionController = () => {
  const workoutPlanRepository = new PrismaWorkoutPlanRepository()
  const workoutDayRepository = new PrismaWorkoutDayRepository()
  const workoutSessionRepository = new PrismaWorkoutSessionRepository()

  const useCase = new StartWorkoutSession(
    workoutPlanRepository,
    workoutDayRepository,
    workoutSessionRepository
  )
  return new StartWorkoutSessionController(useCase)
}

export const makeUpdateWorkoutSessionController = () => {
  const workoutPlanRepository = new PrismaWorkoutPlanRepository()
  const workoutSessionRepository = new PrismaWorkoutSessionRepository()

  const useCase = new UpdateWorkoutSession(
    workoutPlanRepository,
    workoutSessionRepository
  )
  return new UpdateWorkoutSessionController(useCase)
}
