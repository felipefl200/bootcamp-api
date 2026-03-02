import { beforeEach, describe, expect, it, vi } from 'vitest'

import { IUserRepository } from '../../../repositories/interfaces/IUserRepository.js'
import { IUserTrainDataRepository } from '../../../repositories/interfaces/IUserTrainDataRepository.js'
import { UpsertUserTrainData } from '../../../usecases/UpsertUserTrainData.js'
import { makeUser, makeUserTrainData } from '../../factories/index.js'

describe('UpsertUserTrainData', () => {
  let useCase: UpsertUserTrainData
  let userRepositoryMock: vi.Mocked<IUserRepository>
  let userTrainDataRepositoryMock: vi.Mocked<IUserTrainDataRepository>

  const defaultInput = {
    userId: 'user-id-1',
    weightInGrams: 80000,
    heightInCentimeters: 175,
    age: 28,
    bodyFatPercentage: 0.15
  }

  beforeEach(() => {
    userRepositoryMock = {
      findById: vi.fn(),
      findByIdOrThrow: vi.fn()
    }
    userTrainDataRepositoryMock = {
      findByUserId: vi.fn(),
      upsert: vi.fn()
    }
    useCase = new UpsertUserTrainData(
      userRepositoryMock,
      userTrainDataRepositoryMock
    )
  })

  it('deve relançar o erro quando o usuário não for encontrado', async () => {
    const error = new Error('No User found')
    userRepositoryMock.findByIdOrThrow.mockRejectedValue(error)

    await expect(useCase.execute(defaultInput)).rejects.toThrow('No User found')
  })

  it('deve criar e retornar os dados quando é a primeira vez', async () => {
    userRepositoryMock.findByIdOrThrow.mockResolvedValue(
      makeUser({ name: 'Felipe' })
    )
    userTrainDataRepositoryMock.upsert.mockResolvedValue(makeUserTrainData())

    const result = await useCase.execute(defaultInput)

    expect(result.userId).toBe('user-id-1')
    expect(result.userName).toBe('Felipe')
    expect(result.weightInGrams).toBe(80000)
    expect(result.heightInCentimeters).toBe(175)
    expect(result.age).toBe(28)
    expect(result.bodyFatPercentage).toBe(0.15)
    expect(userTrainDataRepositoryMock.upsert).toHaveBeenCalledOnce()
  })

  it('deve atualizar e retornar os dados atualizados', async () => {
    const updatedInput = { ...defaultInput, weightInGrams: 75000 }
    userRepositoryMock.findByIdOrThrow.mockResolvedValue(
      makeUser({ name: 'Felipe' })
    )
    userTrainDataRepositoryMock.upsert.mockResolvedValue(
      makeUserTrainData({ weightInGrams: 75000 })
    )

    const result = await useCase.execute(updatedInput)

    expect(result.weightInGrams).toBe(75000)
  })
})
