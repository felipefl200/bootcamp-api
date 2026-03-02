import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  IWorkoutPlanRepository,
  WorkoutPlanWithDays
} from '../../../repositories/interfaces/IWorkoutPlanRepository.js'
import { IWorkoutSessionRepository } from '../../../repositories/interfaces/IWorkoutSessionRepository.js'
import { GetHomeData } from '../../../usecases/GetHomeData.js'
import {
  makeWorkoutDay,
  makeWorkoutExercise,
  makeWorkoutPlan,
  makeWorkoutSession
} from '../../factories/index.js'

describe('GetHomeData', () => {
  let useCase: GetHomeData
  let workoutPlanRepoMock: vi.Mocked<IWorkoutPlanRepository>
  let workoutSessionRepoMock: vi.Mocked<IWorkoutSessionRepository>

  const defaultInput = {
    userId: 'user-id-1',
    date: '2025-06-02' // Segunda-feira
  }

  beforeEach(() => {
    workoutPlanRepoMock = {
      findById: vi.fn(),
      findByIdWithDays: vi.fn(),
      findActiveByUserId: vi.fn(),
      findManyByUserId: vi.fn(),
      createWithDeactivation: vi.fn()
    }

    workoutSessionRepoMock = {
      findById: vi.fn(),
      findActiveSessionForDay: vi.fn(),
      findSessionsInPeriod: vi.fn(),
      create: vi.fn(),
      markAsCompleted: vi.fn()
    }

    useCase = new GetHomeData(workoutPlanRepoMock, workoutSessionRepoMock)
  })

  it('deve retornar dados vazios quando não há plano ativo', async () => {
    workoutPlanRepoMock.findActiveByUserId.mockResolvedValue(null)

    const result = await useCase.execute(defaultInput)

    expect(result.activeWorkoutPlanId).toBeNull()
    expect(result.todayWorkoutDay).toBeNull()
    expect(result.workoutStreak).toBe(0)
    expect(Object.keys(result.consistencyByDay)).toHaveLength(7)
  })

  it('deve retornar consistencyByDay com todos os dias da semana como false quando não há plano ativo', async () => {
    workoutPlanRepoMock.findActiveByUserId.mockResolvedValue(null)

    const result = await useCase.execute(defaultInput)

    for (const day of Object.values(result.consistencyByDay)) {
      expect(day.workoutDayCompleted).toBe(false)
      expect(day.workoutDayStarted).toBe(false)
    }
  })

  it('deve retornar todayWorkoutDay null quando o plano não tem dia para o dia da semana', async () => {
    // date é segunda (MONDAY), mas plano só tem TUESDAY
    workoutPlanRepoMock.findActiveByUserId.mockResolvedValue({
      ...makeWorkoutPlan(),
      workoutDays: [
        { ...makeWorkoutDay({ weekDay: 'TUESDAY' }), workoutExercises: [] }
      ]
    } as WorkoutPlanWithDays)
    workoutSessionRepoMock.findSessionsInPeriod.mockResolvedValue([])

    const result = await useCase.execute(defaultInput)

    expect(result.todayWorkoutDay).toBeNull()
    expect(result.activeWorkoutPlanId).toBe('plan-id-1')
  })

  it('deve retornar todayWorkoutDay com dados corretos quando o dia corresponde', async () => {
    // set=3, rep=10, restTime=60 → 10*3*5 + 60*3 = 150+180 = 330s
    const exercise = makeWorkoutExercise({ set: 3, rep: 10, restTime: 60 })
    workoutPlanRepoMock.findActiveByUserId.mockResolvedValue({
      ...makeWorkoutPlan(),
      workoutDays: [
        {
          ...makeWorkoutDay({ weekDay: 'MONDAY' }),
          workoutExercises: [exercise]
        }
      ]
    } as WorkoutPlanWithDays)
    workoutSessionRepoMock.findSessionsInPeriod.mockResolvedValue([])

    const result = await useCase.execute(defaultInput)

    expect(result.todayWorkoutDay).not.toBeNull()
    expect(result.todayWorkoutDay?.weekDay).toBe('MONDAY')
    expect(result.todayWorkoutDay?.exercisesCount).toBe(1)
  })

  it('deve marcar workoutDayStarted=true para sessão iniciada sem completedAt', async () => {
    workoutPlanRepoMock.findActiveByUserId.mockResolvedValue({
      ...makeWorkoutPlan(),
      workoutDays: [
        { ...makeWorkoutDay({ weekDay: 'MONDAY' }), workoutExercises: [] }
      ]
    } as WorkoutPlanWithDays)
    workoutSessionRepoMock.findSessionsInPeriod
      .mockResolvedValueOnce([
        makeWorkoutSession({
          startedAt: new Date('2025-06-02T10:00:00Z'),
          completedAt: null
        })
      ])
      .mockResolvedValueOnce([])

    const result = await useCase.execute(defaultInput)

    expect(result.consistencyByDay['2025-06-02'].workoutDayStarted).toBe(true)
    expect(result.consistencyByDay['2025-06-02'].workoutDayCompleted).toBe(
      false
    )
  })

  it('deve marcar ambos como true para sessão completada', async () => {
    workoutPlanRepoMock.findActiveByUserId.mockResolvedValue({
      ...makeWorkoutPlan(),
      workoutDays: [
        { ...makeWorkoutDay({ weekDay: 'MONDAY' }), workoutExercises: [] }
      ]
    } as WorkoutPlanWithDays)
    const completedSession = makeWorkoutSession({
      startedAt: new Date('2025-06-02T10:00:00Z'),
      completedAt: new Date('2025-06-02T11:00:00Z')
    })
    workoutSessionRepoMock.findSessionsInPeriod
      .mockResolvedValueOnce([completedSession])
      .mockResolvedValueOnce([completedSession])

    const result = await useCase.execute(defaultInput)

    expect(result.consistencyByDay['2025-06-02'].workoutDayStarted).toBe(true)
    expect(result.consistencyByDay['2025-06-02'].workoutDayCompleted).toBe(true)
  })
})
