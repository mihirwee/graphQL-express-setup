import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';
import type {
  DataStore,
  JobRecord,
  UserRecord,
  UserWithJobs,
} from './types.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

function mapUser(user: {
  id: number;
  name: string;
  email: string;
  password: string | null;
}): UserRecord {
  return {
    id: String(user.id),
    name: user.name,
    email: user.email,
    password: user.password,
  };
}

function mapJob(job: {
  id: number;
  title: string;
  description: string | null;
  userId: number | null;
}): JobRecord {
  return {
    id: String(job.id),
    title: job.title,
    description: job.description,
    userId: job.userId === null ? null : String(job.userId),
  };
}

export const postgresStore: DataStore = {
  async init() {
    await prisma.$connect();
  },

  async getUsers(): Promise<UserWithJobs[]> {
    const users = await prisma.user.findMany({
      include: { jobs: true },
    });

    return users.map((user) => ({
      ...mapUser(user),
      jobs: user.jobs.map(mapJob),
    }));
  },

  async getJobsForUser(userId: string): Promise<JobRecord[]> {
    const jobs = await prisma.job.findMany({
      where: { userId: Number(userId) },
    });

    return jobs.map(mapJob);
  },

  async getUserByFilters(filters): Promise<UserWithJobs | null> {
    const where = {
      ...(filters.id ? { id: Number(filters.id) } : {}),
      ...(filters.email ? { email: filters.email } : {}),
      ...(filters.name ? { name: filters.name } : {}),
    };

    if (Object.keys(where).length === 0) {
      return null;
    }

    const user = await prisma.user.findFirst({
      where,
      include: { jobs: true },
    });

    if (!user) {
      return null;
    }

    return {
      ...mapUser(user),
      jobs: user.jobs.map(mapJob),
    };
  },

  async getJobsByUser(userId: string): Promise<JobRecord[]> {
    return this.getJobsForUser(userId);
  },

  async getUserById(id: string): Promise<UserRecord | null> {
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
    });

    return user ? mapUser(user) : null;
  },

  async createUser(data): Promise<UserRecord> {
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email ?? '',
        password: data.password ?? null,
      },
    });

    return mapUser(user);
  },

  async updateUser(id, data): Promise<UserRecord> {
    const user = await prisma.user.update({
      where: { id: Number(id) },
      data,
    });

    return mapUser(user);
  },

  async deleteUserByName(name): Promise<number> {
    const usersToDelete = await prisma.user.findMany({
      where: { name },
    });

    const userIds = usersToDelete.map((user) => user.id);

    if (userIds.length > 0) {
      await prisma.job.updateMany({
        where: { userId: { in: userIds } },
        data: { userId: null },
      });
    }

    const result = await prisma.user.deleteMany({
      where: { name },
    });

    return result.count;
  },

  async createJob(data): Promise<JobRecord> {
    if (!data.userId) {
      throw new Error('userId is required to create a job');
    }

    const job = await prisma.job.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        userId: Number(data.userId),
      },
    });

    return mapJob(job);
  },

  async findUserByEmail(email): Promise<UserRecord | null> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
      },
    });

    return user ? mapUser(user) : null;
  },
};
