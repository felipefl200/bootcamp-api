import { beforeEach, describe, expect, it, vi } from 'vitest'

import { NotFoundError, UnauthorizedError } from '../../../errors/index.js'
import {
  IWorkoutDayRepository,
  WorkoutDayWithExercisesAndSessions
} from '../../../repositories/interfaces/IWorkoutDayRepository.js'
import { IWorkoutPlanRepository } from '../../../repositories/interfaces/IWorkoutPlanRepository.js'
import { GetWorkoutDay } from '../../../usecases/GetWorkoutDay.js'
import {
  makeWorkoutDay,
  makeWorkoutExercise,
  makeWorkoutPlan,
  makeWorkoutSession
} from '../../factories/index.js'

describe('GetWorkoutDay', () => {
  let useCase: GetWorkoutDay
  let workoutPlanRepoMock: vi.Mocked<IWorkoutPlanRepository>
  let workoutDayRepoMock: vi.Mocked<IWorkoutDayRepository>

  const defaultInput = {
    userId: 'user-id-1',
    workoutPlanId: 'plan-id-1',
    workoutDayId: 'day-id-1'
  }

  beforeEach(() => {
    workoutPlanRepoMock = {
      findById: vi.fn(),
      findByIdWithDays: vi.fn(),
      findActiveByUserId: vi.fn(),
      findManyByUserId: vi.fn(),
      createWithDeactivation: vi.fn()
    }

    workoutDayRepoMock = {
      findById: vi.fn(),
      findByIdWithExercises: vi.fn(),
      findByIdWithExercisesAndSessions: vi.fn()
    }

    useCase = new GetWorkoutDay(workoutPlanRepoMock, workoutDayRepoMock)
  })

  it('deve lançar NotFoundError quando o plano não existe', async () => {
    workoutPlanRepoMock.findById.mockResolvedValue(null)

    await expect(useCase.execute(defaultInput)).rejects.toThrow(NotFoundError)
  })

  it('deve lançar UnauthorizedError quando o userId não é o dono do plano', async () => {
    workoutPlanRepoMock.findById.mockResolvedValue({
      ...makeWorkoutPlan({ userId: 'outro-user' }),
      workoutDays: []
    } as ReturnType<typeof makeWorkoutPlan>)

    await expect(useCase.execute(defaultInput)).rejects.toThrow(
      UnauthorizedError
    )
  })

  it('deve lançar NotFoundError quando o dia não é encontrado no plano', async () => {
    workoutPlanRepoMock.findById.mockResolvedValue({
      ...makeWorkoutPlan(),
      workoutDays: []
    } as ReturnType<typeof makeWorkoutPlan>)

    workoutDayRepoMock.findByIdWithExercisesAndSessions.mockResolvedValue(null)

    await expect(useCase.execute(defaultInput)).rejects.toThrow(NotFoundError)
  })

  it('deve retornar o dia completo com exercícios e sessões', async () => {
    const exercise = makeWorkoutExercise()
    const session = makeWorkoutSession({
      startedAt: new Date('2025-06-01T10:00:00Z'),
      completedAt: new Date('2025-06-01T11:30:00Z')
    })

    workoutPlanRepoMock.findById.mockResolvedValue(makeWorkoutPlan())
    workoutDayRepoMock.findByIdWithExercisesAndSessions.mockResolvedValue({
      ...makeWorkoutDay({ workoutPlanId: 'plan-id-1' }),
      workoutExercises: [exercise],
      workoutSessions: [session]
    } as WorkoutDayWithExercisesAndSessions)

    const result = await useCase.execute(defaultInput)

    expect(result.id).toBe('day-id-1')
    expect(result.exercises).toHaveLength(1)
    expect(result.exercises[0].name).toBe('Supino Reto')
    expect(result.sessions).toHaveLength(1)
    expect(result.sessions[0].startedAt).toEqual(
      new Date('2025-06-01T10:00:00Z')
    )
    expect(result.sessions[0].completedAt).toEqual(
      new Date('2025-06-01T11:30:00Z')
    )
  })

  it('deve omitir completedAt quando a sessão não está concluída', async () => {
    const session = makeWorkoutSession({ completedAt: null })

    workoutPlanRepoMock.findById.mockResolvedValue(makeWorkoutPlan())
    workoutDayRepoMock.findByIdWithExercisesAndSessions.mockResolvedValue({
      ...makeWorkoutDay({ workoutPlanId: 'plan-id-1' }),
      workoutExercises: [],
      workoutSessions: [session]
    } as WorkoutDayWithExercisesAndSessions)

    const result = await useCase.execute(defaultInput)

    expect(result.sessions[0].completedAt).toBeUndefined()
    expect(result.sessions[0].startedAt).toBeDefined()
  })

  it('deve calcular estimatedDurationInSeconds corretamente', async () => {
    // set=3, rep=12, restTime=90 → 12*3*5 + 90*3 = 180 + 270 = 450s
    const exercise = makeWorkoutExercise({ set: 3, rep: 12, restTime: 90 })

    workoutPlanRepoMock.findById.mockResolvedValue(makeWorkoutPlan())
    workoutDayRepoMock.findByIdWithExercisesAndSessions.mockResolvedValue({
      ...makeWorkoutDay({ workoutPlanId: 'plan-id-1' }),
      workoutExercises: [exercise],
      workoutSessions: []
    } as WorkoutDayWithExercisesAndSessions)

    const result = await useCase.execute(defaultInput)

    expect(result.estimatedDurationInSeconds).toBe(450)
  })
})
