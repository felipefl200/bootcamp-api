import {
  GetHomeDataController,
  GetStatsController
} from '../controllers/DashboardController.js'
import { PrismaWorkoutPlanRepository } from '../repositories/prisma/PrismaWorkoutPlanRepository.js'
import { PrismaWorkoutSessionRepository } from '../repositories/prisma/PrismaWorkoutSessionRepository.js'
import { GetHomeData } from '../usecases/GetHomeData.js'
import { GetStats } from '../usecases/GetStats.js'

export const makeGetHomeDataController = () => {
  const workoutPlanRepository = new PrismaWorkoutPlanRepository()
  const workoutSessionRepository = new PrismaWorkoutSessionRepository()
  const useCase = new GetHomeData(
    workoutPlanRepository,
    workoutSessionRepository
  )
  return new GetHomeDataController(useCase)
}

export const makeGetStatsController = () => {
  const workoutSessionRepository = new PrismaWorkoutSessionRepository()
  const useCase = new GetStats(workoutSessionRepository)
  return new GetStatsController(useCase)
}
