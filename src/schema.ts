// schema.ts
export default `
  type User {
    id: ID!
    name: String!
    email: String
  }

  type Query {
    users: [User!]
    user(id: ID, email: String, name: String): User
  }

  type Mutation {
    createUser(name: String!, email: String): User!
    deleteUserByName(name: String!): Int!
    updateUser(id: ID, name: String, email: String): User!
  }
`;