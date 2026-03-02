import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'

import { IWorkoutSessionRepository } from '../repositories/interfaces/IWorkoutSessionRepository.js'

dayjs.extend(utc)

interface InputDto {
  userId: string
  from: string
  to: string
}

interface OutputDto {
  workoutStreak: number
  consistencyByDay: Record<
    string,
    {
      workoutDayCompleted: boolean
      workoutDayStarted: boolean
    }
  >
  completedWorkoutsCount: number
  conclusionRate: number
  totalTimeInSeconds: number
}

export class GetStats {
  constructor(private workoutSessionRepository: IWorkoutSessionRepository) {}

  async execute(dto: InputDto): Promise<OutputDto> {
    const fromDate = dayjs.utc(dto.from).startOf('day').toDate()
    const toDate = dayjs.utc(dto.to).endOf('day').toDate()

    const sessionsInRange =
      await this.workoutSessionRepository.findSessionsInPeriod(
        dto.userId,
        fromDate,
        toDate
      )

    const consistencyByDay: Record<
      string,
      { workoutDayCompleted: boolean; workoutDayStarted: boolean }
    > = {}
    let completedWorkoutsCount = 0
    let totalTimeInSeconds = 0

    for (const session of sessionsInRange) {
      const dateKey = dayjs.utc(session.startedAt).format('YYYY-MM-DD')

      if (!consistencyByDay[dateKey]) {
        consistencyByDay[dateKey] = {
          workoutDayCompleted: false,
          workoutDayStarted: false
        }
      }

      consistencyByDay[dateKey].workoutDayStarted = true

      if (session.completedAt) {
        consistencyByDay[dateKey].workoutDayCompleted = true
        completedWorkoutsCount++

        const duration = dayjs(session.completedAt).diff(
          dayjs(session.startedAt),
          'second'
        )
        totalTimeInSeconds += duration
      }
    }

    const conclusionRate =
      sessionsInRange.length > 0
        ? completedWorkoutsCount / sessionsInRange.length
        : 0

    // Para o streak precisariamos ir no infinito pra trás usando o Repositório caso esse "findSessionsInPeriod" traga soh o range isolado.
    // Como a lógica legada não recebia start/end para a streak recents, puxamos até onde tiver com novo método se quisermos pureza, ou usamos range maior.
    // Legado assumia que Prisma pegaria tudo pq não havia data de limitação na query de baixo.
    // Vou usar uma gambiarra aceitável para o refactory: puxar 90 dias pra trás (ou adicionar um novo método no repo depois)
    const ninetyDaysAgo = dayjs.utc().subtract(90, 'days').toDate()
    const recentCompletedSessions =
      await this.workoutSessionRepository.findSessionsInPeriod(
        dto.userId,
        ninetyDaysAgo,
        dayjs.utc().toDate()
      )
    const recentCompletedOnly = recentCompletedSessions.filter(
      (s) => s.completedAt !== null
    )

    let workoutStreak = 0
    const targetDate = dayjs.utc()
    const uniqueDates = new Set(
      recentCompletedOnly.map((s) =>
        dayjs.utc(s.startedAt).format('YYYY-MM-DD')
      )
    )
    let currentDateToCheck = targetDate

    if (uniqueDates.has(currentDateToCheck.format('YYYY-MM-DD'))) {
      while (uniqueDates.has(currentDateToCheck.format('YYYY-MM-DD'))) {
        workoutStreak++
        currentDateToCheck = currentDateToCheck.subtract(1, 'day')
      }
    } else {
      currentDateToCheck = currentDateToCheck.subtract(1, 'day')
      while (uniqueDates.has(currentDateToCheck.format('YYYY-MM-DD'))) {
        workoutStreak++
        currentDateToCheck = currentDateToCheck.subtract(1, 'day')
      }
    }

    return {
      workoutStreak,
      consistencyByDay,
      completedWorkoutsCount,
      conclusionRate,
      totalTimeInSeconds
    }
  }
}
