import 'dotenv/config';
import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import cors from 'cors';
import schema from './schema.js';
import resolvers from './resolvers.js';
import jwt from 'jsonwebtoken';

const SECRET = process.env.MY_SECRET;

async function bootstrap() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  const server = new ApolloServer({
    typeDefs: schema,
    resolvers,
  });
  await server.start();
  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req }) => {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ')
          ? authHeader.slice(7).trim()
          : authHeader.trim();

        if (!token) {
          return {};
        }

        if (!SECRET) {
          console.error('MY_SECRET is not set');
          return {};
        }

        if (token) {
          try {
            const decoded = jwt.verify(token, SECRET);
            if (typeof decoded === 'string' || !(decoded as any).userId) {
              return {};
            }
            return { userId: Number((decoded as any).userId) };
          } catch (err) {
            console.error('Invalid token:', err);
            return {};
          }
        }
        return {};
      },
    }),
  );

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, () => {
    console.log(`Server ready at http://localhost:${PORT}/graphql`);
  });
}

bootstrap();
