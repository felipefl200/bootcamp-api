import { prisma } from '../lib/db.js'

interface InputDto {
  userId: string
  weightInGrams: number
  heightInCentimeters: number
  age: number
  bodyFatPercentage: number
}

interface OutputDto {
  userId: string
  userName: string
  weightInGrams: number
  heightInCentimeters: number
  age: number
  bodyFatPercentage: number
}

export class UpsertUserTrainData {
  async execute(dto: InputDto): Promise<OutputDto> {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: dto.userId },
      select: { name: true }
    })

    const trainData = await prisma.userTrainData.upsert({
      where: { userId: dto.userId },
      create: {
        userId: dto.userId,
        weightInGrams: dto.weightInGrams,
        heightInCentimeters: dto.heightInCentimeters,
        age: dto.age,
        bodyFatPercentage: dto.bodyFatPercentage
      },
      update: {
        weightInGrams: dto.weightInGrams,
        heightInCentimeters: dto.heightInCentimeters,
        age: dto.age,
        bodyFatPercentage: dto.bodyFatPercentage
      }
    })

    return {
      userId: trainData.userId,
      userName: user.name,
      weightInGrams: trainData.weightInGrams,
      heightInCentimeters: trainData.heightInCentimeters,
      age: trainData.age,
      bodyFatPercentage: trainData.bodyFatPercentage
    }
  }
}
