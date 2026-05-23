import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import cors from 'cors';
import axios from 'axios';

async function bootstrap() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  const server = new ApolloServer({
    typeDefs: `type Todo {
      id: ID!
      title: String!
      completed: Boolean!
    }

    type Query {
      getTodos: [Todo]
    }`,
    resolvers: {
      Query: {
        getTodos: () =>
          axios
            .get('https://jsonplaceholder.typicode.com/todos')
            .then((res) => res.data),
      },
    },
  });
  await server.start();

  app.use('/graphql', expressMiddleware(server));

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, () => {
    console.log(`Server ready at http://localhost:${PORT}/graphql`);
  });
}

bootstrap();
