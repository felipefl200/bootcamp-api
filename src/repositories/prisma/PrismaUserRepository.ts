import { User } from '../../generated/prisma/client.js'
import { prisma } from '../../lib/db.js'
import { IUserRepository } from '../interfaces/IUserRepository.js'

export class PrismaUserRepository implements IUserRepository {
  async findByIdOrThrow(id: string): Promise<User> {
    return prisma.user.findUniqueOrThrow({ where: { id } })
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } })
  }
}
