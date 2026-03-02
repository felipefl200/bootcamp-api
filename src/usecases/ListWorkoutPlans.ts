import { prisma } from '../lib/db.js'

interface InputDto {
  userId: string
}

interface OutputDto {
  workoutPlans: Array<{
    id: string
    name: string
    isActive: boolean
    createdAt: Date
  }>
}

export class ListWorkoutPlans {
  async execute(dto: InputDto): Promise<OutputDto> {
    const plans = await prisma.workoutPlan.findMany({
      where: { userId: dto.userId },
      select: {
        id: true,
        name: true,
        isActive: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return { workoutPlans: plans }
  }
}
