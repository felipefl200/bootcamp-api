import { IWorkoutPlanRepository } from '../repositories/interfaces/IWorkoutPlanRepository.js'

interface InputDto {
  userId: string
}

interface OutputDto {
  workoutPlans: Array<{
    id: string
    name: string
    isActive: boolean
    createdAt: Date
  }>
}

export class ListWorkoutPlans {
  constructor(private workoutPlanRepository: IWorkoutPlanRepository) {}

  async execute(dto: InputDto): Promise<OutputDto> {
    const plans = await this.workoutPlanRepository.findManyByUserId(dto.userId)

    return { workoutPlans: plans }
  }
}
