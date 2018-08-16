const _ = require('lodash');
const debug = require('debug')('influx-sender');
const EventEmitter = require('events');
const request = require('request');

/**
 * buffer message and send them in a bulk
 *
 * const options =
 * {
 *   host:'xxx.xxx.xxx',
 *   port:80,
 *   db:'xxxxx',
 *   measurement:'test'
 *   duration:2000 //ms per 200 send message,
 *   records:100 //when message over 100 send them
 * }
 */

class Sender extends EventEmitter {
  constructor(options) {
    super();
    this.bulks = [];
    this.batchMessages = [];
    this.options = options;
    this.options.duration = this.options.duration || 2000;
    this.options.records = this.options.records || 100;

    if (!this.options.db || !this.options.host) {
      console.error('config error: db or host undefined!');
      return;
    }

    // pre duration send array
    setInterval(() => {
      this._send();
      debug('batchMessages duration sent!');
    }, this.options.duration);
  }

  /**
     * add message to batchMessage
     *
     * @example
     * {
     *   measurement:'test',
     *   tags:{
     *     type:'api',
     *     preqID:'MdHy21313',
     *     api:'dasd',
     *     route:'/sada/dsa/test'
     *   },
     *   fields:{
     *     duration:123
     *   }
     * }
     * @param {Object} message
     */
  addMessage(message) {
    message.time = message.time || new Date().getTime() * 1000000;
    debug('add message! %O', message);
    this.batchMessages.push(message);
    if (this.batchMessages.length > this.options.records) {
      this._send();
      debug('batchMessages over records and sent!');
    }
  }

  /**
     * make the data with influxdb's line protocol.
     * @see https://docs.influxdata.com/influxdb/v0.13/write_protocols/line/
     * @param {Object} obj
     * @param {Boolean} withQuote
     * @private
     */
  _makeline(obj, withQuote = false) {
    let arr = [];

    _.forEach(obj, (n, key) => {
      const value = this._escape(obj[key], withQuote);

      arr.push(`${key}=${value}`);
    });

    return arr.join(',');
  }

  /**
     * use tcp send message
     * @private
     */
  _send() {
    if (!this.options.db || !this.options.host) {
      return;
    }

    const len = this.batchMessages.length;

    if (len < 1) {
      debug('batchMessages is empty!');
      return;
    }

    const bulk = this.batchMessages.splice(0, len);

    let bulkMessage = [];

    for (let i = 0; i < bulk.length; i++) {
      const measurement = bulk[i].measurement || this.options.measurement;

      if (!measurement) {
        throw new Error('measurement options must be set when inital Sender!');
      }
      const tagStr = this._makeline(bulk[i].tags);
      const fieldStr = this._makeline(bulk[i].fields, true);
      const messageStr = `${measurement},${tagStr} ${fieldStr} ${bulk[i].time}`;

      bulkMessage.push(messageStr);
    }

    const data = bulkMessage.join('\n');

    debug('send bulkMessages! %O', data);
    const options = {
      headers: {
        'content-type': 'text/plain'
      },
      url: `http://${this.options.host}:${this.options.port || 80}/write`,
      qs: {
        db: this.options.db
      },
      method: 'POST',
      body: data
    };

    request(options, (error, res, body) => {
      if (error) {
        debug('send error: %O', error);
        console.error(error);
        this.emit('sendError', error);
      }
      debug('status code: %o', res.statusCode);

      if (res.statusCode !== 204) {
        console.error(`Send failed! statusCode:${res.statusCode}`);
        console.error(body);
        this.emit('failed', res.statusCode);
      } else {
        this.emit('ok', res.statusCode);
      }
    });
  }

  /**
     * trans to line string
     * @param {String} value
     * @param {Boolean} withQuote
     * @private
     */
  _escape(value, withQuote) {
    if (_.isString(value)) {
      if (withQuote) {
        value = '"' + value + '"';
      } else {
        value = _.replace(value, /,/g, '\\,');
        value = _.replace(value, /=/g, '\\=');
        value = _.replace(value, /\s/g, '\\ ');
      }
    } else if (_.isInteger(value)) {
      if (withQuote) {
        value = value + 'i';
      }
    } else if (_.isObject(value)) {
      value = '"' + _.replace(JSON.stringify(value), /"/g, '\\"') + '"';
    } else if (_.isNull(value) || _.isNil(value)) {
      value = '""';
    }
    return value;
  }
}

module.exports = Sender;
