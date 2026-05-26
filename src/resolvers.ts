import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

export default {
  Query: {
    users: async () => {
      return prisma.user.findMany();
    },
    user: async (_, args) => {
      const where = {
        ...(args.id ? { id: Number(args.id) } : {}),
        ...(args.email ? { email: args.email } : {}),
        ...(args.name ? { name: args.name } : {}),
      };

      if (Object.keys(where).length === 0) {
        return null;
      }

      return prisma.user.findFirst({ where });
    },
  },

  Mutation: {
    createUser: async (_, args) => {
      return prisma.user.create({
        data: args,
      });
    },

    updateUser: async (_, args) => {
      const { id, ...data } = args;
      return prisma.user.update({
        where: { id: Number(id) },
        data,
      });
    },


    deleteUserByName: async (_, args) => {
      const result = await prisma.user.deleteMany({
        where: { name: args.name },
      });

      return result.count;
    },
  },
};
