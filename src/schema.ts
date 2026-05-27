// schema.ts
export default `
  type User {
    id: ID!
    name: String!
    email: String
    jobs: [Job!]
  }

  type Query {
    users: [User!]
    jobs: [Job!]
    user(id: ID, email: String, name: String): User
  }

  type Mutation {
    createUser(name: String!, email: String): User!
    deleteUserByName(name: String!): Int!
    updateUser(id: ID, name: String, email: String): User!
    createJob(title: String!, description: String, userId: ID!): Job!
  }

  type Job{
  id: ID!
  title: String!
  description: String
  user: User!
  }
`;