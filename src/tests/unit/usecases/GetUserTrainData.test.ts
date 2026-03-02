import { beforeEach, describe, expect, it, type Mocked,vi } from 'vitest'

import {
  IUserTrainDataRepository,
  UserTrainDataWithUser
} from '../../../repositories/interfaces/IUserTrainDataRepository.js'
import { GetUserTrainData } from '../../../usecases/GetUserTrainData.js'
import { makeUserTrainData } from '../../factories/index.js'

describe('GetUserTrainData', () => {
  let useCase: GetUserTrainData
  let userTrainDataRepositoryMock: Mocked<IUserTrainDataRepository>

  const defaultInput = { userId: 'user-id-1' }

  beforeEach(() => {
    userTrainDataRepositoryMock = {
      findByUserId: vi.fn(),
      upsert: vi.fn()
    }
    useCase = new GetUserTrainData(userTrainDataRepositoryMock)
  })

  it('deve retornar null quando os dados de treino não existem', async () => {
    userTrainDataRepositoryMock.findByUserId.mockResolvedValue(null)

    const result = await useCase.execute(defaultInput)

    expect(result).toBeNull()
  })

  it('deve retornar os dados de treino com o nome do usuário', async () => {
    userTrainDataRepositoryMock.findByUserId.mockResolvedValue(
      makeUserTrainData({ user: { name: 'Felipe' } }) as UserTrainDataWithUser
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
