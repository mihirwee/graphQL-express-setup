import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dataStore } from './data/store.js';
import { currentUser } from './decorators/currentUser.js';

const SECRET = process.env.MY_SECRET;

export default {
  Query: {
    users: async () => {
      return dataStore.getUsers();
    },

    jobs: async (_, __, context) => {
      console.log('Context in jobs resolver:', context);
      if (!context.userId) {
        throw new Error('Unauthorized alert!!!!!!!!!!');
      }
      return dataStore.getJobsForUser(String(context.userId));
    },

    user: async (_, args) => {
      return dataStore.getUserByFilters({
        id: args.id ? String(args.id) : undefined,
        email: args.email,
        name: args.name,
      });
    },

    jobsByUser: currentUser('userId', (_, { userId }) => {
      return dataStore.getJobsByUser(String(userId));
    }),
  },

  Job: {
    user: async (parent) => {
      if (!parent.userId) {
        throw new Error('Job is missing userId');
      }

      const user = await dataStore.getUserById(String(parent.userId));
      if (!user) {
        throw new Error(`User not found for job ${String(parent.id)}`);
      }

      return user;
    },
  },

  Mutation: {
    createUser: async (_, args) => {
      return dataStore.createUser({
        name: args.name,
        email: args.email,
      });
    },

    updateUser: currentUser('id', async (_, args) => {
      const { id, ...data } = args;
      return dataStore.updateUser(String(id), data);
    }),

    deleteUserByName: async (_, args) => {
      return dataStore.deleteUserByName(args.name);
    },

    createJob: async (_, args, context) => {
      const { title, description } = args;

      if (!context.userId) {
        throw new Error('Unauthorized alert!!!!!!!!!!');
      }

      const user = await dataStore.getUserById(String(context.userId));
      if (!user) {
        throw new Error('Authenticated user not found');
      }

      return dataStore.createJob({
        title,
        description,
        userId: String(context.userId),
      });
    },
    register: async (_, { name, email, password }) => {
      const hashed = await bcrypt.hash(password, 10);

      const user = await dataStore.createUser({
        name,
        email,
        password: hashed,
      });

      if (!SECRET) {
        throw new Error('MY_SECRET is not set');
      }
      const token = jwt.sign({ userId: user.id }, SECRET);

      return { token, user };
    },

    login: async (_, { email, password }) => {
      const user = await dataStore.findUserByEmail(email);
      if (!user) throw new Error('User not found');
      if (!user.password) throw new Error('Password not set');

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) throw new Error('Invalid password');

      if (!SECRET) {
        throw new Error('MY_SECRET is not set');
      }
      const token = jwt.sign({ userId: user.id }, SECRET);

      return { token, user };
    },
  },
};
