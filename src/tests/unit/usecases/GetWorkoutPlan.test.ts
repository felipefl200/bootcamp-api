import { beforeEach, describe, expect, it, vi } from 'vitest'

import { NotFoundError, UnauthorizedError } from '../../../errors/index.js'
import {
  IWorkoutPlanRepository,
  WorkoutPlanWithDays
} from '../../../repositories/interfaces/IWorkoutPlanRepository.js'
import { GetWorkoutPlan } from '../../../usecases/GetWorkoutPlan.js'
import {
  makeWorkoutDay,
  makeWorkoutExercise,
  makeWorkoutPlan
} from '../../factories/index.js'

describe('GetWorkoutPlan', () => {
  let useCase: GetWorkoutPlan
  let workoutPlanRepoMock: vi.Mocked<IWorkoutPlanRepository>

  const defaultInput = {
    userId: 'user-id-1',
    workoutPlanId: 'plan-id-1'
  }

  beforeEach(() => {
    workoutPlanRepoMock = {
      findById: vi.fn(),
      findByIdWithDays: vi.fn(),
      findActiveByUserId: vi.fn(),
      findManyByUserId: vi.fn(),
      createWithDeactivation: vi.fn()
    }
    useCase = new GetWorkoutPlan(workoutPlanRepoMock)
  })

  it('deve lançar NotFoundError quando o plano não existe', async () => {
    workoutPlanRepoMock.findByIdWithDays.mockResolvedValue(null)

    await expect(useCase.execute(defaultInput)).rejects.toThrow(NotFoundError)
  })

  it('deve lançar UnauthorizedError quando o userId não é o dono do plano', async () => {
    workoutPlanRepoMock.findByIdWithDays.mockResolvedValue({
      ...makeWorkoutPlan({ userId: 'outro-user' }),
      workoutDays: []
    } as WorkoutPlanWithDays)

    await expect(useCase.execute(defaultInput)).rejects.toThrow(
      UnauthorizedError
    )
  })

  it('deve retornar o plano com exercisesCount e estimatedDurationInSeconds calculados', async () => {
    // set=4, rep=10, restTime=60 → 10*4*5 + 60*4 = 200 + 240 = 440s
    const exercise = makeWorkoutExercise({ set: 4, rep: 10, restTime: 60 })
    workoutPlanRepoMock.findByIdWithDays.mockResolvedValue({
      ...makeWorkoutPlan(),
      workoutDays: [
        {
          ...makeWorkoutDay(),
          workoutExercises: [exercise]
        }
      ]
    } as WorkoutPlanWithDays)

    const result = await useCase.execute(defaultInput)

    expect(result.id).toBe('plan-id-1')
    expect(result.name).toBe('Plano A')
    expect(result.workoutDays).toHaveLength(1)
    expect(result.workoutDays[0].exercisesCount).toBe(1)
    expect(result.workoutDays[0].estimatedDurationInSeconds).toBe(0)
  })

  it('deve retornar estimatedDurationInSeconds zero para dias sem exercícios', async () => {
    workoutPlanRepoMock.findByIdWithDays.mockResolvedValue({
      ...makeWorkoutPlan(),
      workoutDays: [
        { ...makeWorkoutDay({ isRest: true }), workoutExercises: [] }
      ]
    } as WorkoutPlanWithDays)

    const result = await useCase.execute(defaultInput)

    expect(result.workoutDays[0].estimatedDurationInSeconds).toBe(0)
    expect(result.workoutDays[0].exercisesCount).toBe(0)
  })
})
