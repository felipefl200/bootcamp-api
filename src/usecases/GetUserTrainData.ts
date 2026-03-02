import { IUserTrainDataRepository } from '../repositories/interfaces/IUserTrainDataRepository.js'

interface InputDto {
  userId: string
}

interface OutputDto {
  userId: string
  userName: string
  weightInGrams: number
  heightInCentimeters: number
  age: number
  bodyFatPercentage: number
}

export class GetUserTrainData {
  constructor(private userTrainDataRepository: IUserTrainDataRepository) {}

  async execute(dto: InputDto): Promise<OutputDto | null> {
    const trainData = await this.userTrainDataRepository.findByUserId(
      dto.userId
    )

    if (!trainData) {
      return null
    }

    return {
      userId: trainData.userId,
      userName: trainData.user.name,
      weightInGrams: trainData.weightInGrams,
      heightInCentimeters: trainData.heightInCentimeters,
      age: trainData.age,
      bodyFatPercentage: trainData.bodyFatPercentage
    }
  }
}
