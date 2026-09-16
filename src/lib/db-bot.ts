import { PrismaClient as BotPrismaClient } from '@/generated/bot-client'

// Cliente Prisma para la base de datos del chatbot de WhatsApp (DATABASE_URL_BOT).
// Esquema en prisma/bot/schema.prisma.

const globalForBotPrisma = globalThis as unknown as {
  prismaBot: BotPrismaClient | undefined
}

const botPrismaClientSingleton = () => {
  return new BotPrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: { url: process.env.DATABASE_URL_BOT },
    },
  })
}

export const prismaBot = globalForBotPrisma.prismaBot ?? botPrismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalForBotPrisma.prismaBot = prismaBot
