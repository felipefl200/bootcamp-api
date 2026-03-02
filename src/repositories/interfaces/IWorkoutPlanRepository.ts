import { WeekDay, WorkoutPlan } from '../../generated/prisma/client.js'

export type CreateWorkoutPlanInput = {
  name: string
  userId: string
  isActive?: boolean
}

export type CreateWorkoutDayInput = {
  name: string
  weekDay: WeekDay
  isRest: boolean
  coverImageUrl?: string | null
}

export type CreateWorkoutExerciseInput = {
  order: number
  name: string
  set: number
  rep: number
  restTime: number
}

// Payload aninhado para criação em lote (Transaction)
export type CreateWorkoutPlanPayload = CreateWorkoutPlanInput & {
  workoutDays: (CreateWorkoutDayInput & {
    workoutExercises: CreateWorkoutExerciseInput[]
  })[]
}

// Tipo de retorno com dias (mas sem os exercícios detalhados aqui, a não ser que inclua)
export type WorkoutPlanWithDays = WorkoutPlan & {
  workoutDays: {
    id: string
    name: string | null
    weekDay: WeekDay
    isRest: boolean
    coverImageUrl: string | null
    workoutExercises: { id: string }[]
  }[]
}

// Retorno Completo do Plano (completão gerado após criação)
export type WorkoutPlanFullData = WorkoutPlan & {
  workoutDays: ({
    workoutExercises: {
      id: string
      order: number
      name: string
      set: number
      rep: number
      restTime: number
      createdAt: Date
      updatedAt: Date
      workoutDayId: string
    }[]
  } & {
    id: string
    name: string | null
    weekDay: WeekDay
    isRest: boolean
    coverImageUrl: string | null
    createdAt: Date
    updatedAt: Date
    workoutPlanId: string
  })[]
}

export interface IWorkoutPlanRepository {
  findById(id: string): Promise<WorkoutPlan | null>
  findByIdWithDays(id: string): Promise<WorkoutPlanWithDays | null>

  findActiveByUserId(userId: string): Promise<WorkoutPlanWithDays | null>

  findManyByUserId(
    userId: string
  ): Promise<Pick<WorkoutPlan, 'id' | 'name' | 'isActive' | 'createdAt'>[]>

  /**
   * Executa a transação para desativar os planos antigos do usuário e criar este novo com todos os seus dias e exercícios.
   */
  createWithDeactivation(
    input: CreateWorkoutPlanPayload
  ): Promise<WorkoutPlanFullData>
}
