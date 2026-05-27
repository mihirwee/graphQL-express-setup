import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

export default {
  Query: {
    users: async () => {
      return prisma.user.findMany({
        include: { jobs: true },
      });
    },

    jobs: async () => {
      return prisma.job.findMany();
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

      return prisma.user.findFirst({
        where,
        include: { jobs: true },
      });
    },
  },

  Job: {
    user: async (parent) => {
      return prisma.user.findUnique({
        where: { id: parent.userId },
      });
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
      // First, find all users with this name to get their IDs
      const usersToDelete = await prisma.user.findMany({
        where: { name: args.name },
      });

      const userIds = usersToDelete.map((user) => user.id);

      // Set userId to null for all jobs associated with these users
      if (userIds.length > 0) {
        await prisma.job.updateMany({
          where: { userId: { in: userIds } },
          data: { userId: null },
        });
      }

      // Now delete the users
      const result = await prisma.user.deleteMany({
        where: { name: args.name },
      });

      return result.count;
    },

    createJob: async (_, args) => {
      const { title, description, userId } = args;
      return prisma.job.create({
        data: {
          title,
          description,
          userId: Number(userId),
        },
      });
    }
  },
};
