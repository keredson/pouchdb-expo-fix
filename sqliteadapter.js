'use strict'

var WebSqlPouchCore = null

import * as SQLite from 'expo-sqlite';
var pouchdbBinaryUtils = require('pouchdb-binary-utils');

function createOpenDBFunction (opts) {
  return function (name, version, description, size) {
    // The SQLite Plugin started deviating pretty heavily from the
    // standard openDatabase() function, as they started adding more features.
    // It's better to just use their "new" format and pass in a big ol'
    // options object. Also there are many options here that may come from
    // the PouchDB constructor, so we have to grab those.
    var openOpts = Object.assign({}, opts, {
      name: name,
      version: version,
      description: description,
      size: size
    })
    function onError (err) {
      console.error(err)
      if (typeof opts.onError === 'function') {
        opts.onError(err)
      }
    }
    return SQLite.openDatabase(openOpts.name, openOpts.version, openOpts.description, openOpts.size, null, onError)
  }
}

function ReactNativeSQLitePouch (opts, callback) {
  var websql = createOpenDBFunction(opts)
  var _opts = Object.assign({
    websql: websql
  }, opts)
  
  WebSqlPouchCore.call(this, _opts, (x,WebSqlPouch) => {
    WebSqlPouch._getAttachment = _getAttachment.bind(WebSqlPouch)
    callback(x,WebSqlPouch)
  })
}

function unescapeBlob(str) {
  /* eslint-disable no-control-regex */
  return str
    .replace(/\u0001\u0001/g, '\u0000')
    .replace(/\u0001\u0002/g, '\u0001')
    .replace(/\u0002\u0002/g, '\u0002');
  /* eslint-enable no-control-regex */
}

var base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;

function _getAttachment(docId, attachId, attachment, opts, callback) {
    var res;
    var tx = opts.ctx;
    var digest = attachment.digest;
    var type = attachment.content_type;
    var sql = 'SELECT escaped, ' +
      'CASE WHEN escaped = 1 THEN body ELSE HEX(body) END AS body FROM ' +
      '"attach-store"' + ' WHERE digest=?';
    tx.executeSql(sql, [digest], function (tx, result) {
      // websql has a bug where \u0000 causes early truncation in strings
      // and blobs. to work around this, we used to use the hex() function,
      // but that's not performant. after migration 6, we remove \u0000
      // and add it back in afterwards
      var item = result.rows.item(0);
      var data = item.escaped ? unescapeBlob(item.body) :
        parseHexString(item.body, encoding);
      if (opts.binary) {
        res = pouchdbBinaryUtils.binaryStringToBlobOrBuffer(data, type);
      } else {
        if (base64regex.test(data)) res = data
        else res = pouchdbBinaryUtils.btoa(data);
      }
      callback(null, res);
    });
  };


ReactNativeSQLitePouch.valid = function () {
  // if you're using ReactNative, we assume you know what you're doing because you control the environment
  return true
}

// no need for a prefix in ReactNative (i.e. no need for `_pouch_` prefix
ReactNativeSQLitePouch.use_prefix = false

function reactNativeSqlitePlugin (PouchDB) {
  PouchDB.adapter('react-native-sqlite', ReactNativeSQLitePouch, true)
}

function createPlugin (core) {
  WebSqlPouchCore = core
  return reactNativeSqlitePlugin
}

module.exports = createPlugin
