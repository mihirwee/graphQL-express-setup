import mongoose, { Model, Schema } from 'mongoose';
import type {
  DataStore,
  JobRecord,
  UserRecord,
  UserWithJobs,
} from './types.js';

type MongoUserDoc = {
  _id: mongoose.Types.ObjectId;
  name: string;
  email?: string | null;
  password?: string | null;
};

type MongoJobDoc = {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string | null;
  userId?: string | null;
};

const userSchema = new Schema<MongoUserDoc>(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, sparse: true },
    password: { type: String, default: null },
  },
  { versionKey: false },
);

const jobSchema = new Schema<MongoJobDoc>(
  {
    title: { type: String, required: true },
    description: { type: String, default: null },
    userId: { type: String, default: null },
  },
  { versionKey: false },
);

const UserModel: Model<MongoUserDoc> =
  mongoose.models.User || mongoose.model<MongoUserDoc>('User', userSchema);

const JobModel: Model<MongoJobDoc> =
  mongoose.models.Job || mongoose.model<MongoJobDoc>('Job', jobSchema);

function mapUser(doc: MongoUserDoc): UserRecord {
  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email ?? null,
    password: doc.password ?? null,
  };
}

function mapJob(doc: MongoJobDoc): JobRecord {
  return {
    id: doc._id.toString(),
    title: doc.title,
    description: doc.description ?? null,
    userId: doc.userId ?? null,
  };
}

export const mongoStore: DataStore = {
  async init() {
    const mongoUrl = process.env.MONGODB_URL;
    if (!mongoUrl) {
      throw new Error('MONGODB_URL is required when DB_PROVIDER=mongodb');
    }

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUrl);
    }
  },

  async getUsers(): Promise<UserWithJobs[]> {
    const users = await UserModel.find().lean();
    const jobs = await JobModel.find().lean();

    const jobsByUser = new Map<string, JobRecord[]>();
    for (const job of jobs) {
      if (!job.userId) continue;
      const list = jobsByUser.get(job.userId) ?? [];
      list.push(mapJob(job));
      jobsByUser.set(job.userId, list);
    }

    return users.map((user) => ({
      ...mapUser(user),
      jobs: jobsByUser.get(user._id.toString()) ?? [],
    }));
  },

  async getJobsForUser(userId: string): Promise<JobRecord[]> {
    const jobs = await JobModel.find({ userId }).lean();
    return jobs.map(mapJob);
  },

  async getUserByFilters(filters): Promise<UserWithJobs | null> {
    const query: {
      _id?: mongoose.Types.ObjectId;
      email?: string;
      name?: string;
    } = {};

    if (filters.id) {
      if (!mongoose.Types.ObjectId.isValid(filters.id)) {
        return null;
      }
      query._id = new mongoose.Types.ObjectId(filters.id);
    }

    if (filters.email) query.email = filters.email;
    if (filters.name) query.name = filters.name;

    if (Object.keys(query).length === 0) {
      return null;
    }

    const user = await UserModel.findOne(query).lean();
    if (!user) return null;

    const jobs = await JobModel.find({ userId: user._id.toString() }).lean();

    return {
      ...mapUser(user),
      jobs: jobs.map(mapJob),
    };
  },

  async getJobsByUser(userId: string): Promise<JobRecord[]> {
    return this.getJobsForUser(userId);
  },

  async getUserById(id: string): Promise<UserRecord | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const user = await UserModel.findById(id).lean();
    return user ? mapUser(user) : null;
  },

  async createUser(data): Promise<UserRecord> {
    const user = await UserModel.create({
      name: data.name,
      email: data.email ?? null,
      password: data.password ?? null,
    });

    return mapUser(user.toObject());
  },

  async updateUser(id, data): Promise<UserRecord> {
    console.log('Updating user with id:', id, 'and data:', data);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid user id');
    }

    const user = await UserModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).lean();

    if (!user) {
      throw new Error('User not found');
    }

    return mapUser(user);
  },

  async deleteUserByName(name): Promise<number> {
    const users = await UserModel.find({ name }).lean();
    const ids = users.map((user) => user._id.toString());

    if (ids.length > 0) {
      await JobModel.updateMany(
        { userId: { $in: ids } },
        { $set: { userId: null } },
      );
    }

    const result = await UserModel.deleteMany({ name });
    return result.deletedCount ?? 0;
  },

  async createJob(data): Promise<JobRecord> {
    if (!data.userId) {
      throw new Error('userId is required to create a job');
    }

    const job = await JobModel.create({
      title: data.title,
      description: data.description ?? null,
      userId: data.userId,
    });

    return mapJob(job.toObject());
  },

  async findUserByEmail(email): Promise<UserRecord | null> {
    const user = await UserModel.findOne({ email }).lean();
    return user ? mapUser(user) : null;
  },
};
