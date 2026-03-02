import { openai } from '@ai-sdk/openai'
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
  type UIMessage
} from 'ai'
import { fromNodeHeaders } from 'better-auth/node'
import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { WeekDay } from '../generated/prisma/enums.js'
import { auth } from '../lib/auth.js'
import { CreateWorkoutPlan } from '../usecases/CreateWorkoutPlan.js'
import { GetUserTrainData } from '../usecases/GetUserTrainData.js'
import { ListWorkoutPlans } from '../usecases/ListWorkoutPlans.js'
import { UpsertUserTrainData } from '../usecases/UpsertUserTrainData.js'

export async function aiRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/',
    schema: {
      tags: ['AI'],
      summary: 'Interact with the AI personal trainer',
      body: z.object({
        messages: z.array(z.record(z.string(), z.unknown()))
      })
    },
    handler: async (request, reply) => {
      try {
        const authSession = await auth.api.getSession({
          headers: fromNodeHeaders(request.headers)
        })

        if (!authSession || !authSession.user || !authSession.session) {
          return reply.status(401).send({
            error: 'Unauthorized',
            code: 'UNAUTHORIZED'
          })
        }

        const { messages } = request.body
        const userId = authSession.user.id
        const sessionId = authSession.session.id

        const result = streamText({
          model: openai('gpt-4o'),
          system: `Você é um personal trainer virtual especialista em montagem de planos de treino.
Ligue sempre a ferramenta getUserTrainData antes de qualquer interação com o usuário.
Se o usuário não tem dados cadastrados (retornou null): pergunte o nome, peso (kg), altura (cm), idade e % de gordura corporal. O faça em uma única mensagem, de forma simples e direta. Após receber a reposta, salve os dados chamando updateUserTrainData, onde deverá converter o peso de kg para gramas.
Se o usuário já tem dados cadastrados apenas o cumprimente pelo nome e demonstre familiaridade, sem voltar a questionar sobre as medidas.
Para criar um plano de treino: pergunte o objetivo, a disponibilidade de dias na semana, e alguma objeção, restrição física ou limitação. Poucas perguntas, simples e formais.
Quando estiver instruído a construir e gerar o plano, este plano DEVE ter exatamente 7 dias e todos os dias definidos entre MONDAY à SUNDAY. Os dias nos quais o aluno deve descansar terão de passar no payload isRest: true, exercises: [], e duration 0.
Sempre envie o coverImageUrl para o respectivo dia com as seguintes URIs hardcoded disponíveis (alterne as imagens de cada grupo para dar variação ao card, e use cover muscular de superiores na foto nos dias em que recai como descanso):
Superiores (costas, ombros, upper, etc):
- https://gw8hy3fdcv.ufs.sh/f/ccoBDpLoAPCO3y8pQ6GBg8iqe9pP2JrHjwd1nfKtVSQskI0v
- https://gw8hy3fdcv.ufs.sh/f/ccoBDpLoAPCOW3fJmqZe4yoUcwvRPQa8kmFprzNiC30hqftL
Inferiores (quadríceps, glúteos, legs, lower, etc):
- https://gw8hy3fdcv.ufs.sh/f/ccoBDpLoAPCOgCHaUgNGronCvXmSzAMs1N3KgLdE5yHT6Ykj
- https://gw8hy3fdcv.ufs.sh/f/ccoBDpLoAPCO85RVu3morROwZk5NPhs1jzH7X8TyEvLUCGxY

Sempre opte pelas divisões:
- 2-3 dias: Full Body (Corpo inteiro) ou ABC
- 4 dias: Upper/Lower ou ABCD 
- 5 dias: PPLUL - Push/Pull/Legs + Upper/Lower
- 6 dias: PPL duplo (Push, Pull e Legs x2)
Agrupe as faixas em sinérgicos, insira exercícios compostos ao começo seguidos por localizados, variando em média 4 a 8 treinos diários; recomendando 8 a 12 repetições focado p/ hipertrofia ou 4-6 base base força max, em 3-4 rounds com repouso estipulado na casa dos 60-90 segundos (isolados) ou 2-3 minutos (compostos). Evite sequenciar a mesma terminação sinergística sem o apropriado dia de respiro. E por ultimo nomeie semanticamente cada grupo contruido.

Sempre entregue respostas objetivas. Use linguajar caloroso, animador, com linguagem livre e trivial como um autêntico professor particular com viés amigável a iniciantes.`,
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
                const uc = new GetUserTrainData()
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
                const uc = new UpsertUserTrainData()
                return uc.execute({ userId, ...params })
              }
            }),
            getWorkoutPlans: tool({
              description: 'Fetch basic user current active workout plans.',
              inputSchema: z.object({}),
              execute: async () => {
                const uc = new ListWorkoutPlans()
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
                const uc = new CreateWorkoutPlan()
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
      } catch (error) {
        app.log.error(error)
        return reply.status(500).send({
          error:
            error instanceof Error ? error.message : 'Internal server error',
          code: 'INTERNAL_SERVER_ERROR'
        })
      }
    }
  })
}
