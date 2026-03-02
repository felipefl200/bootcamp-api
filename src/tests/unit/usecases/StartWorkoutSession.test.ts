import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  WorkoutPlanNotActiveError
} from '../../../errors/index.js'
import { StartWorkoutSession } from '../../../usecases/StartWorkoutSession.js'
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

describe('StartWorkoutSession', () => {
  const useCase = new StartWorkoutSession()

  const defaultInput = {
    userId: 'user-id-1',
    workoutPlanId: 'plan-id-1',
    workoutDayId: 'day-id-1'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve lançar NotFoundError quando o plano não existe', async () => {
    prismaMock.workoutPlan.findUnique.mockResolvedValue(null)

    await expect(useCase.execute(defaultInput)).rejects.toThrow(NotFoundError)
  })

  it('deve lançar UnauthorizedError quando o userId não é o dono do plano', async () => {
    prismaMock.workoutPlan.findUnique.mockResolvedValue(
      makeWorkoutPlan({ userId: 'outro-user-id' })
    )

    await expect(useCase.execute(defaultInput)).rejects.toThrow(
      UnauthorizedError
    )
  })

  it('deve lançar WorkoutPlanNotActiveError quando o plano está inativo', async () => {
    prismaMock.workoutPlan.findUnique.mockResolvedValue(
      makeWorkoutPlan({ isActive: false })
    )

    await expect(useCase.execute(defaultInput)).rejects.toThrow(
      WorkoutPlanNotActiveError
    )
  })

  it('deve lançar NotFoundError quando o dia não existe', async () => {
    prismaMock.workoutPlan.findUnique.mockResolvedValue(makeWorkoutPlan())
    prismaMock.workoutDay.findUnique.mockResolvedValue(null)

    await expect(useCase.execute(defaultInput)).rejects.toThrow(NotFoundError)
  })

  it('deve lançar BadRequestError quando o dia não pertence ao plano', async () => {
    prismaMock.workoutPlan.findUnique.mockResolvedValue(makeWorkoutPlan())
    prismaMock.workoutDay.findUnique.mockResolvedValue(
      makeWorkoutDay({ workoutPlanId: 'outro-plan-id' })
    )

    await expect(useCase.execute(defaultInput)).rejects.toThrow(BadRequestError)
  })

  it('deve lançar ConflictError quando já existe uma sessão ativa para o dia', async () => {
    prismaMock.workoutPlan.findUnique.mockResolvedValue(makeWorkoutPlan())
    prismaMock.workoutDay.findUnique.mockResolvedValue(makeWorkoutDay())
    prismaMock.workoutSession.findFirst.mockResolvedValue(
      makeWorkoutSession({ completedAt: null })
    )

    await expect(useCase.execute(defaultInput)).rejects.toThrow(ConflictError)
  })

  it('deve criar e retornar a sessão com sucesso', async () => {
    prismaMock.workoutPlan.findUnique.mockResolvedValue(makeWorkoutPlan())
    prismaMock.workoutDay.findUnique.mockResolvedValue(makeWorkoutDay())
    prismaMock.workoutSession.findFirst.mockResolvedValue(null)
    prismaMock.workoutSession.create.mockResolvedValue(
      makeWorkoutSession({ id: 'new-session-id' })
    )

    const result = await useCase.execute(defaultInput)

    expect(result).toEqual({ userWorkoutSessionId: 'new-session-id' })
    expect(prismaMock.workoutSession.create).toHaveBeenCalledOnce()
  })

  it('deve permitir iniciar sessão em um dia de descanso', async () => {
    prismaMock.workoutPlan.findUnique.mockResolvedValue(makeWorkoutPlan())
    prismaMock.workoutDay.findUnique.mockResolvedValue(
      makeWorkoutDay({ isRest: true })
    )
    prismaMock.workoutSession.findFirst.mockResolvedValue(null)
    prismaMock.workoutSession.create.mockResolvedValue(
      makeWorkoutSession({ id: 'rest-session-id' })
    )

    const result = await useCase.execute(defaultInput)

    expect(result).toEqual({ userWorkoutSessionId: 'rest-session-id' })
  })
})
