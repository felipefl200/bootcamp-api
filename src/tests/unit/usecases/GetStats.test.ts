import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GetStats } from '../../../usecases/GetStats.js'
import { makeWorkoutSession } from '../../factories/index.js'

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

describe('GetStats', () => {
  const useCase = new GetStats()

  const defaultInput = {
    userId: 'user-id-1',
    from: '2025-06-01',
    to: '2025-06-07'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve retornar todos os valores zerados quando não há sessões no período', async () => {
    prismaMock.workoutSession.findMany.mockResolvedValue([])

    const result = await useCase.execute(defaultInput)

    expect(result.completedWorkoutsCount).toBe(0)
    expect(result.conclusionRate).toBe(0)
    expect(result.totalTimeInSeconds).toBe(0)
    expect(result.consistencyByDay).toEqual({})
  })

  it('deve retornar workoutStreak=0 quando não há sessões completas', async () => {
    prismaMock.workoutSession.findMany.mockResolvedValue([])

    const result = await useCase.execute(defaultInput)

    expect(result.workoutStreak).toBe(0)
  })

  it('deve calcular conclusionRate corretamente para sessões apenas iniciadas', async () => {
    const sessions = [
      makeWorkoutSession({
        id: 's1',
        startedAt: new Date('2025-06-02T10:00:00Z'),
        completedAt: null
      }),
      makeWorkoutSession({
        id: 's2',
        startedAt: new Date('2025-06-03T10:00:00Z'),
        completedAt: null
      })
    ]
    prismaMock.workoutSession.findMany
      .mockResolvedValueOnce(sessions)
      .mockResolvedValueOnce([])

    const result = await useCase.execute(defaultInput)

    expect(result.completedWorkoutsCount).toBe(0)
    expect(result.conclusionRate).toBe(0)
    expect(result.consistencyByDay['2025-06-02'].workoutDayStarted).toBe(true)
    expect(result.consistencyByDay['2025-06-02'].workoutDayCompleted).toBe(
      false
    )
  })

  it('deve calcular totalTimeInSeconds corretamente para sessões completadas', async () => {
    // sessão de 2h = 7200s
    const session = makeWorkoutSession({
      startedAt: new Date('2025-06-02T10:00:00Z'),
      completedAt: new Date('2025-06-02T12:00:00Z')
    })
    prismaMock.workoutSession.findMany
      .mockResolvedValueOnce([session])
      .mockResolvedValueOnce([session])

    const result = await useCase.execute(defaultInput)

    expect(result.totalTimeInSeconds).toBe(7200)
    expect(result.completedWorkoutsCount).toBe(1)
    expect(result.conclusionRate).toBe(1)
  })

  it('deve calcular conclusionRate parcial corretamente', async () => {
    const sessions = [
      makeWorkoutSession({
        id: 's1',
        startedAt: new Date('2025-06-02T10:00:00Z'),
        completedAt: new Date('2025-06-02T11:00:00Z')
      }),
      makeWorkoutSession({
        id: 's2',
        startedAt: new Date('2025-06-03T10:00:00Z'),
        completedAt: null
      })
    ]
    prismaMock.workoutSession.findMany
      .mockResolvedValueOnce(sessions)
      .mockResolvedValueOnce([sessions[0]])

    const result = await useCase.execute(defaultInput)

    expect(result.completedWorkoutsCount).toBe(1)
    expect(result.conclusionRate).toBe(0.5)
  })

  it('deve incluir apenas dias com sessão em consistencyByDay', async () => {
    const session = makeWorkoutSession({
      startedAt: new Date('2025-06-02T10:00:00Z'),
      completedAt: new Date('2025-06-02T11:00:00Z')
    })
    prismaMock.workoutSession.findMany
      .mockResolvedValueOnce([session])
      .mockResolvedValueOnce([session])

    const result = await useCase.execute(defaultInput)

    expect(Object.keys(result.consistencyByDay)).toEqual(['2025-06-02'])
  })
})
