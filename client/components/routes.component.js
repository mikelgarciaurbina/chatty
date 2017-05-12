import React from 'react';
import PropTypes from 'prop-types';
import { Router, Scene, Actions } from 'react-native-router-flux';
import { Text, View, StyleSheet } from 'react-native';
import { connect } from 'react-redux';
import Groups from './groups.component';
import Messages from './messages.component';
import FinalizeGroup from './finalize-group.component';
import GroupDetails from './group-details.component';
import NewGroup from './new-group.component';
import Signin from './signin.component';
import Settings from './settings.component';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBarStyle: {
    backgroundColor: '#dbdbdb',
  },
  tabText: {
    color: '#777',
    fontSize: 10,
    justifyContent: 'center',
  },
  selected: {
    color: 'blue',
  },
});

const TabIcon = ({ title, selected }) => (
  <View style={styles.container}>
    <Text style={[styles.tabText, selected ? styles.selected : undefined]}>
      {title}
    </Text>
  </View>
);
TabIcon.propTypes = {
  selected: PropTypes.bool,
  title: PropTypes.string.isRequired,
};

export const Scenes = Actions.create(
  <Scene key="root">
    <Scene key="tabs" tabBarStyle={styles.tabBarStyle} tabs>
      <Scene key="chatsTab" title="Chats" icon={TabIcon}>
        <Scene
          key="groups"
          component={Groups}
          title="Chats"
          hideBackImage
        />
      </Scene>
      <Scene key="settingsTab" title="Settings" icon={TabIcon}>
        <Scene
          key="settings"
          component={Settings}
          title="Settings"
          hideBackImage
        />
      </Scene>
    </Scene>
    <Scene key="signin" direction="vertical">
      <Scene
        key="signinModal"
        component={Signin}
        title="Chatty"
        schema="modal"
        panHandlers={null}
      />
    </Scene>
    <Scene key="newGroup" direction="vertical">
      <Scene
        key="newGroupModal"
        component={NewGroup}
        title="New Group"
        schema="modal"
        panHandlers={null}
      />
      <Scene
        key="finalizeGroup"
        component={FinalizeGroup}
        title="New Group"
      />
    </Scene>
    <Scene
      key="messages"
      component={Messages}
    />
    <Scene key="groupDetails" component={GroupDetails} title="Group Info" />
  </Scene>,
);

export const Routes = connect()(Router);
