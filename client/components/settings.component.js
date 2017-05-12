import React, { Component, PropTypes } from 'react';
import {
  ActivityIndicator,
  Button,
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Actions } from 'react-native-router-flux';
import { connect } from 'react-redux';
import { graphql, compose } from 'react-apollo';
import USER_QUERY from '../graphql/user.query';
import {
  logout,
} from '../actions/auth.actions';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: Platform.OS === 'ios' ? 64 : 54,
  },
  email: {
    borderColor: '#777',
    borderBottomWidth: 1,
    borderTopWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  emailHeader: {
    backgroundColor: '#dbdbdb',
    color: '#777',
    paddingHorizontal: 16,
    paddingBottom: 6,
    paddingTop: 32,
    fontSize: 12,
  },
  loading: {
    justifyContent: 'center',
    flex: 1,
  },
  userImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  imageContainer: {
    paddingRight: 20,
    alignItems: 'center',
  },
  input: {
    color: 'black',
    height: 32,
  },
  inputBorder: {
    borderColor: '#dbdbdb',
    borderBottomWidth: 1,
    borderTopWidth: 1,
    paddingVertical: 8,
  },
  inputInstructions: {
    paddingTop: 6,
    color: '#777',
    fontSize: 12,
    flex: 1,
  },
  userContainer: {
    paddingLeft: 16,
  },
  userInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingRight: 16,
  },
});

class Settings extends Component {
  constructor(props) {
    super(props);
    this.state = {};

    this.logout = this.logout.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps.auth.jwt) {
      Actions.groups();
    }
  }

  logout() {
    this.props.dispatch(logout());
  }

  updateUsername(username) { // eslint-disable-line
    console.log('TODO: update username'); // eslint-disable-line no-console
  }

  render() {
    const { user } = this.props;

    if (!user) {
      return (
        <View style={[styles.loading, styles.container]}>
          <ActivityIndicator />
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <View style={styles.userContainer}>
          <View style={styles.userInner}>
            <TouchableOpacity style={styles.imageContainer}>
              <Image
                style={styles.userImage}
                source={{ uri: 'https://facebook.github.io/react/img/logo_og.png' }}
              />
              <Text>edit</Text>
            </TouchableOpacity>
            <Text style={styles.inputInstructions}>
              Enter your name and add an optional profile picture
            </Text>
          </View>
          <View style={styles.inputBorder}>
            <TextInput
              onChangeText={username => this.setState({ username })}
              placeholder={user.username}
              style={styles.input}
              defaultValue={user.username}
            />
          </View>
        </View>
        <Text style={styles.emailHeader}>{'EMAIL'}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <Button title={'Logout'} onPress={this.logout} />
      </View>
    );
  }
}

Settings.propTypes = {
  auth: PropTypes.shape({ // eslint-disable-line react/no-unused-prop-types
    loading: PropTypes.bool,
    jwt: PropTypes.string,
  }).isRequired,
  dispatch: PropTypes.func.isRequired,
  loading: PropTypes.bool, // eslint-disable-line react/no-unused-prop-types
  user: PropTypes.shape({
    username: PropTypes.string,
  }),
};

const userQuery = graphql(USER_QUERY, {
  skip: ownProps => !ownProps.auth || !ownProps.auth.jwt,
  options: ({ auth }) => ({ variables: { id: auth.id } }),
  props: ({ data: { loading, user } }) => ({
    loading, user,
  }),
});

const mapStateToProps = ({ auth }) => ({
  auth,
});

export default compose(
  connect(mapStateToProps),
  userQuery,
)(Settings);
