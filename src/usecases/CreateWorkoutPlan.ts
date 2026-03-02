import { NotFoundError } from '../errors/index.js'
import { WeekDay } from '../generated/prisma/enums.js'
import { IWorkoutPlanRepository } from '../repositories/interfaces/IWorkoutPlanRepository.js'

// Data Transfer Object
interface InputDto {
  userId: string
  sessionId: string // @TODO: Esse sessionId parece um erro de design lógico/legado, removerei do payload do repo se possível ou adaptaremos. Pelo schema, sessoões estão no WorkoutDay.
  name: string
  workoutDays: Array<{
    name: string
    weekDay: WeekDay
    isRest: boolean
    coverImageUrl?: string
    workoutExercises: Array<{
      order: number
      name: string
      set: number
      rep: number
      restTime: number
    }>
  }>
}

interface OutputDto {
  id: string
  name: string
  isActive: boolean
  workoutDays: Array<{
    id: string
    name: string | null
    weekDay: WeekDay
    isRest: boolean
    workoutExercises: Array<{
      id: string
      order: number
      name: string
      set: number
      rep: number
      restTime: number
    }>
  }>
}

export class CreateWorkoutPlan {
  constructor(private workoutPlanRepo: IWorkoutPlanRepository) {}

  async execute(dto: InputDto): Promise<OutputDto> {
    const result = await this.workoutPlanRepo.createWithDeactivation({
      name: dto.name,
      userId: dto.userId,
      isActive: true,
      workoutDays: dto.workoutDays.map((day) => ({
        ...day,
        coverImageUrl: day.coverImageUrl ?? null
      }))
    })

    if (!result) {
      throw new NotFoundError('Workout plan not found')
    }

    return {
      id: result.id,
      name: result.name,
      isActive: result.isActive,
      workoutDays: result.workoutDays.map(
        (day: NonNullable<typeof result.workoutDays>[number]) => ({
          id: day.id,
          name: day.name,
          weekDay: day.weekDay,
          isRest: day.isRest,
          workoutExercises: day.workoutExercises.map(
            (exercise: NonNullable<typeof day.workoutExercises>[number]) => ({
              id: exercise.id,
              order: exercise.order,
              name: exercise.name,
              set: exercise.set,
              rep: exercise.rep,
              restTime: exercise.restTime
            })
          )
        })
      )
    }
  }
}
