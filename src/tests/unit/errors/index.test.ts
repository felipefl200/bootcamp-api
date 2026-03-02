import { describe, expect, it } from 'vitest'

import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  WorkoutPlanNotActiveError
} from '../../../errors/index.js'

describe('Custom Errors', () => {
  describe('NotFoundError', () => {
    it('deve ter o nome correto', () => {
      const error = new NotFoundError()
      expect(error.name).toBe('NotFoundError')
    })

    it('deve herdar de Error', () => {
      const error = new NotFoundError()
      expect(error).toBeInstanceOf(Error)
    })

    it('deve usar mensagem padrão', () => {
      const error = new NotFoundError()
      expect(error.message).toBe('Not found')
    })

    it('deve aceitar mensagem customizada', () => {
      const error = new NotFoundError('Recurso não encontrado')
      expect(error.message).toBe('Recurso não encontrado')
    })
  })

  describe('UnauthorizedError', () => {
    it('deve ter o nome correto', () => {
      expect(new UnauthorizedError().name).toBe('UnauthorizedError')
    })

    it('deve herdar de Error', () => {
      expect(new UnauthorizedError()).toBeInstanceOf(Error)
    })

    it('deve usar mensagem padrão', () => {
      expect(new UnauthorizedError().message).toBe('Unauthorized')
    })

    it('deve aceitar mensagem customizada', () => {
      expect(new UnauthorizedError('Acesso negado').message).toBe(
        'Acesso negado'
      )
    })
  })

  describe('BadRequestError', () => {
    it('deve ter o nome correto', () => {
      expect(new BadRequestError().name).toBe('BadRequestError')
    })

    it('deve herdar de Error', () => {
      expect(new BadRequestError()).toBeInstanceOf(Error)
    })

    it('deve usar mensagem padrão', () => {
      expect(new BadRequestError().message).toBe('Bad request')
    })
  })

  describe('ConflictError', () => {
    it('deve ter o nome correto', () => {
      expect(new ConflictError().name).toBe('ConflictError')
    })

    it('deve herdar de Error', () => {
      expect(new ConflictError()).toBeInstanceOf(Error)
    })

    it('deve usar mensagem padrão', () => {
      expect(new ConflictError().message).toBe('Conflict')
    })
  })

  describe('WorkoutPlanNotActiveError', () => {
    it('deve ter o nome correto', () => {
      expect(new WorkoutPlanNotActiveError().name).toBe(
        'WorkoutPlanNotActiveError'
      )
    })

    it('deve herdar de Error', () => {
      expect(new WorkoutPlanNotActiveError()).toBeInstanceOf(Error)
    })

    it('deve usar mensagem padrão', () => {
      expect(new WorkoutPlanNotActiveError().message).toBe(
        'Workout plan is not active'
      )
    })

    it('deve aceitar mensagem customizada', () => {
      const error = new WorkoutPlanNotActiveError('Plano inativo')
      expect(error.message).toBe('Plano inativo')
    })
  })
})
