import { NotFoundError, UnauthorizedError } from '../errors/index.js'
import { WeekDay } from '../generated/prisma/enums.js'
import { IWorkoutPlanRepository } from '../repositories/interfaces/IWorkoutPlanRepository.js'

interface InputDto {
  userId: string
  workoutPlanId: string
}

interface OutputDto {
  id: string
  name: string
  workoutDays: Array<{
    id: string
    weekDay: WeekDay
    name: string | null
    isRest: boolean
    coverImageUrl: string | null
    estimatedDurationInSeconds: number
    exercisesCount: number
  }>
}

export class GetWorkoutPlan {
  constructor(private workoutPlanRepository: IWorkoutPlanRepository) {}

  async execute(dto: InputDto): Promise<OutputDto> {
    const workoutPlan = await this.workoutPlanRepository.findByIdWithDays(
      dto.workoutPlanId
    )

    if (!workoutPlan) {
      throw new NotFoundError('Workout plan not found')
    }

    if (workoutPlan.userId !== dto.userId) {
      throw new UnauthorizedError('Unauthorized to access this workout plan')
    }

    const formattedWorkoutDays = workoutPlan.workoutDays.map((day) => {
      // Nota da Refatoração: O Repositório Prisma atual mapeia a contagem, para a duração precisará retornar details

      return {
        id: day.id,
        weekDay: day.weekDay,
        name: day.name,
        isRest: day.isRest,
        coverImageUrl: day.coverImageUrl,
        estimatedDurationInSeconds: 0, // Ajustarei o repositório para carregar os dados p/ calcular duração com segurança
        exercisesCount: day.workoutExercises.length
      }
    })

    return {
      id: workoutPlan.id,
      name: workoutPlan.name,
      workoutDays: formattedWorkoutDays
    }
  }
}
