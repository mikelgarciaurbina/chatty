import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  ActivityIndicator,
  Button,
  Image,
  ListView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Actions } from 'react-native-router-flux';
import { graphql, compose } from 'react-apollo';
import update from 'immutability-helper';
import GROUP_QUERY from '../graphql/group.query';
import DELETE_GROUP_MUTATION from '../graphql/deleteGroup.mutation';
import LEAVE_GROUP_MUTATION from '../graphql/leaveGroup.mutation';

const styles = StyleSheet.create({
  container: {
    marginTop: Platform.OS === 'ios' ? 64 : 54,
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  detailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupImageContainer: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 6,
    alignItems: 'center',
  },
  groupName: {
    color: 'black',
  },
  groupNameBorder: {
    borderBottomWidth: 1,
    borderColor: '#dbdbdb',
    borderTopWidth: 1,
    flex: 1,
    paddingVertical: 8,
  },
  groupImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  participants: {
    borderBottomWidth: 1,
    borderColor: '#dbdbdb',
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 6,
    backgroundColor: '#dbdbdb',
    color: '#777',
  },
  user: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#dbdbdb',
    flexDirection: 'row',
    padding: 10,
  },
  username: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});

class GroupDetails extends Component {
  constructor(props) {
    super(props);

    this.state = {
      ds: new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 })
        .cloneWithRows(props.loading ? [] : props.group.users),
    };

    this.deleteGroup = this.deleteGroup.bind(this);
    this.leaveGroup = this.leaveGroup.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.group && nextProps.group.users && nextProps.group !== this.props.group) {
      this.setState({
        selected: nextProps.selected,
        ds: this.state.ds.cloneWithRows(nextProps.group.users),
      });
    }
  }

  deleteGroup() {
    this.props.deleteGroup({ id: this.props.id })
      .then(() => {
        Actions.tabs({ type: 'reset' });
      })
      .catch((e) => {
        console.log(e); // eslint-disable-line no-console
      });
  }

  leaveGroup() {
    this.props.leaveGroup({ id: this.props.id })
      .then(() => {
        Actions.tabs({ type: 'reset' });
      })
      .catch((e) => {
        console.log(e); // eslint-disable-line no-console
      });
  }

  render() {
    const { group, loading } = this.props;

    if (!group || loading) {
      return (
        <View style={[styles.loading, styles.container]}>
          <ActivityIndicator />
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <ListView
          enableEmptySections
          dataSource={this.state.ds}
          renderHeader={() => (
            <View>
              <View style={styles.detailsContainer}>
                <TouchableOpacity style={styles.groupImageContainer} onPress={this.pickGroupImage}>
                  <Image
                    style={styles.groupImage}
                    source={{ uri: 'https://facebook.github.io/react/img/logo_og.png' }}
                  />
                  <Text>edit</Text>
                </TouchableOpacity>
                <View style={styles.groupNameBorder}>
                  <Text style={styles.groupName}>{group.name}</Text>
                </View>
              </View>
              <Text style={styles.participants}>
                {`participants: ${group.users.length}`.toUpperCase()}
              </Text>
            </View>
          )}
          renderFooter={() => (
            <View>
              <Button title={'Leave Group'} onPress={this.leaveGroup} />
              <Button title={'Delete Group'} onPress={this.deleteGroup} />
            </View>
          )}
          renderRow={user => (
            <View style={styles.user}>
              <Image
                style={styles.avatar}
                source={{ uri: 'https://facebook.github.io/react/img/logo_og.png' }}
              />
              <Text style={styles.username}>{user.username}</Text>
            </View>
          )}
        />
      </View>
    );
  }
}
GroupDetails.propTypes = {
  loading: PropTypes.bool,
  group: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    users: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.number,
      username: PropTypes.string,
    })),
  }),
  deleteGroup: PropTypes.func.isRequired,
  leaveGroup: PropTypes.func.isRequired,
  id: PropTypes.number.isRequired,
  selected: PropTypes.arrayOf(PropTypes.any), // eslint-disable-line react/no-unused-prop-types
};

const groupQuery = graphql(GROUP_QUERY, {
  options: ({ id }) => ({ variables: { groupId: id } }),
  props: ({ data: { loading, group } }) => ({
    loading,
    group,
  }),
});

const deleteGroup = graphql(DELETE_GROUP_MUTATION, {
  props: ({ ownProps, mutate }) => ({
    deleteGroup: () =>
      mutate({
        variables: { id: ownProps.id },
        updateQueries: {
          user: (previousResult, { mutationResult }) => {
            const removedGroup = mutationResult.data.deleteGroup;

            return update(previousResult, {
              user: {
                groups: {
                  $set: previousResult.user.groups.filter(g => removedGroup.id !== g.id),
                },
              },
            });
          },
        },
      }),
  }),
});

const leaveGroup = graphql(LEAVE_GROUP_MUTATION, {
  props: ({ ownProps, mutate }) => ({
    leaveGroup: () =>
      mutate({
        variables: { id: ownProps.id },
        updateQueries: {
          user: (previousResult, { mutationResult }) => {
            const removedGroup = mutationResult.data.leaveGroup;

            return update(previousResult, {
              user: {
                groups: {
                  $set: previousResult.user.groups.filter(g => removedGroup.id !== g.id),
                },
              },
            });
          },
        },
      }),
  }),
});

export default compose(groupQuery, deleteGroup, leaveGroup)(GroupDetails);
