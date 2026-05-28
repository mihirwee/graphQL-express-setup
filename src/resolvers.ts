import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const SECRET = process.env.MY_SECRET;

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

    jobs: async (_, __, context) => {
      console.log('Context in jobs resolver:', context);
      if (!context.userId) {
        throw new Error('Unauthorized alert!!!!!!!!!!');
      }
      return prisma.job.findMany({
        where: { userId: Number(context.userId) },
      });
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

    jobsByUser: (_, { userId }) => {
      return prisma.job.findMany({
        where: { userId: Number(userId) },
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

    createJob: async (_, args, context) => {
      const { title, description } = args;

      if (!context.userId) {
        throw new Error('Unauthorized alert!!!!!!!!!!');
      }
      return prisma.job.create({
        data: {
          title,
          description,
          userId: Number(context.userId),
        },
      });
    },
    register: async (_, { name, email, password }) => {
      const hashed = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: { name, email, password: hashed },
      });

      const token = jwt.sign({ userId: user.id }, SECRET);

      return { token, user };
    },

    login: async (_, { email, password }) => {
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          name: true,
          email: true,
          password: true,
        },
      });
      if (!user) throw new Error('User not found');
      if (!user.password) throw new Error('Password not set');

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) throw new Error('Invalid password');

      const token = jwt.sign({ userId: user.id }, SECRET);

      return { token, user };
    },
  },
};
