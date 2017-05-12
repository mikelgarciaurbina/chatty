import { makeExecutableSchema } from 'graphql-tools';

import { Resolvers } from './resolvers';

export const Schema = [`
  scalar Date

  type Group {
    id: Int!
    name: String
    users: [User]!
    messages(limit: Int, offset: Int): [Message]
  }

  type User {
    id: Int!
    username: String
    email: String!
    messages: [Message]
    groups: [Group]
    friends: [User]
    jwt: String
  }

  type Message {
    id: Int!
    to: Group!
    from: User!
    text: String!
    createdAt: Date!
  }

  type Query {
    user(email: String, id: Int): User
    group(id: Int!): Group
  }

  type Mutation {
    createMessage(text: String!, groupId: Int!): Message
    createGroup(name: String!, userIds: [Int]): Group
    deleteGroup(id: Int!): Group
    leaveGroup(id: Int!): Group
    updateGroup(id: Int!, name: String): Group
    login(email: String!, password: String!): User
    signup(email: String!, password: String!, username: String): User
  }

  type Subscription {
    messageAdded(groupIds: [Int]): Message
    groupAdded(userId: Int): Group
  }

  schema {
    query: Query
    mutation: Mutation
    subscription: Subscription
  }
`];

const executableSchema = makeExecutableSchema({
  typeDefs: Schema,
  resolvers: Resolvers,
});

export default executableSchema;
