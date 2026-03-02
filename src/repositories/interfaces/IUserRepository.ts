import { User } from '@prisma/client'

export interface IUserRepository {
  findByIdOrThrow(id: string): Promise<User>
  findById(id: string): Promise<User | null>
}
