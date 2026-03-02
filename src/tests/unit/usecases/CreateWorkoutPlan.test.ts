import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CreateWorkoutPlan } from '../../../usecases/CreateWorkoutPlan.js'
import {
  makeWorkoutDay,
  makeWorkoutExercise,
  makeWorkoutPlan
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

describe('CreateWorkoutPlan', () => {
  const useCase = new CreateWorkoutPlan()

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
    vi.clearAllMocks()
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
    prismaMock.workoutPlan.findFirst.mockResolvedValue(null)
    const createdPlan = makePlanWithDays()
    prismaMock.$transaction.mockImplementation(
      async (cb: (tx: typeof prismaMock) => unknown) => cb(prismaMock)
    )
    prismaMock.workoutPlan.create.mockResolvedValue(createdPlan)
    prismaMock.workoutPlan.findUnique.mockResolvedValue(createdPlan)

    const result = await useCase.execute(defaultInput)

    expect(prismaMock.workoutPlan.update).not.toHaveBeenCalled()
    expect(result.name).toBe('Meu Plano A')
    expect(result.isActive).toBe(true)
  })

  it('deve desativar o plano ativo anterior ao criar um novo', async () => {
    const existingPlan = makeWorkoutPlan({ id: 'old-plan-id', isActive: true })
    prismaMock.workoutPlan.findFirst.mockResolvedValue(existingPlan)
    const createdPlan = makePlanWithDays()
    prismaMock.$transaction.mockImplementation(
      async (cb: (tx: typeof prismaMock) => unknown) => cb(prismaMock)
    )
    prismaMock.workoutPlan.update.mockResolvedValue({
      ...existingPlan,
      isActive: false
    })
    prismaMock.workoutPlan.create.mockResolvedValue(createdPlan)
    prismaMock.workoutPlan.findUnique.mockResolvedValue(createdPlan)

    await useCase.execute(defaultInput)

    expect(prismaMock.workoutPlan.update).toHaveBeenCalledWith({
      where: { id: 'old-plan-id' },
      data: { isActive: false }
    })
  })

  it('deve retornar o plano completo com dias e exercícios', async () => {
    prismaMock.workoutPlan.findFirst.mockResolvedValue(null)
    const createdPlan = makePlanWithDays()
    prismaMock.$transaction.mockImplementation(
      async (cb: (tx: typeof prismaMock) => unknown) => cb(prismaMock)
    )
    prismaMock.workoutPlan.create.mockResolvedValue(createdPlan)
    prismaMock.workoutPlan.findUnique.mockResolvedValue(createdPlan)

    const result = await useCase.execute(defaultInput)

    expect(result.workoutDays).toHaveLength(1)
    expect(result.workoutDays[0].workoutExercises).toHaveLength(1)
    expect(result.workoutDays[0].name).toBe('Peito e Tríceps')
  })
})
