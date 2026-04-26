import bcrypt from 'bcrypt'
import type { PrismaClient } from '@prisma/client'

export async function createUserRecord(
  prisma: PrismaClient,
  params: {
    username: string
    passwordPlain: string
    email?: string | null
  }
) {
  const hashed = await bcrypt.hash(params.passwordPlain, 10)
  return prisma.user.create({
    data: {
      username: params.username,
      password: hashed,
      email: params.email ?? null
    }
  })
}
