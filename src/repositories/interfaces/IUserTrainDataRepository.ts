import { UserTrainData } from '../../generated/prisma/client.js'

export type UpsertUserTrainDataInput = {
  userId: string
  weightInGrams: number
  heightInCentimeters: number
  age: number
  bodyFatPercentage: number
}

// Quando incluímos o nome do user no retorno
export type UserTrainDataWithUser = UserTrainData & {
  user: { name: string }
}

export interface IUserTrainDataRepository {
  findByUserId(userId: string): Promise<UserTrainDataWithUser | null>
  upsert(input: UpsertUserTrainDataInput): Promise<UserTrainData>
}
