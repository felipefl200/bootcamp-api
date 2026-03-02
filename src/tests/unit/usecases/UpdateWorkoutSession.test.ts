import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError
} from '../../../errors/index.js'
import { UpdateWorkoutSession } from '../../../usecases/UpdateWorkoutSession.js'
import {
  makeWorkoutDay,
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

describe('UpdateWorkoutSession', () => {
  const useCase = new UpdateWorkoutSession()

  const defaultInput = {
    userId: 'user-id-1',
    workoutPlanId: 'plan-id-1',
    workoutDayId: 'day-id-1',
    workoutSessionId: 'session-id-1',
    completedAt: '2025-06-01T12:00:00.000Z'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve lançar NotFoundError quando o plano não existe', async () => {
    prismaMock.workoutPlan.findUnique.mockResolvedValue(null)

    await expect(useCase.execute(defaultInput)).rejects.toThrow(NotFoundError)
  })

  it('deve lançar UnauthorizedError quando o userId não é o dono do plano', async () => {
    prismaMock.workoutPlan.findUnique.mockResolvedValue({
      ...makeWorkoutPlan({ userId: 'outro-user' }),
      workoutDays: []
    })

    await expect(useCase.execute(defaultInput)).rejects.toThrow(
      UnauthorizedError
    )
  })

  it('deve lançar BadRequestError quando o dia não pertence ao plano', async () => {
    prismaMock.workoutPlan.findUnique.mockResolvedValue({
      ...makeWorkoutPlan(),
      workoutDays: []
    })

    await expect(useCase.execute(defaultInput)).rejects.toThrow(BadRequestError)
  })

  it('deve lançar NotFoundError quando a sessão não existe', async () => {
    prismaMock.workoutPlan.findUnique.mockResolvedValue({
      ...makeWorkoutPlan(),
      workoutDays: [makeWorkoutDay()]
    })
    prismaMock.workoutSession.findUnique.mockResolvedValue(null)

    await expect(useCase.execute(defaultInput)).rejects.toThrow(NotFoundError)
  })

  it('deve lançar BadRequestError quando a sessão não pertence ao dia', async () => {
    prismaMock.workoutPlan.findUnique.mockResolvedValue({
      ...makeWorkoutPlan(),
      workoutDays: [makeWorkoutDay()]
    })
    prismaMock.workoutSession.findUnique.mockResolvedValue(
      makeWorkoutSession({ workoutDayId: 'outro-day-id' })
    )

    await expect(useCase.execute(defaultInput)).rejects.toThrow(BadRequestError)
  })

  it('deve atualizar a sessão e retornar os dados em ISO com sucesso', async () => {
    const startedAt = new Date('2025-06-01T10:00:00Z')
    const completedAt = new Date('2025-06-01T12:00:00Z')

    prismaMock.workoutPlan.findUnique.mockResolvedValue({
      ...makeWorkoutPlan(),
      workoutDays: [makeWorkoutDay()]
    })
    prismaMock.workoutSession.findUnique.mockResolvedValue(makeWorkoutSession())
    prismaMock.workoutSession.update.mockResolvedValue(
      makeWorkoutSession({ startedAt, completedAt })
    )

    const result = await useCase.execute(defaultInput)

    expect(result).toEqual({
      id: 'session-id-1',
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString()
    })
    expect(prismaMock.workoutSession.update).toHaveBeenCalledOnce()
  })
})
