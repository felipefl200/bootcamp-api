import { beforeEach, describe, expect, it, vi } from 'vitest'

import { UpsertUserTrainData } from '../../../usecases/UpsertUserTrainData.js'
import { makeUser, makeUserTrainData } from '../../factories/index.js'

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

describe('UpsertUserTrainData', () => {
  const useCase = new UpsertUserTrainData()

  const defaultInput = {
    userId: 'user-id-1',
    weightInGrams: 80000,
    heightInCentimeters: 175,
    age: 28,
    bodyFatPercentage: 0.15
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve relançar o erro quando o usuário não for encontrado', async () => {
    const prismaError = new Error('No User found')
    prismaMock.user.findUniqueOrThrow.mockRejectedValue(prismaError)

    await expect(useCase.execute(defaultInput)).rejects.toThrow('No User found')
  })

  it('deve criar e retornar os dados quando é a primeira vez', async () => {
    prismaMock.user.findUniqueOrThrow.mockResolvedValue(
      makeUser({ name: 'Felipe' })
    )
    prismaMock.userTrainData.upsert.mockResolvedValue(makeUserTrainData())

    const result = await useCase.execute(defaultInput)

    expect(result.userId).toBe('user-id-1')
    expect(result.userName).toBe('Felipe')
    expect(result.weightInGrams).toBe(80000)
    expect(result.heightInCentimeters).toBe(175)
    expect(result.age).toBe(28)
    expect(result.bodyFatPercentage).toBe(0.15)
    expect(prismaMock.userTrainData.upsert).toHaveBeenCalledOnce()
  })

  it('deve atualizar e retornar os dados atualizados', async () => {
    const updatedInput = { ...defaultInput, weightInGrams: 75000 }
    prismaMock.user.findUniqueOrThrow.mockResolvedValue(
      makeUser({ name: 'Felipe' })
    )
    prismaMock.userTrainData.upsert.mockResolvedValue(
      makeUserTrainData({ weightInGrams: 75000 })
    )

    const result = await useCase.execute(updatedInput)

    expect(result.weightInGrams).toBe(75000)
  })
})
