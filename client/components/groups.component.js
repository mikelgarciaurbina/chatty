import { Actions } from 'react-native-router-flux';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  ActivityIndicator,
  Button,
  Image,
  ListView,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';
import { graphql, compose } from 'react-apollo';
import moment from 'moment';
import Icon from 'react-native-vector-icons/FontAwesome';
import update from 'immutability-helper';
import { map } from 'lodash';
import { connect } from 'react-redux';
import USER_QUERY from '../graphql/user.query';
import MESSAGE_ADDED_SUBSCRIPTION from '../graphql/messageAdded.subscription';
import GROUP_ADDED_SUBSCRIPTION from '../graphql/groupAdded.subscription';

function isDuplicateDocument(newDocument, existingDocuments) {
  return newDocument.id !== null && existingDocuments.some(doc => newDocument.id === doc.id);
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 50,
    marginTop: Platform.OS === 'ios' ? 64 : 54,
    flex: 1,
  },
  loading: {
    justifyContent: 'center',
    flex: 1,
  },
  groupContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  groupTextContainer: {
    flex: 1,
    flexDirection: 'column',
    paddingLeft: 6,
  },
  groupText: {
    color: '#8c8c8c',
  },
  groupImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  groupTitleContainer: {
    flexDirection: 'row',
  },
  groupName: {
    fontWeight: 'bold',
    flex: 0.7,
  },
  groupLastUpdated: {
    flex: 0.3,
    color: '#8c8c8c',
    fontSize: 11,
    textAlign: 'right',
  },
  groupUsername: {
    paddingVertical: 4,
  },
  header: {
    alignItems: 'flex-end',
    padding: 6,
    borderColor: '#eee',
    borderBottomWidth: 1,
  },
  warning: {
    textAlign: 'center',
    padding: 12,
  },
});

const Header = () => (
  <View style={styles.header}>
    <Button title={'New Group'} onPress={Actions.newGroup} />
  </View>
);

const formatCreatedAt = createdAt => moment(createdAt).calendar(null, {
  sameDay: '[Today]',
  nextDay: '[Tomorrow]',
  nextWeek: 'dddd',
  lastDay: '[Yesterday]',
  lastWeek: 'dddd',
  sameElse: 'DD/MM/YYYY',
});

class Group extends Component {
  constructor(props) {
    super(props);

    this.goToMessages = this.props.goToMessages.bind(this, this.props.group);
  }

  render() {
    const { id, name, messages } = this.props.group;

    return (
      <TouchableHighlight
        key={id}
        onPress={this.goToMessages}
      >
        <View style={styles.groupContainer}>
          <Image
            style={styles.groupImage}
            source={{ uri: 'https://facebook.github.io/react/img/logo_og.png' }}
          />
          <View style={styles.groupTextContainer}>
            <View style={styles.groupTitleContainer}>
              <Text style={styles.groupName}>{`${name}`}</Text>
              <Text style={styles.groupLastUpdated}>
                {messages.length ? formatCreatedAt(messages[0].createdAt) : ''}
              </Text>
            </View>
            <Text style={styles.groupUsername}>
              {messages.length ? `${messages[0].from.username}:` : ''}
            </Text>
            <Text style={styles.groupText} numberOfLines={1}>
              {messages.length ? messages[0].text : ''}
            </Text>
          </View>
          <Icon
            name="angle-right"
            size={24}
            color={'#8c8c8c'}
          />
        </View>
      </TouchableHighlight>
    );
  }
}
Group.propTypes = {
  goToMessages: PropTypes.func.isRequired,
  group: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    messages: PropTypes.array,
  }),
};

class Groups extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ds: new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 }),
      refreshing: false,
    };

    this.goToMessages = this.goToMessages.bind(this);
    this.onRefresh = this.onRefresh.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    const { subscribeToGroups, subscribeToMessages } = nextProps;
    if (!nextProps.auth.jwt && !nextProps.auth.loading) {
      Actions.signin();
    } else if (nextProps.user && nextProps.user.groups &&
      (!this.props.user || nextProps.user.groups !== this.props.user.groups)) {
      this.setState({
        ds: this.state.ds.cloneWithRows(nextProps.user.groups),
      });
    }

    if (nextProps.user &&
      (!this.props.user || nextProps.user.groups.length !== this.props.user.groups.length)) {
      if (this.messagesSubscription) {
        this.messagesSubscription();
      }

      if (nextProps.user.groups.length) {
        this.messagesSubscription = subscribeToMessages();
      }
    }

    if (!this.groupSubscription && nextProps.user) {
      this.groupSubscription = subscribeToGroups();
    }
  }

  goToMessages(group) { // eslint-disable-line
    Actions.messages({ groupId: group.id, title: group.name });
  }

  onRefresh() {
    this.setState({ refreshing: true });
    this.props.refetch().then(() => {
      this.setState({ refreshing: false });
    });
  }

  render() {
    const { auth, loading, user } = this.props;

    // render loading placeholder while we fetch messages
    if (auth.loading || loading) {
      return (
        <View style={[styles.loading, styles.container]}>
          <ActivityIndicator />
        </View>
      );
    }

    if (user && !user.groups.length) {
      return (
        <View style={styles.container}>
          <Header />
          <Text style={styles.warning}>{'You do not have any groups.'}</Text>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <ListView
          enableEmptySections
          dataSource={this.state.ds}
          refreshControl={
            <RefreshControl
              refreshing={this.state.refreshing}
              onRefresh={this.onRefresh}
            />
          }
          renderHeader={() => <Header />}
          renderRow={(group => (
            <Group group={group} goToMessages={this.goToMessages} />
          ))}
        />
      </View>
    );
  }
}
Groups.propTypes = {
  auth: PropTypes.shape({
    loading: PropTypes.bool,
    id: PropTypes.number,
    jwt: PropTypes.string,
  }),
  loading: PropTypes.bool,
  refetch: PropTypes.func,
  subscribeToGroups: PropTypes.func,
  subscribeToMessages: PropTypes.func,
  subscribeToMore: PropTypes.func,  // eslint-disable-line react/no-unused-prop-types
  user: PropTypes.shape({
    id: PropTypes.number.isRequired,
    email: PropTypes.string.isRequired,
    groups: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
      }),
    ),
  }),
};

const userQuery = graphql(USER_QUERY, {
  skip: ownProps => !ownProps.auth || !ownProps.auth.jwt,
  options: ownProps => ({ variables: { id: ownProps.auth.id } }),
  props: ({ data: { loading, refetch, user, subscribeToMore } }) => ({
    loading,
    refetch,
    user,
    subscribeToMessages() {
      return subscribeToMore({
        document: MESSAGE_ADDED_SUBSCRIPTION,
        variables: { groupIds: map(user.groups, 'id') },
        updateQuery: (previousResult, { subscriptionData }) => {
          const previousGroups = previousResult.user.groups;
          const newMessage = subscriptionData.data.messageAdded;
          const groupIndex = map(previousGroups, 'id').indexOf(newMessage.to.id);

          if (isDuplicateDocument(newMessage, previousGroups[groupIndex].messages)) {
            return previousResult;
          }

          return update(previousResult, {
            user: {
              groups: {
                [groupIndex]: {
                  messages: { $set: [newMessage] },
                },
              },
            },
          });
        },
      });
    },
    subscribeToGroups() {
      return subscribeToMore({
        document: GROUP_ADDED_SUBSCRIPTION,
        variables: { userId: user.id },
        updateQuery: (previousResult, { subscriptionData }) => {
          const previousGroups = previousResult.user.groups;
          const newGroup = subscriptionData.data.groupAdded;

          if (isDuplicateDocument(newGroup, previousGroups)) {
            return previousResult;
          }

          return update(previousResult, {
            user: {
              groups: { $push: [newGroup] },
            },
          });
        },
      });
    },
  }),
});

const mapStateToProps = ({ auth }) => ({
  auth,
});

export default compose(
  connect(mapStateToProps),
  userQuery,
)(Groups);
