import { User } from '../../generated/prisma/client.js'

export interface IUserRepository {
  findByIdOrThrow(id: string): Promise<User>
  findById(id: string): Promise<User | null>
}
