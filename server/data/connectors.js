import _ from 'lodash';
import faker from 'faker';
import Sequelize from 'sequelize';
import bcrypt from 'bcrypt';

const db = new Sequelize('chatty', null, null, {
  dialect: 'sqlite',
  storage: './chatty.sqlite',
  logging: false,
});

const GroupModel = db.define('group', {
  name: { type: Sequelize.STRING },
});

const MessageModel = db.define('message', {
  text: { type: Sequelize.STRING },
});

const UserModel = db.define('user', {
  email: { type: Sequelize.STRING },
  username: { type: Sequelize.STRING },
  password: { type: Sequelize.STRING },
  version: { type: Sequelize.INTEGER }, // version the password
});

UserModel.belongsToMany(GroupModel, { through: 'GroupUser' });
UserModel.belongsToMany(UserModel, { through: 'Friends', as: 'friends' });
MessageModel.belongsTo(UserModel);
MessageModel.belongsTo(GroupModel);
GroupModel.belongsToMany(UserModel, { through: 'GroupUser' });

const GROUPS = 4;
const USERS_PER_GROUP = 5;
const MESSAGES_PER_USER = 5;

faker.seed(123);
db.sync({ force: true }).then(() => (
  _.times(GROUPS, () => (
    GroupModel.create({
      name: faker.lorem.words(3),
    }).then((group) => {
      const password = 'prueba';
      return _.times(USERS_PER_GROUP, () => (
        bcrypt.hash(password, 10).then(hash => group.createUser({
          email: faker.internet.email(),
          username: faker.internet.userName(),
          password: hash,
          version: 1,
        }).then((user) => {
          console.log('{email, username, password}', `{${user.email}, ${user.username}, ${password}}`); // eslint-disable-line no-console
          _.times(MESSAGES_PER_USER, () => MessageModel.create({
            userId: user.id,
            groupId: group.id,
            text: faker.lorem.sentences(3),
          }));

          return user;
        }))
      ));
    }).then((userPromises) => {
      Promise.all(userPromises).then((users) => {
        _.each(users, (current, i) => {
          _.each(users, (user, j) => {
            if (i !== j) {
              current.addFriend(user);
            }
          });
        });
      });
    })
  ))
));

const Group = db.models.group;
const Message = db.models.message;
const User = db.models.user;

export { Group, Message, User };
