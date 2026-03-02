import { vi } from 'vitest'

/**
 * Retorna um objeto com `prismaMock` pronto para uso.
 * Deve ser chamado assim em cada arquivo de teste:
 *
 * ```ts
 * const { prismaMock } = vi.hoisted(makePrismaMock)
 * vi.mock('../../../lib/db.js', () => ({ prisma: prismaMock }))
 * ```
 *
 * A função usa apenas `vi.fn()` internamente — sem imports externos —
 * para evitar o erro de hoisting ESM do Vitest.
 */
export const makePrismaMock = () => ({
  prismaMock: {
    workoutPlan: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn()
    },
    workoutDay: {
      findUnique: vi.fn(),
      findMany: vi.fn()
    },
    workoutSession: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn()
    },
    user: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn()
    },
    userTrainData: {
      findUnique: vi.fn(),
      upsert: vi.fn()
    },
    $transaction: vi.fn()
  }
})
