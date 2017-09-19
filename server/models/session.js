const utils = require('../lib/hashUtils');
const Model = require('./model');
const Users = require('./user');

/**
 * Sessions is a class with methods to interact with the sessions table, which
 * stores the information about a session (id, hash, userId).
 * @constructor
 * @augments Model
 */
class Sessions extends Model {
  constructor() {
    super('sessions');
  }

  /**
   * Determines if a session is associated with a logged in user.
   * @params {Object} session - Session object (requires a user property)
   * @returns {boolean} A boolean indicating if the session is associated
   * with a user that is logged in.
   */
  isLoggedIn(session) {
    return !!session.user;
  }

  /**
   * Gets one record in the table matching specified conditions, and attaches user
   * information if the userId is present on the session object.
   * @param {Object} options - An object where the keys are the column names and the values
   * are the values to be matched.
   * @returns {Promise<Object>} A promise that is fulfilled with the session object
   * or rejected with the error that occured. Note that even if multiple session records
   * match the options, the promise will only be fulfilled with one.
   */
  get(options) {
    return super.get.call(this, options)
      .then(session => {
        if (!session || !session.userId) {
          return session;
        }
        return Users.get({ id: session.userId }).then(user => {
          session.user = user;
          return session;
        });
      });
  }

  /**
   * Creates a new session. Within this function, a hash is randomly generated.
   * @returns {Promise<Object>} A promise that is fulfilled with the results of
   * an insert query or rejected with the error that occured.
   */
  create() {
    let data = utils.createRandom32String();
    let hash = utils.createHash(data);
    return super.create.call(this, { hash });
  }
}

module.exports = new Sessions();
