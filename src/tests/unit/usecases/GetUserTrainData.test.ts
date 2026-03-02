import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GetUserTrainData } from '../../../usecases/GetUserTrainData.js'
import { makeUserTrainData } from '../../factories/index.js'

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

describe('GetUserTrainData', () => {
  const useCase = new GetUserTrainData()

  const defaultInput = { userId: 'user-id-1' }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve retornar null quando os dados de treino não existem', async () => {
    prismaMock.userTrainData.findUnique.mockResolvedValue(null)

    const result = await useCase.execute(defaultInput)

    expect(result).toBeNull()
  })

  it('deve retornar os dados de treino com o nome do usuário', async () => {
    prismaMock.userTrainData.findUnique.mockResolvedValue(
      makeUserTrainData({ user: { name: 'Felipe' } })
    )

    const result = await useCase.execute(defaultInput)

    expect(result).not.toBeNull()
    expect(result?.userId).toBe('user-id-1')
    expect(result?.userName).toBe('Felipe')
    expect(result?.weightInGrams).toBe(80000)
    expect(result?.heightInCentimeters).toBe(175)
    expect(result?.age).toBe(28)
    expect(result?.bodyFatPercentage).toBe(0.15)
  })
})
