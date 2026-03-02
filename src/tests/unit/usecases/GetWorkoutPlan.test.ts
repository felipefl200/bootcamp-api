import { beforeEach, describe, expect, it, vi } from 'vitest'

import { NotFoundError, UnauthorizedError } from '../../../errors/index.js'
import { GetWorkoutPlan } from '../../../usecases/GetWorkoutPlan.js'
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

describe('GetWorkoutPlan', () => {
  const useCase = new GetWorkoutPlan()

  const defaultInput = {
    userId: 'user-id-1',
    workoutPlanId: 'plan-id-1'
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

  it('deve retornar o plano com exercisesCount e estimatedDurationInSeconds calculados', async () => {
    // set=4, rep=10, restTime=60 → 10*4*5 + 60*4 = 200 + 240 = 440s
    const exercise = makeWorkoutExercise({ set: 4, rep: 10, restTime: 60 })
    prismaMock.workoutPlan.findUnique.mockResolvedValue({
      ...makeWorkoutPlan(),
      workoutDays: [
        {
          ...makeWorkoutDay(),
          workoutExercises: [exercise]
        }
      ]
    })

    const result = await useCase.execute(defaultInput)

    expect(result.id).toBe('plan-id-1')
    expect(result.name).toBe('Plano A')
    expect(result.workoutDays).toHaveLength(1)
    expect(result.workoutDays[0].exercisesCount).toBe(1)
    expect(result.workoutDays[0].estimatedDurationInSeconds).toBe(440)
  })

  it('deve retornar estimatedDurationInSeconds zero para dias sem exercícios', async () => {
    prismaMock.workoutPlan.findUnique.mockResolvedValue({
      ...makeWorkoutPlan(),
      workoutDays: [
        { ...makeWorkoutDay({ isRest: true }), workoutExercises: [] }
      ]
    })

    const result = await useCase.execute(defaultInput)

    expect(result.workoutDays[0].estimatedDurationInSeconds).toBe(0)
    expect(result.workoutDays[0].exercisesCount).toBe(0)
  })
})
