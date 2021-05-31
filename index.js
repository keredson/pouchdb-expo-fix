console.log('--==[ pouchdb-expo-fix ]==--')

import PouchDB from 'pouchdb-core';










// this has a new impl of `preprocessBlob()`
var pouchdbAdapterUtils = require('pouchdb-adapter-utils');
var customPouchdbAdapterUtils = require('./custompouchdbadapterutils');
pouchdbAdapterUtils.preprocessAttachments = customPouchdbAdapterUtils.preprocessAttachments











/*
  Syncing w/ attachments gives this error:
  
    [Unhandled promise rejection: Error: Creating blobs from 'ArrayBuffer' and 'ArrayBufferView' are not supported]
    at node_modules/react-native/Libraries/Blob/BlobManager.js:74:14 in parts.map$argument_0
    at [native code]:null in map
    at node_modules/react-native/Libraries/Blob/BlobManager.js:69:18 in createFromParts
    at Blob@http://192.168.86.24:19005/node_modules/expo/AppEntry.bundle?platform=android&dev=true&hot=false&minify=false:32162:45 in <unknown>
    at node_modules/pouchdb-adapter-websql-core/node_modules/pouchdb-binary-utils/lib/index-browser.js:21:11 in createBlob
    at node_modules/pouchdb-adapter-websql-core/lib/index.js:1483:14 in tx.executeSql$argument_2
    at node_modules/@expo/websql/lib/websql/WebSQLTransaction.js:70:8 in self._websqlDatabase._db.exec$argument_2
    at node_modules/expo-sqlite/build/SQLite.js:17:20 in ExponentSQLite.exec.then$argument_0
    at [native code]:null in flushedQueue
    at [native code]:null in invokeCallbackAndReturnFlushedQueue
    
  Overwrite `getAttachment` to set `opts.binary = false`, so it uses baseb4
  instead of blobs (which are unsupported in react-native / Expo).

 */
var pouchdbUtils = require('pouchdb-utils');
PouchDB.prototype.getAttachment =
  pouchdbUtils.adapterFun('getAttachment', function (docId, attachmentId, opts, callback) {
  var self = this;
  if (opts instanceof Function) {
    callback = opts;
    opts = {};
  }
  this._get(docId, opts, function (err, res) {
    if (err) {
      return callback(err);
    }
    if (res.doc._attachments && res.doc._attachments[attachmentId]) {
      opts.ctx = res.ctx;
      opts.binary = false;
      self._getAttachment(docId, attachmentId,
                          res.doc._attachments[attachmentId], opts, callback);
    } else {
      return callback(pouchdbErrors.createError(pouchdbErrors.MISSING_DOC));
    }
  });
});











import {btoa, atob} from './base64'
if (!global.btoa) {
    global.btoa = btoa;
}
if (!global.atob) {
    global.atob = atob;
}











import * as SQLite from 'expo-sqlite';
// SQLite adapter (basically just a shim) between WebSQL and SQLite
import sqliteadapter from './sqliteadapter';
const PouchDBExpoFixSQLiteAdapter = sqliteadapter(SQLite);



export {PouchDBExpoFixSQLiteAdapter}





