import { WeekDay } from '../../generated/prisma/enums.js'

// --- User ---

export const makeUser = (
  overrides?: Partial<{
    id: string
    name: string
    email: string
    emailVerified: boolean
    image: string | null
    createdAt: Date
    updatedAt: Date
  }>
) => ({
  id: 'user-id-1',
  name: 'Felipe',
  email: 'felipe@example.com',
  emailVerified: true,
  image: null,
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
  ...overrides
})

// --- UserTrainData ---

export const makeUserTrainData = (
  overrides?: Partial<{
    id: string
    userId: string
    weightInGrams: number
    heightInCentimeters: number
    age: number
    bodyFatPercentage: number
    createdAt: Date
    updatedAt: Date
    user: { name: string }
  }>
) => ({
  id: 'train-data-id-1',
  userId: 'user-id-1',
  weightInGrams: 80000,
  heightInCentimeters: 175,
  age: 28,
  bodyFatPercentage: 0.15,
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
  user: { name: 'Felipe' },
  ...overrides
})

// --- WorkoutExercise ---

export const makeWorkoutExercise = (
  overrides?: Partial<{
    id: string
    name: string
    order: number
    set: number
    rep: number
    restTime: number
    workoutDayId: string
    createdAt: Date
    updatedAt: Date
  }>
) => ({
  id: 'exercise-id-1',
  name: 'Supino Reto',
  order: 1,
  set: 4,
  rep: 10,
  restTime: 60,
  workoutDayId: 'day-id-1',
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
  ...overrides
})

// --- WorkoutSession ---

export const makeWorkoutSession = (
  overrides?: Partial<{
    id: string
    workoutDayId: string
    startedAt: Date
    completedAt: Date | null
    createdAt: Date
    updatedAt: Date
  }>
) => ({
  id: 'session-id-1',
  workoutDayId: 'day-id-1',
  startedAt: new Date('2025-06-01T10:00:00Z'),
  completedAt: null,
  createdAt: new Date('2025-06-01T10:00:00Z'),
  updatedAt: new Date('2025-06-01T10:00:00Z'),
  ...overrides
})

// --- WorkoutDay ---

export const makeWorkoutDay = (
  overrides?: Partial<{
    id: string
    name: string
    weekDay: WeekDay
    isRest: boolean
    coverImageUrl: string | null
    workoutPlanId: string
    sessionId: string | null
    createdAt: Date
    updatedAt: Date
    workoutExercises: ReturnType<typeof makeWorkoutExercise>[]
    workoutSessions: ReturnType<typeof makeWorkoutSession>[]
  }>
) => ({
  id: 'day-id-1',
  name: 'Peito e Tríceps',
  weekDay: 'MONDAY' as WeekDay,
  isRest: false,
  coverImageUrl: null,
  workoutPlanId: 'plan-id-1',
  sessionId: null,
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
  workoutExercises: [],
  workoutSessions: [],
  ...overrides
})

// --- WorkoutPlan ---

export const makeWorkoutPlan = (
  overrides?: Partial<{
    id: string
    name: string
    userId: string
    isActive: boolean
    createdAt: Date
    updatedAt: Date
    workoutDays: ReturnType<typeof makeWorkoutDay>[]
  }>
) => ({
  id: 'plan-id-1',
  name: 'Plano A',
  userId: 'user-id-1',
  isActive: true,
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
  workoutDays: [],
  ...overrides
})
