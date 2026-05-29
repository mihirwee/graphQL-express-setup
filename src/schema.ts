// schema.ts
export default `
  type User {
    id: ID!
    name: String!
    email: String
    password: String
    jobs: [Job!]
  }

  type Query {
    users: [User!]
    jobs: [Job!]
    user(id: ID, email: String, name: String): User
    jobsByUser(userId: ID): [Job!]
  }

  type Mutation {
    createUser(name: String!, email: String): User!
    deleteUserByName(name: String!): Int!
    updateUser(id: ID, name: String, email: String): User!
    createJob(title: String!, description: String): Job!
    register(name: String!, email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    }
  

  type Job{
  id: ID!
  title: String!
  description: String
  user: User!
  }

  type AuthPayload {
    token: String! 
    user: User!
    }
`;
