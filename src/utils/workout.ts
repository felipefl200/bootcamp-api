import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'

dayjs.extend(utc)

export function calculateWorkoutStreak(
  sessions: Array<{ startedAt: Date; completedAt: Date | null }>,
  targetDate: dayjs.Dayjs = dayjs.utc()
): number {
  const recentCompletedSessions = sessions.filter((s) => s.completedAt !== null)

  const uniqueDates = new Set(
    recentCompletedSessions.map((s) =>
      dayjs.utc(s.startedAt).format('YYYY-MM-DD')
    )
  )

  let workoutStreak = 0
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

  return workoutStreak
}
