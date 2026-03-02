import { UserTrainData } from '../../generated/prisma/client.js'
import { prisma } from '../../lib/db.js'
import {
  IUserTrainDataRepository,
  UpsertUserTrainDataInput,
  UserTrainDataWithUser
} from '../interfaces/IUserTrainDataRepository.js'

export class PrismaUserTrainDataRepository implements IUserTrainDataRepository {
  async findByUserId(userId: string): Promise<UserTrainDataWithUser | null> {
    return prisma.userTrainData.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            name: true
          }
        }
      }
    })
  }

  async upsert(input: UpsertUserTrainDataInput): Promise<UserTrainData> {
    return prisma.userTrainData.upsert({
      where: { userId: input.userId },
      create: input,
      update: {
        weightInGrams: input.weightInGrams,
        heightInCentimeters: input.heightInCentimeters,
        age: input.age,
        bodyFatPercentage: input.bodyFatPercentage
      }
    })
  }
}
