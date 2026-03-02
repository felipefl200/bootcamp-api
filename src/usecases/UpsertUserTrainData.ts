import { IUserRepository } from '../repositories/interfaces/IUserRepository.js'
import { IUserTrainDataRepository } from '../repositories/interfaces/IUserTrainDataRepository.js'

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
  constructor(
    private userRepository: IUserRepository,
    private userTrainDataRepository: IUserTrainDataRepository
  ) {}

  async execute(dto: InputDto): Promise<OutputDto> {
    const user = await this.userRepository.findByIdOrThrow(dto.userId)

    const trainData = await this.userTrainDataRepository.upsert({
      userId: dto.userId,
      weightInGrams: dto.weightInGrams,
      heightInCentimeters: dto.heightInCentimeters,
      age: dto.age,
      bodyFatPercentage: dto.bodyFatPercentage
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
