import {
  CreateWorkoutPlanController,
  GetWorkoutDayController,
  GetWorkoutPlanController,
  ListWorkoutPlansController} from '../controllers/WorkoutPlanController.js'
import { PrismaWorkoutDayRepository } from '../repositories/prisma/PrismaWorkoutDayRepository.js'
import { PrismaWorkoutPlanRepository } from '../repositories/prisma/PrismaWorkoutPlanRepository.js'
import { PrismaWorkoutSessionRepository } from '../repositories/prisma/PrismaWorkoutSessionRepository.js'
import { CreateWorkoutPlan } from '../usecases/CreateWorkoutPlan.js'
import { GetWorkoutDay } from '../usecases/GetWorkoutDay.js'
import { GetWorkoutPlan } from '../usecases/GetWorkoutPlan.js'
import { ListWorkoutPlans } from '../usecases/ListWorkoutPlans.js'

export const makeCreateWorkoutPlanController = () => {
  const workoutPlanRepository = new PrismaWorkoutPlanRepository()
  const useCase = new CreateWorkoutPlan(workoutPlanRepository)
  return new CreateWorkoutPlanController(useCase)
}

export const makeListWorkoutPlansController = () => {
  const workoutPlanRepository = new PrismaWorkoutPlanRepository()
  const useCase = new ListWorkoutPlans(workoutPlanRepository)
  return new ListWorkoutPlansController(useCase)
}

export const makeGetWorkoutPlanController = () => {
  const workoutPlanRepository = new PrismaWorkoutPlanRepository()
  const useCase = new GetWorkoutPlan(workoutPlanRepository)
  return new GetWorkoutPlanController(useCase)
}

export const makeGetWorkoutDayController = () => {
  const workoutPlanRepository = new PrismaWorkoutPlanRepository()
  const workoutDayRepository = new PrismaWorkoutDayRepository()
  const useCase = new GetWorkoutDay(workoutPlanRepository, workoutDayRepository)
  return new GetWorkoutDayController(useCase)
}
