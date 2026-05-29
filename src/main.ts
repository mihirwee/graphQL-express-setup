import 'dotenv/config';
import express from 'express';
import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginLandingPageDisabled } from '@apollo/server/plugin/disabled';
import { expressMiddleware } from '@as-integrations/express5';
import cors from 'cors';
import schema from './schema.js';
import resolvers from './resolvers.js';
import jwt from 'jsonwebtoken';
import { initDataStore } from './data/store.js';

const SECRET = process.env.MY_SECRET;
const isProduction = process.env.NODE_ENV === 'production';
const enableGraphQL = process.env.ENABLE_GRAPHQL === 'true' || !isProduction;
const allowIntrospection =
  process.env.GRAPHQL_INTROSPECTION === 'true' || !isProduction;

const corsOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

async function bootstrap() {
  await initDataStore();

  const app = express();

  app.use(
    cors({
      origin: isProduction
        ? corsOrigins.length > 0
          ? corsOrigins
          : false
        : true,
    }),
  );
  app.use(express.json());

  if (enableGraphQL) {
    const server = new ApolloServer({
      typeDefs: schema,
      resolvers,
      introspection: allowIntrospection,
      plugins: isProduction ? [ApolloServerPluginLandingPageDisabled()] : [],
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
              return { userId: String((decoded as any).userId) };
            } catch (err) {
              console.error('Invalid token:', err);
              return {};
            }
          }
          return {};
        },
      }),
    );
  } else {
    app.all('/graphql', (_, res) => {
      res.status(404).send('Not Found');
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, () => {
    const graphqlStatus = enableGraphQL ? 'enabled' : 'disabled';
    console.log(
      `Server ready at http://localhost:${PORT} (graphql: ${graphqlStatus})`,
    );
  });
}

bootstrap();
