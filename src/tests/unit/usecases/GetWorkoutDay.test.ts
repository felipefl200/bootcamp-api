import { beforeEach, describe, expect, it, vi } from 'vitest'

import { NotFoundError, UnauthorizedError } from '../../../errors/index.js'
import { GetWorkoutDay } from '../../../usecases/GetWorkoutDay.js'
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

describe('GetWorkoutDay', () => {
  const useCase = new GetWorkoutDay()

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
    prismaMock.workoutPlan.findUnique.mockResolvedValue({
      ...makeWorkoutPlan({ userId: 'outro-user' }),
      workoutDays: []
    })

    await expect(useCase.execute(defaultInput)).rejects.toThrow(
      UnauthorizedError
    )
  })

  it('deve lançar NotFoundError quando o dia não é encontrado no plano', async () => {
    prismaMock.workoutPlan.findUnique.mockResolvedValue({
      ...makeWorkoutPlan(),
      workoutDays: []
    })

    await expect(useCase.execute(defaultInput)).rejects.toThrow(NotFoundError)
  })

  it('deve retornar o dia completo com exercícios e sessões', async () => {
    const exercise = makeWorkoutExercise()
    const session = makeWorkoutSession({
      startedAt: new Date('2025-06-01T10:00:00Z'),
      completedAt: new Date('2025-06-01T11:30:00Z')
    })

    prismaMock.workoutPlan.findUnique.mockResolvedValue({
      ...makeWorkoutPlan(),
      workoutDays: [
        {
          ...makeWorkoutDay(),
          workoutExercises: [exercise],
          workoutSessions: [session]
        }
      ]
    })

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

    prismaMock.workoutPlan.findUnique.mockResolvedValue({
      ...makeWorkoutPlan(),
      workoutDays: [
        {
          ...makeWorkoutDay(),
          workoutExercises: [],
          workoutSessions: [session]
        }
      ]
    })

    const result = await useCase.execute(defaultInput)

    expect(result.sessions[0].completedAt).toBeUndefined()
    expect(result.sessions[0].startedAt).toBeDefined()
  })

  it('deve calcular estimatedDurationInSeconds corretamente', async () => {
    // set=3, rep=12, restTime=90 → 12*3*5 + 90*3 = 180 + 270 = 450s
    const exercise = makeWorkoutExercise({ set: 3, rep: 12, restTime: 90 })

    prismaMock.workoutPlan.findUnique.mockResolvedValue({
      ...makeWorkoutPlan(),
      workoutDays: [
        {
          ...makeWorkoutDay(),
          workoutExercises: [exercise],
          workoutSessions: []
        }
      ]
    })

    const result = await useCase.execute(defaultInput)

    expect(result.estimatedDurationInSeconds).toBe(450)
  })
})
