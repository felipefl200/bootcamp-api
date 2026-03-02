import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GetHomeData } from '../../../usecases/GetHomeData.js'
import {
  makeWorkoutDay,
  makeWorkoutExercise,
  makeWorkoutPlan,
  makeWorkoutSession
} from '../../factories/index.js'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    workoutPlan: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    workoutDay: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    workoutSession: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
    userTrainData: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock('../../../lib/db.js', () => ({ prisma: prismaMock }))

describe('GetHomeData', () => {
  const useCase = new GetHomeData()

  const defaultInput = {
    userId: 'user-id-1',
    date: '2025-06-02' // Segunda-feira
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve retornar dados vazios quando não há plano ativo', async () => {
    prismaMock.workoutPlan.findFirst.mockResolvedValue(null)

    const result = await useCase.execute(defaultInput)

    expect(result.activeWorkoutPlanId).toBeNull()
    expect(result.todayWorkoutDay).toBeNull()
    expect(result.workoutStreak).toBe(0)
    expect(Object.keys(result.consistencyByDay)).toHaveLength(7)
  })

  it('deve retornar consistencyByDay com todos os dias da semana como false quando não há plano ativo', async () => {
    prismaMock.workoutPlan.findFirst.mockResolvedValue(null)

    const result = await useCase.execute(defaultInput)

    for (const day of Object.values(result.consistencyByDay)) {
      expect(day.workoutDayCompleted).toBe(false)
      expect(day.workoutDayStarted).toBe(false)
    }
  })

  it('deve retornar todayWorkoutDay null quando o plano não tem dia para o dia da semana', async () => {
    // date é segunda (MONDAY), mas plano só tem TUESDAY
    prismaMock.workoutPlan.findFirst.mockResolvedValue({
      ...makeWorkoutPlan(),
      workoutDays: [
        { ...makeWorkoutDay({ weekDay: 'TUESDAY' }), workoutExercises: [] }
      ]
    })
    prismaMock.workoutSession.findMany.mockResolvedValue([])

    const result = await useCase.execute(defaultInput)

    expect(result.todayWorkoutDay).toBeNull()
    expect(result.activeWorkoutPlanId).toBe('plan-id-1')
  })

  it('deve retornar todayWorkoutDay com dados corretos quando o dia corresponde', async () => {
    // set=3, rep=10, restTime=60 → 10*3*5 + 60*3 = 150+180 = 330s
    const exercise = makeWorkoutExercise({ set: 3, rep: 10, restTime: 60 })
    prismaMock.workoutPlan.findFirst.mockResolvedValue({
      ...makeWorkoutPlan(),
      workoutDays: [
        {
          ...makeWorkoutDay({ weekDay: 'MONDAY' }),
          workoutExercises: [exercise]
        }
      ]
    })
    prismaMock.workoutSession.findMany.mockResolvedValue([])

    const result = await useCase.execute(defaultInput)

    expect(result.todayWorkoutDay).not.toBeNull()
    expect(result.todayWorkoutDay?.weekDay).toBe('MONDAY')
    expect(result.todayWorkoutDay?.exercisesCount).toBe(1)
    expect(result.todayWorkoutDay?.estimatedDurationInSeconds).toBe(330)
  })

  it('deve marcar workoutDayStarted=true para sessão iniciada sem completedAt', async () => {
    prismaMock.workoutPlan.findFirst.mockResolvedValue({
      ...makeWorkoutPlan(),
      workoutDays: [
        { ...makeWorkoutDay({ weekDay: 'MONDAY' }), workoutExercises: [] }
      ]
    })
    prismaMock.workoutSession.findMany
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
    prismaMock.workoutPlan.findFirst.mockResolvedValue({
      ...makeWorkoutPlan(),
      workoutDays: [
        { ...makeWorkoutDay({ weekDay: 'MONDAY' }), workoutExercises: [] }
      ]
    })
    const completedSession = makeWorkoutSession({
      startedAt: new Date('2025-06-02T10:00:00Z'),
      completedAt: new Date('2025-06-02T11:00:00Z')
    })
    prismaMock.workoutSession.findMany
      .mockResolvedValueOnce([completedSession])
      .mockResolvedValueOnce([completedSession])

    const result = await useCase.execute(defaultInput)

    expect(result.consistencyByDay['2025-06-02'].workoutDayStarted).toBe(true)
    expect(result.consistencyByDay['2025-06-02'].workoutDayCompleted).toBe(true)
  })

  it('deve calcular streak de 3 dias consecutivos concluídos', async () => {
    prismaMock.workoutPlan.findFirst.mockResolvedValue({
      ...makeWorkoutPlan(),
      workoutDays: [
        { ...makeWorkoutDay({ weekDay: 'MONDAY' }), workoutExercises: [] }
      ]
    })
    prismaMock.workoutSession.findMany
      .mockResolvedValueOnce([]) // sessões da semana
      .mockResolvedValueOnce([
        makeWorkoutSession({
          id: 's1',
          startedAt: new Date('2025-06-02T10:00:00Z'),
          completedAt: new Date('2025-06-02T11:00:00Z')
        }),
        makeWorkoutSession({
          id: 's2',
          startedAt: new Date('2025-06-01T10:00:00Z'),
          completedAt: new Date('2025-06-01T11:00:00Z')
        }),
        makeWorkoutSession({
          id: 's3',
          startedAt: new Date('2025-05-31T10:00:00Z'),
          completedAt: new Date('2025-05-31T11:00:00Z')
        })
      ])

    const result = await useCase.execute(defaultInput)

    expect(result.workoutStreak).toBe(3)
  })
})
