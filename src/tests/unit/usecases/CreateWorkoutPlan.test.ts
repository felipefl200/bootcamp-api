import { beforeEach, describe, expect, it, vi } from 'vitest'

import { IWorkoutPlanRepository } from '../../../repositories/interfaces/IWorkoutPlanRepository.js'
import { CreateWorkoutPlan } from '../../../usecases/CreateWorkoutPlan.js'
import {
  makeWorkoutDay,
  makeWorkoutExercise,
  makeWorkoutPlan
} from '../../factories/index.js'

describe('CreateWorkoutPlan', () => {
  let useCase: CreateWorkoutPlan
  let workoutPlanRepoMock: vi.Mocked<IWorkoutPlanRepository>

  const defaultInput = {
    userId: 'user-id-1',
    sessionId: 'session-id-1',
    name: 'Meu Plano A',
    workoutDays: [
      {
        name: 'Peito e Tríceps',
        weekDay: 'MONDAY' as const,
        isRest: false,
        coverImageUrl: 'https://example.com/img.jpg',
        workoutExercises: [
          { order: 1, name: 'Supino Reto', set: 4, rep: 10, restTime: 60 }
        ]
      }
    ]
  }

  beforeEach(() => {
    workoutPlanRepoMock = {
      findById: vi.fn(),
      findByIdWithDays: vi.fn(),
      findActiveByUserId: vi.fn(),
      findManyByUserId: vi.fn(),
      createWithDeactivation: vi.fn()
    }
    useCase = new CreateWorkoutPlan(workoutPlanRepoMock)
  })

  const makePlanWithDays = () => ({
    ...makeWorkoutPlan({ name: 'Meu Plano A' }),
    workoutDays: [
      {
        ...makeWorkoutDay({ name: 'Peito e Tríceps' }),
        workoutExercises: [makeWorkoutExercise()]
      }
    ]
  })

  it('deve criar um novo plano quando não há plano ativo', async () => {
    workoutPlanRepoMock.findActiveByUserId.mockResolvedValue(null)
    const createdPlan = makePlanWithDays()

    workoutPlanRepoMock.createWithDeactivation.mockResolvedValue(
      createdPlan as unknown as any
    )

    const result = await useCase.execute(defaultInput)

    expect(result.name).toBe('Meu Plano A')
    expect(result.isActive).toBe(true)
  })

  it('deve retornar o plano completo com dias e exercícios', async () => {
    workoutPlanRepoMock.findActiveByUserId.mockResolvedValue(null)
    const createdPlan = makePlanWithDays()

    workoutPlanRepoMock.createWithDeactivation.mockResolvedValue(
      createdPlan as unknown as any
    )

    const result = await useCase.execute(defaultInput)

    expect(result.workoutDays).toHaveLength(1)
    expect(result.workoutDays[0].workoutExercises).toHaveLength(1)
    expect(result.workoutDays[0].name).toBe('Peito e Tríceps')
  })
})
