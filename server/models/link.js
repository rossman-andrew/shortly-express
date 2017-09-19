const crypto = require('crypto');
const Promise = require('bluebird');
const request = Promise.promisify(require('request'), { multiArgs: true });
const Model = require('./model');

/**
 * Links is a class with methods to interact with the links table, which
 * stores information (id, url, baseUrl, code, title, and visits) about
 * the shortened links.
 * @constructor
 * @augments Model
 */
class Links extends Model {
  constructor() {
    super('links');
    this.rValidUrl = /^(?!mailto:)(?:(?:https?|ftp):\/\/)?(?:\S+(?::\S*)?@)?(?:(?:(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[0-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))|localhost)(?::\d{2,5})?(?:\/[^\s]*)?$/i;
  }

  /**
   * Makes a request to the url and uses regex to get the title from the html.
   * @param {string} url - The url of the website from which to get the title.
   * @returns {Promise<string>} Returns a promise that is fulfilled with the title
   * as a string or is rejected with the error that occured.
   */
  getUrlTitle(url) {
    return request(url).spread((response, html) => {
      let tag = /<title>(.*)<\/title>/;
      let match = response.body.match(tag);
      let title = match ? match[1] : url;
      return title;
    }); 
  }

  /**
   * Checks a url string to determine if it is valid.
   * @param {string} url - The url to check for validity.
   * @returns {boolean} Returns a boolean indicating if the url is valid.
   */
  isValidUrl(url) {
    return url.match(this.rValidUrl);
  }

  /**
   * Creates a new row in the links table.
   * @param {Object} link - An object containing url, title, and base url.
   * @returns {Promise<Object>} Returns a promise that is fulfilled with the result
   * of the insert query or is rejected with the error that occured.
   */
  create(link) {
    let shasum = crypto.createHash('sha1');
    shasum.update(link.url);
    link.code = shasum.digest('hex').slice(0, 5);

    return super.create.call(this, link);
  }
}

module.exports = new Links();
