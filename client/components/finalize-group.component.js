import { _ } from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Alert,
  Image,
  ListView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Actions } from 'react-native-router-flux';
import update from 'immutability-helper';
import { graphql, compose } from 'react-apollo';
import USER_QUERY from '../graphql/user.query';
import CREATE_GROUP_MUTATION from '../graphql/createGroup.mutation';
import SelectedUserList from './selected-user-list.component';

const styles = StyleSheet.create({
  container: {
    marginTop: Platform.OS === 'ios' ? 64 : 54,
    flex: 1,
  },
  detailsContainer: {
    padding: 20,
    flexDirection: 'row',
  },
  imageContainer: {
    paddingRight: 20,
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'column',
    flex: 1,
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
  },
  groupImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  selected: {
    flexDirection: 'row',
  },
  loading: {
    justifyContent: 'center',
    flex: 1,
  },
  navIcon: {
    color: 'blue',
    fontSize: 18,
    paddingTop: 2,
  },
  participants: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    backgroundColor: '#dbdbdb',
    color: '#777',
  },
});

function isDuplicateGroup(newGroup, existingGroups) {
  return newGroup.id !== null && existingGroups.some(group => newGroup.id === group.id);
}

class FinalizeGroup extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selected: props.selected,
      ds: new ListView.DataSource({
        rowHasChanged: (r1, r2) => r1 !== r2,
      }).cloneWithRows(props.selected),
    };

    this.create = this.create.bind(this);
    this.pop = this.pop.bind(this);
    this.remove = this.remove.bind(this);
  }

  componentDidMount() {
    this.refreshNavigation(this.state.selected.length && this.state.name);
  }

  componentWillUpdate(nextProps, nextState) {
    if ((nextState.selected.length && nextState.name) !==
      (this.state.selected.length && this.state.name)) {
      this.refreshNavigation(nextState.selected.length && nextState.name);
    }
  }

  pop() {
    Actions.pop({ refresh: { selected: this.state.selected } });
  }

  remove(user) {
    const index = this.state.selected.indexOf(user);
    if (~index) {
      const selected = update(this.state.selected, { $splice: [[index, 1]] });
      this.setState({
        selected,
        ds: this.state.ds.cloneWithRows(selected),
      });
    }
  }

  create() {
    const { createGroup } = this.props;

    createGroup({
      name: this.state.name,
      userIds: _.map(this.state.selected, 'id'),
    }).then(() => {
      Actions.tabs({ type: 'reset' });
    }).catch((error) => {
      Alert.alert(
        'Error Creating New Group',
        error.message,
        [{
          text: 'OK', onPress: () => {},
        }],
      );
    });
  }

  refreshNavigation(enabled) {
    Actions.refresh({
      onBack: this.pop,
      backTitle: 'Back',
      rightTitle: enabled ? 'Create' : undefined,
      onRight: enabled ? this.create : undefined,
    });
  }

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.detailsContainer}>
          <TouchableOpacity style={styles.imageContainer}>
            <Image
              style={styles.groupImage}
              source={{ uri: 'https://facebook.github.io/react/img/logo_og.png' }}
            />
            <Text>edit</Text>
          </TouchableOpacity>
          <View style={styles.inputContainer}>
            <View style={styles.inputBorder}>
              <TextInput
                autoFocus
                onChangeText={name => this.setState({ name })}
                placeholder="Group Subject"
                style={styles.input}
              />
            </View>
            <Text style={styles.inputInstructions}>
              {'Please provide a group subject and optional group icon'}
            </Text>
          </View>
        </View>
        <Text style={styles.participants}>
          {`participants: ${this.state.selected.length} of ${this.props.friendCount}`.toUpperCase()}
        </Text>
        <View style={styles.selected}>
          {this.state.selected.length ?
            <SelectedUserList
              dataSource={this.state.ds}
              remove={this.remove}
            /> : undefined}
        </View>
      </View>
    );
  }
}
FinalizeGroup.propTypes = {
  createGroup: PropTypes.func.isRequired,
  friendCount: PropTypes.number.isRequired,
  selected: PropTypes.arrayOf(React.PropTypes.shape({
    id: PropTypes.number,
    username: PropTypes.string,
  })).isRequired,
};

const createGroup = graphql(CREATE_GROUP_MUTATION, {
  props: ({ mutate }) => ({
    createGroup: ({ name, userIds }) =>
      mutate({
        variables: { name, userIds },
        updateQueries: {
          user: (previousResult, { mutationResult }) => {
            const newGroup = mutationResult.data.createGroup;

            if (!previousResult.user.groups || isDuplicateGroup(newGroup, previousResult.user.groups)) {
              return previousResult;
            }

            return update(previousResult, {
              user: {
                groups: {
                  $push: [newGroup],
                },
              },
            });
          },
        },
      }),
  }),
});

const userQuery = graphql(USER_QUERY, {
  options: ({ userId }) => ({ variables: { id: userId } }),
  props: ({ data: { loading, user } }) => ({
    loading, user,
  }),
});

export default compose(userQuery, createGroup)(FinalizeGroup);
