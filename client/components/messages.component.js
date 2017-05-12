import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Image,
  ListView,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Actions } from 'react-native-router-flux';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import randomColor from 'randomcolor';
import { graphql, compose } from 'react-apollo';
import update from 'immutability-helper';
import { connect } from 'react-redux';
import Message from './message.component';
import MessageInput from './message-input.component';
import GROUP_QUERY from '../graphql/group.query';
import CREATE_MESSAGE_MUTATION from '../graphql/createMessage.mutation';
import MESSAGE_ADDED_SUBSCRIPTION from '../graphql/messageAdded.subscription';

function isDuplicateMessage(newMessage, existingMessages) {
  return newMessage.id !== null && existingMessages.some(message => newMessage.id === message.id);
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
    backgroundColor: '#e5ddd5',
    flex: 1,
    flexDirection: 'column',
    paddingTop: 32,
  },
  loading: {
    justifyContent: 'center',
  },
  titleWrapper: {
    alignItems: 'center',
    marginTop: 10,
    position: 'absolute',
    ...Platform.select({
      ios: {
        top: 15,
      },
      android: {
        top: 5,
      },
    }),
    left: 0,
    right: 0,
  },
  title: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleImage: {
    marginRight: 6,
    width: 32,
    height: 32,
    borderRadius: 16,
  },
});

class Messages extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ds: new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 }),
      usernameColors: {},
      refreshing: false,
    };

    this.send = this.send.bind(this);
    this.groupDetails = this.groupDetails.bind(this);
    this.onRefresh = this.onRefresh.bind(this);
    this.renderTitle = this.renderTitle.bind(this);
    this.onContentSizeChange = this.onContentSizeChange.bind(this);
    this.onLayout = this.onLayout.bind(this);
  }

  componentDidMount() {
    this.renderTitle();
  }

  componentWillReceiveProps(nextProps) {
    const oldData = this.props;
    const newData = nextProps;

    const usernameColors = {};

    if (newData.group) {
      if (newData.group.users) {
        newData.group.users.map((user) => {
          usernameColors[user.username] = this.state.usernameColors[user.username] || randomColor();
          return usernameColors[user.username];
        });
      }

      if (!!newData.group.messages &&
        (!oldData.group || newData.group.messages !== oldData.group.messages)) {
        this.setState({
          ds: this.state.ds.cloneWithRows(newData.group.messages.slice().reverse()),
          usernameColors,
        });
      }
    }

    if (!this.subscription && !newData.loading) {
      this.subscription = newData.subscribeToMore({
        document: MESSAGE_ADDED_SUBSCRIPTION,
        variables: { groupIds: [newData.groupId] },
        updateQuery: (previousResult, { subscriptionData }) => {
          const newMessage = subscriptionData.data.messageAdded;

          if (isDuplicateMessage(newMessage, previousResult.group.messages)) {
            return previousResult;
          }

          return update(previousResult, {
            group: {
              messages: {
                $unshift: [newMessage],
              },
            },
          });
        },
      });
    }
  }

  onRefresh() {
    this.setState({ refreshing: true });
    this.props.loadMoreEntries().then(() => {
      this.setState({
        refreshing: false,
      });
    });
  }

  onContentSizeChange(w, h) {
    if (this.state.shouldScrollToBottom && this.state.height < h) {
      this.listView.scrollToEnd({ animated: true });
      this.setState({
        shouldScrollToBottom: false,
      });
    }
  }

  onLayout(e) {
    const { height } = e.nativeEvent.layout;
    this.setState({ height });
  }

  groupDetails() {
    Actions.groupDetails({ id: this.props.groupId });
  }

  send(text) {
    this.props.createMessage({
      groupId: this.props.groupId,
      userId: this.props.auth.id,
      text,
    });

    this.setState({
      shouldScrollToBottom: true,
    });
  }

  renderTitle() {
    Actions.refresh({
      renderTitle: () => (
        <TouchableOpacity
          style={styles.titleWrapper}
          onPress={this.groupDetails}
        >
          <View style={styles.title}>
            <Image
              style={styles.titleImage}
              source={{ uri: 'https://facebook.github.io/react/img/logo_og.png' }}
            />
            <Text>{this.props.title}</Text>
          </View>
        </TouchableOpacity>
      ),
    });
  }

  render() {
    const { auth, loading, group } = this.props;

    if (loading && !group) {
      return (
        <View style={[styles.loading, styles.container]}>
          <ActivityIndicator />
        </View>
      );
    }

    return (
      <KeyboardAvoidingView
        behavior={'position'}
        contentContainerStyle={styles.container}
        style={styles.container}
      >
        <ListView
          ref={(ref) => { this.listView = ref; }}
          style={styles.listView}
          enableEmptySections
          dataSource={this.state.ds}
          refreshControl={
            <RefreshControl
              refreshing={this.state.refreshing}
              onRefresh={this.onRefresh}
            />
          }
          onContentSizeChange={this.onContentSizeChange}
          onLayout={this.onLayout}
          renderRow={message => (
            <Message
              color={this.state.usernameColors[message.from.username]}
              message={message}
              isCurrentUser={message.from.id === auth.id}
            />
          )}
        />
        <MessageInput send={this.send} />
      </KeyboardAvoidingView>
    );
  }
}
Messages.propTypes = {
  auth: PropTypes.shape({
    id: PropTypes.number,
    jwt: PropTypes.string,
  }),
  createMessage: PropTypes.func,
  group: PropTypes.shape({
    messages: PropTypes.array,
    users: PropTypes.array,
  }),
  loading: PropTypes.bool,
  loadMoreEntries: PropTypes.func,
  groupId: PropTypes.number.isRequired,
  title: PropTypes.string.isRequired,
};

const ITEMS_PER_PAGE = 10;
const groupQuery = graphql(GROUP_QUERY, {
  options: ({ groupId }) => ({
    variables: {
      groupId,
      offset: 0,
      limit: ITEMS_PER_PAGE,
    },
  }),
  props: ({ data: { fetchMore, loading, group, subscribeToMore } }) => ({
    loading,
    group,
    subscribeToMore,
    loadMoreEntries() {
      return fetchMore({
        variables: {
          offset: group.messages.length,
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult) { return previousResult; }

          return update(previousResult, {
            group: {
              messages: { $push: fetchMoreResult.group.messages },
            },
          });
        },
      });
    },
  }),
});

const createMessage = graphql(CREATE_MESSAGE_MUTATION, {
  props: ({ ownProps, mutate }) => ({
    createMessage: ({ text, groupId }) =>
      mutate({
        variables: { text, groupId },
        optimisticResponse: {
          __typename: 'Mutation',
          createMessage: {
            __typename: 'Message',
            id: null,
            text,
            createdAt: new Date().toISOString(),
            from: {
              __typename: 'User',
              id: ownProps.auth.id,
              username: 'Justyn.Kautzer',
            },
          },
        },
        updateQueries: {
          group: (previousResult, { mutationResult }) => {
            const newMessage = mutationResult.data.createMessage;

            if (isDuplicateMessage(newMessage, previousResult.group.messages)) {
              return previousResult;
            }

            return update(previousResult, {
              group: {
                messages: {
                  $unshift: [newMessage],
                },
              },
            });
          },
        },
      }),
  }),
});

const mapStateToProps = ({ auth }) => ({
  auth,
});

export default compose(
  connect(mapStateToProps),
  groupQuery,
  createMessage,
)(Messages);
