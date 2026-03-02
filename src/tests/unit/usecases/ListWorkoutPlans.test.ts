import { beforeEach, describe, expect, it, type Mocked,vi } from 'vitest'

import { IWorkoutPlanRepository } from '../../../repositories/interfaces/IWorkoutPlanRepository.js'
import { ListWorkoutPlans } from '../../../usecases/ListWorkoutPlans.js'
import { makeWorkoutPlan } from '../../factories/index.js'

describe('ListWorkoutPlans', () => {
  let useCase: ListWorkoutPlans
  let workoutPlanRepoMock: Mocked<IWorkoutPlanRepository>

  const defaultInput = { userId: 'user-id-1' }

  beforeEach(() => {
    workoutPlanRepoMock = {
      findById: vi.fn(),
      findByIdWithDays: vi.fn(),
      findActiveByUserId: vi.fn(),
      findManyByUserId: vi.fn(),
      createWithDeactivation: vi.fn()
    }

    useCase = new ListWorkoutPlans(workoutPlanRepoMock)
  })

  it('deve retornar lista vazia quando não há planos', async () => {
    workoutPlanRepoMock.findManyByUserId.mockResolvedValue([])

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
    workoutPlanRepoMock.findManyByUserId.mockResolvedValue(plans)

    const result = await useCase.execute(defaultInput)

    expect(result.workoutPlans).toHaveLength(2)
    expect(result.workoutPlans[0].id).toBe('plan-1')
    expect(result.workoutPlans[0].name).toBe('Plano A')
    expect(result.workoutPlans[0].isActive).toBe(true)
    expect(result.workoutPlans[1].isActive).toBe(false)
  })

  it('deve chamar o Repo com os parâmetros corretos', async () => {
    workoutPlanRepoMock.findManyByUserId.mockResolvedValue([])

    await useCase.execute(defaultInput)

    expect(workoutPlanRepoMock.findManyByUserId).toHaveBeenCalledWith(
      'user-id-1'
    )
  })
})
