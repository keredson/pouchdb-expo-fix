import 'react-native-get-random-values';

import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';


// A do-nothing app...
export default function App() {
  return (
    <View style={styles.container}>
      <Text>Open up App.js to start working on your app!</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});



/*

  This app displays nothing on your phone.  It just runs PouchDB commands
  locally (and remotely, if you set REMOTE_URL) to cofirm everything works
  as expected.
  
  See https://github.com/keredson/pouchdb-expo-fix if it errors for you!

 */



// set to test remote syncing
REMOTE_URL = null



import PouchDB from 'pouchdb-core';

// THIS IS THE CORE BIT YOU NEED FOR YOUR APP TO WORK
import PouchDBExpoFix from 'pouchdb-expo-fix';
require('pouchdb-adapter-utils').preprocessAttachments = PouchDBExpoFix.fix_pouchdb_adapter_utils()
PouchDB.plugin(PouchDBExpoFix.build_sqlite_adapter(require('pouchdb-adapter-websql-core')))



import HttpPouch from 'pouchdb-adapter-http';
import replication from 'pouchdb-replication';
PouchDB
  .plugin(HttpPouch)
  .plugin(replication)



async function local_tests() {

  // make sure no data exists
  let db1 = new PouchDB('db1', { adapter: 'react-native-sqlite' });
  let db2 = new PouchDB('db2', { adapter: 'react-native-sqlite' });
  
  await db1.destroy()
  await db2.destroy()
  console.log('dbs cleared')
  
  db1 = new PouchDB('db1', { adapter: 'react-native-sqlite', 
    fetch: function (url, opts) { 
      console.log('xxx', opts)
      opts.binary = false;
      return PouchDB.fetch(url, opts);
    }
   });
  db2 = new PouchDB('db2', { adapter: 'react-native-sqlite',
    fetch: function (url, opts) { 
      console.log('xxx', opts)
      opts.binary = false;
      return PouchDB.fetch(url, opts);
    }
 });

  console.log('writing doc w/ attachment')
  await db1.put({
    _id: 'mydoc',
    _attachments: {
      'myattachment.txt': {
        content_type: 'text/plain',
        data: 'aGVsbG8gd29ybGQ='
      }
    }
  });
  
  let mydoc = await db1.get('mydoc')
  console.log('read doc w/ attachment', mydoc)
  
  console.log('syncing doc to db2')
  await db1.sync(db2)
  
}

local_tests().then(() => console.log('local_tests complete'))




async function remote_tests(url) {
  let local_db = new PouchDB('local_db', { adapter: 'react-native-sqlite' });
  await local_db.destroy()
  console.log('remote db cleared')
  
  local_db = new PouchDB('local_db', { adapter: 'react-native-sqlite' });
  let remote_db = new PouchDB(url);


  // write doc to remote db
  let pouchdb_expo_test_doc = await remote_db.post({
    type: 'pouchdb-test-doc',
    _attachments: {
      'myattachment.txt': {
        content_type: 'text/plain',
        data: 'aGVsbG8gd29ybGQ='
      }
    }
  });
  console.log('wrote pouchdb_expo_test_doc', pouchdb_expo_test_doc)
  
  // read doc from remote db
  console.log('read pouchdb_expo_test_doc', await remote_db.get(pouchdb_expo_test_doc.id))
  
  // sync to local_db
  await local_db.sync(remote_db)
  console.log('synced remote doc to local')

  // write doc to local db
  let pouchdb_expo_test_doc2 = await local_db.post({
    type: 'pouchdb-test-doc',
    _attachments: {
      'myattachment.txt': {
        content_type: 'text/plain',
        data: 'aGVsbG8gd29ybGQ='
      }
    }
  });
  console.log('wrote pouchdb_expo_test_doc2', pouchdb_expo_test_doc2)

  await local_db.sync(remote_db)
  console.log('synced local doc to remote')

  await local_db.remove({_id:pouchdb_expo_test_doc.id, _rev:pouchdb_expo_test_doc.rev})
  console.log('removed pouchdb_expo_test_doc locally')

  await local_db.sync(remote_db)
  console.log('synced local doc removed')

  await remote_db.remove({_id:pouchdb_expo_test_doc2.id, _rev:pouchdb_expo_test_doc2.rev})
  console.log('removed pouchdb_expo_test_doc2 from remote_db')

  await remote_db.sync(local_db)
  console.log('synced local doc removed')

}


if (REMOTE_URL) remote_tests(REMOTE_URL).then(() => console.log('remote_tests complete'))
else console.log('remote tests skipped - please set REMOTE_URL')


