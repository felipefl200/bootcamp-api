import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError
} from '../../../errors/index.js'
import { IWorkoutPlanRepository } from '../../../repositories/interfaces/IWorkoutPlanRepository.js'
import { IWorkoutSessionRepository } from '../../../repositories/interfaces/IWorkoutSessionRepository.js'
import { UpdateWorkoutSession } from '../../../usecases/UpdateWorkoutSession.js'
import {
  makeWorkoutDay,
  makeWorkoutPlan,
  makeWorkoutSession
} from '../../factories/index.js'

describe('UpdateWorkoutSession', () => {
  let useCase: UpdateWorkoutSession
  let workoutPlanRepoMock: vi.Mocked<IWorkoutPlanRepository>
  let workoutSessionRepoMock: vi.Mocked<IWorkoutSessionRepository>

  const defaultInput = {
    userId: 'user-id-1',
    workoutPlanId: 'plan-id-1',
    workoutDayId: 'day-id-1',
    workoutSessionId: 'session-id-1',
    completedAt: '2025-06-01T12:00:00.000Z'
  }

  beforeEach(() => {
    workoutPlanRepoMock = {
      findById: vi.fn(),
      findByIdWithDays: vi.fn(),
      findActiveByUserId: vi.fn(),
      findManyByUserId: vi.fn(),
      createWithDeactivation: vi.fn()
    }

    workoutSessionRepoMock = {
      findById: vi.fn(),
      findActiveSessionForDay: vi.fn(),
      findSessionsInPeriod: vi.fn(),
      create: vi.fn(),
      markAsCompleted: vi.fn()
    }

    useCase = new UpdateWorkoutSession(
      workoutPlanRepoMock,
      workoutSessionRepoMock
    )
  })

  it('deve lançar NotFoundError quando o plano não existe', async () => {
    workoutPlanRepoMock.findByIdWithDays.mockResolvedValue(null)

    await expect(useCase.execute(defaultInput)).rejects.toThrow(NotFoundError)
  })

  it('deve lançar UnauthorizedError quando o userId não é o dono do plano', async () => {
    workoutPlanRepoMock.findByIdWithDays.mockResolvedValue({
      ...makeWorkoutPlan({ userId: 'outro-user' }),
      workoutDays: []
    } as unknown as any)

    await expect(useCase.execute(defaultInput)).rejects.toThrow(
      UnauthorizedError
    )
  })

  it('deve lançar BadRequestError quando o dia não pertence ao plano', async () => {
    workoutPlanRepoMock.findByIdWithDays.mockResolvedValue({
      ...makeWorkoutPlan(),
      workoutDays: []
    } as unknown as any)

    await expect(useCase.execute(defaultInput)).rejects.toThrow(BadRequestError)
  })

  it('deve lançar NotFoundError quando a sessão não existe', async () => {
    workoutPlanRepoMock.findByIdWithDays.mockResolvedValue({
      ...makeWorkoutPlan(),
      workoutDays: [makeWorkoutDay()]
    } as unknown as any)
    workoutSessionRepoMock.findById.mockResolvedValue(null)

    await expect(useCase.execute(defaultInput)).rejects.toThrow(NotFoundError)
  })

  it('deve lançar BadRequestError quando a sessão não pertence ao dia', async () => {
    workoutPlanRepoMock.findByIdWithDays.mockResolvedValue({
      ...makeWorkoutPlan(),
      workoutDays: [makeWorkoutDay()]
    } as unknown as any)
    workoutSessionRepoMock.findById.mockResolvedValue(
      makeWorkoutSession({ workoutDayId: 'outro-day-id' })
    )

    await expect(useCase.execute(defaultInput)).rejects.toThrow(BadRequestError)
  })

  it('deve atualizar a sessão e retornar os dados em ISO com sucesso', async () => {
    const startedAt = new Date('2025-06-01T10:00:00Z')
    const completedAt = new Date('2025-06-01T12:00:00Z')

    workoutPlanRepoMock.findByIdWithDays.mockResolvedValue({
      ...makeWorkoutPlan(),
      workoutDays: [makeWorkoutDay()]
    } as unknown as any)
    workoutSessionRepoMock.findById.mockResolvedValue(
      makeWorkoutSession({ startedAt })
    )
    workoutSessionRepoMock.markAsCompleted.mockResolvedValue(
      makeWorkoutSession({ startedAt, completedAt })
    )

    const result = await useCase.execute(defaultInput)

    expect(result).toEqual({
      id: 'session-id-1',
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString()
    })
    expect(workoutSessionRepoMock.markAsCompleted).toHaveBeenCalledOnce()
  })
})
