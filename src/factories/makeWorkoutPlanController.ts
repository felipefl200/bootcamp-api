import {
  CreateWorkoutPlanController,
  GetWorkoutDayController,
  GetWorkoutPlanController,
  ListWorkoutPlansController
} from '../controllers/WorkoutPlanController.js'
import { PrismaWorkoutDayRepository } from '../repositories/prisma/PrismaWorkoutDayRepository.js'
import { PrismaWorkoutPlanRepository } from '../repositories/prisma/PrismaWorkoutPlanRepository.js'
import { CreateWorkoutPlan } from '../usecases/CreateWorkoutPlan.js'
import { GetWorkoutDay } from '../usecases/GetWorkoutDay.js'
import { GetWorkoutPlan } from '../usecases/GetWorkoutPlan.js'
import { ListWorkoutPlans } from '../usecases/ListWorkoutPlans.js'

const workoutPlanRepository = new PrismaWorkoutPlanRepository()
const workoutDayRepository = new PrismaWorkoutDayRepository()

export const makeCreateWorkoutPlanController = () => {
  const useCase = new CreateWorkoutPlan(workoutPlanRepository)
  return new CreateWorkoutPlanController(useCase)
}

export const makeListWorkoutPlansController = () => {
  const useCase = new ListWorkoutPlans(workoutPlanRepository)
  return new ListWorkoutPlansController(useCase)
}

export const makeGetWorkoutPlanController = () => {
  const useCase = new GetWorkoutPlan(workoutPlanRepository)
  return new GetWorkoutPlanController(useCase)
}

export const makeGetWorkoutDayController = () => {
  const useCase = new GetWorkoutDay(workoutPlanRepository, workoutDayRepository)
  return new GetWorkoutDayController(useCase)
}
