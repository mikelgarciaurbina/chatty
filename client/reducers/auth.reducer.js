import { REHYDRATE } from 'redux-persist/constants';
import Immutable from 'seamless-immutable';

import { LOGOUT, SET_CURRENT_USER } from '../constants/constants';

const initialState = Immutable({
  loading: true,
});

const auth = (state = initialState, action) => {
  switch (action.type) {
    case REHYDRATE:
      return Immutable(action.payload.auth || state).set('loading', false);

    case SET_CURRENT_USER:
      return state.merge(action.user);

    case LOGOUT:
      return state.merge({
        id: null,
        jwt: null,
      });

    default:
      return state;
  }
};

export default auth;
