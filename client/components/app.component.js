import React from 'react';
import { ApolloProvider } from 'react-apollo';
import { composeWithDevTools } from 'redux-devtools-extension';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import ApolloClient, { createNetworkInterface } from 'apollo-client';
import { SubscriptionClient, addGraphQLSubscriptions } from 'subscriptions-transport-ws-authy';
import { persistStore, autoRehydrate } from 'redux-persist';
import thunk from 'redux-thunk';
import { AsyncStorage } from 'react-native';
import { Routes, Scenes } from './routes.component';
import auth from '../reducers/auth.reducer';
import { logout } from '../actions/auth.actions';

const networkInterface = createNetworkInterface({ uri: 'http://localhost:8080/graphql' });

networkInterface.use([{
  applyMiddleware(req, next) {
    if (!req.options.headers) {
      req.options.headers = {};  // eslint-disable-line no-param-reassign
    }

    const jwt = store.getState().auth.jwt;  // eslint-disable-line no-use-before-define
    if (jwt) {
      req.options.headers.authorization = `Bearer ${jwt}`; // eslint-disable-line no-param-reassign
    }
    next();
  },
}]);

networkInterface.useAfter([{
  applyAfterware({ response }, next) {
    if (!response.ok) {
      response.clone().text().then((bodyText) => {
        console.log(`Network Error: ${response.status} (${response.statusText}) - ${bodyText}`);// eslint-disable-line no-console
        next();
      });
    } else {
      response.clone().json().then(({ errors }) => {
        if (errors) {
          errors.map((e) => {
            if (e.message === 'Unauthorized') {
              return store.dispatch(logout());  // eslint-disable-line no-use-before-define
            }
            return console.log('GraphQL Error:', e.message); // eslint-disable-line no-console
          });
        }
        next();
      });
    }
  },
}]);

const wsClient = new SubscriptionClient('ws://localhost:8080/subscriptions', {
  reconnect: true,
  connectionParams: {},
});

wsClient.use([{
  applyMiddleware(options, next) {
    const jwt = store.getState().auth.jwt;  // eslint-disable-line no-use-before-define
    if (jwt) {
      options.context = { jwt }; // eslint-disable-line no-param-reassign
    }
    next();
  },
}]);

const networkInterfaceWithSubscriptions = addGraphQLSubscriptions(
  networkInterface,
  wsClient,
);

export const client = new ApolloClient({
  networkInterface: networkInterfaceWithSubscriptions,
});

const store = createStore(
  combineReducers({
    apollo: client.reducer(),
    auth,
  }),
  {},
  composeWithDevTools(
    applyMiddleware(client.middleware(), thunk),
    autoRehydrate(),
  ),
);

persistStore(store, {
  storage: AsyncStorage,
  blacklist: ['apollo'],
});

export default () => (
  <ApolloProvider store={store} client={client}>
    <Routes scenes={Scenes} />
  </ApolloProvider>
);
