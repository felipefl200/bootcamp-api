import { beforeEach, describe, expect, it, type Mocked,vi } from 'vitest'

import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  WorkoutPlanNotActiveError
} from '../../../errors/index.js'
import { IWorkoutDayRepository } from '../../../repositories/interfaces/IWorkoutDayRepository.js'
import { IWorkoutPlanRepository } from '../../../repositories/interfaces/IWorkoutPlanRepository.js'
import { IWorkoutSessionRepository } from '../../../repositories/interfaces/IWorkoutSessionRepository.js'
import { StartWorkoutSession } from '../../../usecases/StartWorkoutSession.js'
import {
  makeWorkoutDay,
  makeWorkoutPlan,
  makeWorkoutSession
} from '../../factories/index.js'

describe('StartWorkoutSession', () => {
  let useCase: StartWorkoutSession
  let workoutPlanRepoMock: Mocked<IWorkoutPlanRepository>
  let workoutDayRepoMock: Mocked<IWorkoutDayRepository>
  let workoutSessionRepoMock: Mocked<IWorkoutSessionRepository>

  const defaultInput = {
    userId: 'user-id-1',
    workoutPlanId: 'plan-id-1',
    workoutDayId: 'day-id-1'
  }

  beforeEach(() => {
    workoutPlanRepoMock = {
      findById: vi.fn(),
      findByIdWithDays: vi.fn(),
      findActiveByUserId: vi.fn(),
      findManyByUserId: vi.fn(),
      createWithDeactivation: vi.fn()
    }

    workoutDayRepoMock = {
      findById: vi.fn(),
      findByIdWithExercises: vi.fn(),
      findByIdWithExercisesAndSessions: vi.fn()
    }

    workoutSessionRepoMock = {
      findById: vi.fn(),
      findActiveSessionForDay: vi.fn(),
      findSessionsInPeriod: vi.fn(),
      create: vi.fn(),
      markAsCompleted: vi.fn()
    }

    useCase = new StartWorkoutSession(
      workoutPlanRepoMock,
      workoutDayRepoMock,
      workoutSessionRepoMock
    )
  })

  it('deve lançar NotFoundError quando o plano não existe', async () => {
    workoutPlanRepoMock.findById.mockResolvedValue(null)

    await expect(useCase.execute(defaultInput)).rejects.toThrow(NotFoundError)
  })

  it('deve lançar UnauthorizedError quando o userId não é o dono do plano', async () => {
    workoutPlanRepoMock.findById.mockResolvedValue(
      makeWorkoutPlan({ userId: 'outro-user-id' })
    )

    await expect(useCase.execute(defaultInput)).rejects.toThrow(
      UnauthorizedError
    )
  })

  it('deve lançar WorkoutPlanNotActiveError quando o plano está inativo', async () => {
    workoutPlanRepoMock.findById.mockResolvedValue(
      makeWorkoutPlan({ isActive: false })
    )

    await expect(useCase.execute(defaultInput)).rejects.toThrow(
      WorkoutPlanNotActiveError
    )
  })

  it('deve lançar NotFoundError quando o dia não existe', async () => {
    workoutPlanRepoMock.findById.mockResolvedValue(makeWorkoutPlan())
    workoutDayRepoMock.findById.mockResolvedValue(null)

    await expect(useCase.execute(defaultInput)).rejects.toThrow(NotFoundError)
  })

  it('deve lançar BadRequestError quando o dia não pertence ao plano', async () => {
    workoutPlanRepoMock.findById.mockResolvedValue(makeWorkoutPlan())
    workoutDayRepoMock.findById.mockResolvedValue(
      makeWorkoutDay({ workoutPlanId: 'outro-plan-id' })
    )

    await expect(useCase.execute(defaultInput)).rejects.toThrow(BadRequestError)
  })

  it('deve lançar ConflictError quando já existe uma sessão ativa para o dia', async () => {
    workoutPlanRepoMock.findById.mockResolvedValue(makeWorkoutPlan())
    workoutDayRepoMock.findById.mockResolvedValue(makeWorkoutDay())
    workoutSessionRepoMock.findActiveSessionForDay.mockResolvedValue(
      makeWorkoutSession({ completedAt: null })
    )

    await expect(useCase.execute(defaultInput)).rejects.toThrow(ConflictError)
  })

  it('deve criar e retornar a sessão com sucesso', async () => {
    workoutPlanRepoMock.findById.mockResolvedValue(makeWorkoutPlan())
    workoutDayRepoMock.findById.mockResolvedValue(makeWorkoutDay())
    workoutSessionRepoMock.findActiveSessionForDay.mockResolvedValue(null)
    workoutSessionRepoMock.create.mockResolvedValue(
      makeWorkoutSession({ id: 'new-session-id' })
    )

    const result = await useCase.execute(defaultInput)

    expect(result).toEqual({ userWorkoutSessionId: 'new-session-id' })
    expect(workoutSessionRepoMock.create).toHaveBeenCalledOnce()
  })

  it('deve permitir iniciar sessão em um dia de descanso', async () => {
    workoutPlanRepoMock.findById.mockResolvedValue(makeWorkoutPlan())
    workoutDayRepoMock.findById.mockResolvedValue(
      makeWorkoutDay({ isRest: true })
    )
    workoutSessionRepoMock.findActiveSessionForDay.mockResolvedValue(null)
    workoutSessionRepoMock.create.mockResolvedValue(
      makeWorkoutSession({ id: 'rest-session-id' })
    )

    const result = await useCase.execute(defaultInput)

    expect(result).toEqual({ userWorkoutSessionId: 'rest-session-id' })
  })
})
