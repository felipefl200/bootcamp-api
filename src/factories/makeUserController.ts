import {
  GetUserTrainDataController,
  UpsertUserTrainDataController
} from '../controllers/UserController.js'
import { PrismaUserRepository } from '../repositories/prisma/PrismaUserRepository.js'
import { PrismaUserTrainDataRepository } from '../repositories/prisma/PrismaUserTrainDataRepository.js'
import { GetUserTrainData } from '../usecases/GetUserTrainData.js'
import { UpsertUserTrainData } from '../usecases/UpsertUserTrainData.js'

const userRepository = new PrismaUserRepository()
const userTrainDataRepository = new PrismaUserTrainDataRepository()

export const makeGetUserTrainDataController = () => {
  const useCase = new GetUserTrainData(userTrainDataRepository)
  return new GetUserTrainDataController(useCase)
}

export const makeUpsertUserTrainDataController = () => {
  const useCase = new UpsertUserTrainData(
    userRepository,
    userTrainDataRepository
  )
  return new UpsertUserTrainDataController(useCase)
}
