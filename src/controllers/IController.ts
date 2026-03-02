import { FastifyReply, FastifyRequest } from 'fastify'

// Definição de tipos padronizados para garantir que qualquer Controller siga a mesma assinatura do Fastify
export interface IController {
  handle(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void | FastifyReply | Response>
}
