import { parse } from 'graphql';
import { getArgumentValues } from 'graphql/execution/values';
import { map } from 'lodash';
import { PubSub, SubscriptionManager } from 'graphql-subscriptions';
import executableSchema from './data/schema';

export function getSubscriptionDetails({ baseParams, schema }) {
  const parsedQuery = parse(baseParams.query);

  let args = {};

  let subscriptionName = '';
  parsedQuery.definitions.forEach((definition) => {
    if (definition.kind === 'OperationDefinition') {
      const rootField = (definition).selectionSet.selections[0];
      subscriptionName = rootField.name.value;

      const fields = schema.getSubscriptionType().getFields();
      args = getArgumentValues(fields[subscriptionName], rootField, baseParams.variables);
    }
  });

  return { args, subscriptionName };
}

export const pubsub = new PubSub();
export const subscriptionManager = new SubscriptionManager({
  schema: executableSchema,
  pubsub,
  setupFunctions: {
    groupAdded: (options, args) => ({
      groupAdded: {
        filter: group => args.userId && ~map(group.users, 'id').indexOf(args.userId),
      },
    }),
    messageAdded: (options, args) => ({
      messageAdded: {
        filter: message => args.groupIds && ~args.groupIds.indexOf(message.groupId),
      },
    }),
  },
});

export default subscriptionManager;
