import { openai } from '@ai-sdk/openai'
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
  type UIMessage
} from 'ai'
import { fromNodeHeaders } from 'better-auth/node'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

import { UnauthorizedError } from '../errors/index.js'
import { WeekDay } from '../generated/prisma/enums.js'
import { auth } from '../lib/auth.js'
import { PrismaUserRepository } from '../repositories/prisma/PrismaUserRepository.js'
import { PrismaUserTrainDataRepository } from '../repositories/prisma/PrismaUserTrainDataRepository.js'
import { PrismaWorkoutPlanRepository } from '../repositories/prisma/PrismaWorkoutPlanRepository.js'
import { CreateWorkoutPlan } from '../usecases/CreateWorkoutPlan.js'
import { GetUserTrainData } from '../usecases/GetUserTrainData.js'
import { ListWorkoutPlans } from '../usecases/ListWorkoutPlans.js'
import { UpsertUserTrainData } from '../usecases/UpsertUserTrainData.js'
import { personalTrainerPrompt } from '../utils/prompts.js'
import { IController } from './IController.js'

const userRepository = new PrismaUserRepository()
const userTrainDataRepository = new PrismaUserTrainDataRepository()
const workoutPlanRepository = new PrismaWorkoutPlanRepository()

export class AIController implements IController {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async handle(request: FastifyRequest, _reply: FastifyReply) {
    const authSession = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers)
    })

    if (!authSession || !authSession.user || !authSession.session) {
      throw new UnauthorizedError()
    }

    const { messages } = request.body as { messages: Record<string, unknown>[] }
    const userId = authSession.user.id
    const sessionId = authSession.session.id

    const result = streamText({
      model: openai('gpt-4o'),
      system: personalTrainerPrompt,
      messages: await convertToModelMessages(
        messages as unknown as UIMessage[]
      ),
      stopWhen: stepCountIs(5),
      tools: {
        getUserTrainData: tool({
          description:
            'Fetch the user biometrics and basic data that has been registered',
          inputSchema: z.object({}),
          execute: async () => {
            const uc = new GetUserTrainData(userTrainDataRepository)
            return uc.execute({ userId })
          }
        }),
        updateUserTrainData: tool({
          description:
            'Upsert weight, height, age and body fat metrics in database relative to the authenticated user caller',
          inputSchema: z.object({
            weightInGrams: z.number(),
            heightInCentimeters: z.number(),
            age: z.number(),
            bodyFatPercentage: z.number()
          }),
          execute: async (params) => {
            const uc = new UpsertUserTrainData(
              userRepository,
              userTrainDataRepository
            )
            return uc.execute({ userId, ...params })
          }
        }),
        getWorkoutPlans: tool({
          description: 'Fetch basic user current active workout plans.',
          inputSchema: z.object({}),
          execute: async () => {
            const uc = new ListWorkoutPlans(workoutPlanRepository)
            return uc.execute({ userId })
          }
        }),
        createWorkoutPlan: tool({
          description:
            'Constructs the requested user schedule inserting the splits correctly bound into the days with exercises nodes.',
          inputSchema: z.object({
            name: z.string(),
            workoutDays: z.array(
              z.object({
                name: z.string(),
                weekDay: z.enum([
                  'MONDAY',
                  'TUESDAY',
                  'WEDNESDAY',
                  'THURSDAY',
                  'FRIDAY',
                  'SATURDAY',
                  'SUNDAY'
                ]),
                isRest: z.boolean(),
                coverImageUrl: z.url().optional(),
                workoutExercises: z.array(
                  z.object({
                    name: z.string(),
                    order: z.number(),
                    set: z.number(),
                    rep: z.number(),
                    restTime: z.number()
                  })
                )
              })
            )
          }),
          execute: async (params) => {
            const uc = new CreateWorkoutPlan(workoutPlanRepository)
            return uc.execute({
              userId,
              sessionId,
              name: params.name,
              workoutDays: params.workoutDays.map((d) => ({
                ...d,
                weekDay: WeekDay[d.weekDay]
              }))
            })
          }
        })
      }
    })

    return result.toTextStreamResponse()
  }
}
