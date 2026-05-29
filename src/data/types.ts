export type UserRecord = {
  id: string;
  name: string;
  email: string | null;
  password: string | null;
};

export type JobRecord = {
  id: string;
  title: string;
  description: string | null;
  userId: string | null;
};

export type UserWithJobs = UserRecord & {
  jobs: JobRecord[];
};

export type DataStore = {
  init: () => Promise<void>;
  getUsers: () => Promise<UserWithJobs[]>;
  getJobsForUser: (userId: string) => Promise<JobRecord[]>;
  getUserByFilters: (filters: {
    id?: string;
    email?: string;
    name?: string;
  }) => Promise<UserWithJobs | null>;
  getJobsByUser: (userId: string) => Promise<JobRecord[]>;
  getUserById: (id: string) => Promise<UserRecord | null>;
  createUser: (data: {
    name: string;
    email?: string | null;
    password?: string | null;
  }) => Promise<UserRecord>;
  updateUser: (
    id: string,
    data: { name?: string; email?: string },
  ) => Promise<UserRecord>;
  deleteUserByName: (name: string) => Promise<number>;
  createJob: (data: {
    title: string;
    description?: string | null;
    userId: string;
  }) => Promise<JobRecord>;
  findUserByEmail: (email: string) => Promise<UserRecord | null>;
};
