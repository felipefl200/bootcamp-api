import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ListWorkoutPlans } from '../../../usecases/ListWorkoutPlans.js'
import { makeWorkoutPlan } from '../../factories/index.js'

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

describe('ListWorkoutPlans', () => {
  const useCase = new ListWorkoutPlans()

  const defaultInput = { userId: 'user-id-1' }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve retornar lista vazia quando não há planos', async () => {
    prismaMock.workoutPlan.findMany.mockResolvedValue([])

    const result = await useCase.execute(defaultInput)

    expect(result.workoutPlans).toHaveLength(0)
  })

  it('deve retornar a lista de planos com os campos corretos', async () => {
    const plans = [
      makeWorkoutPlan({
        id: 'plan-1',
        name: 'Plano A',
        isActive: true,
        createdAt: new Date('2025-06-02T00:00:00Z')
      }),
      makeWorkoutPlan({
        id: 'plan-2',
        name: 'Plano B',
        isActive: false,
        createdAt: new Date('2025-05-01T00:00:00Z')
      })
    ]
    prismaMock.workoutPlan.findMany.mockResolvedValue(plans)

    const result = await useCase.execute(defaultInput)

    expect(result.workoutPlans).toHaveLength(2)
    expect(result.workoutPlans[0].id).toBe('plan-1')
    expect(result.workoutPlans[0].name).toBe('Plano A')
    expect(result.workoutPlans[0].isActive).toBe(true)
    expect(result.workoutPlans[1].isActive).toBe(false)
  })

  it('deve chamar o Prisma com os parâmetros corretos', async () => {
    prismaMock.workoutPlan.findMany.mockResolvedValue([])

    await useCase.execute(defaultInput)

    expect(prismaMock.workoutPlan.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-id-1' },
      select: { id: true, name: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    })
  })
})
