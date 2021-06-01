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




import PouchDB from 'pouchdb-core';

// THIS IS THE CORE BIT YOU NEED FOR YOUR APP TO WORK
import PouchDBExpoFix from 'pouchdb-expo-fix';
require('pouchdb-adapter-utils').preprocessAttachments = PouchDBExpoFix.fix_pouchdb_adapter_utils()
PouchDB.plugin(PouchDBExpoFix.build_sqlite_adapter(require('pouchdb-adapter-websql-core')))


// Then just use PouchDB as normal...
import HttpPouch from 'pouchdb-adapter-http';
import replication from 'pouchdb-replication';
PouchDB
  .plugin(HttpPouch)
  .plugin(replication)
let my_db = new PouchDB('my.db', { adapter: 'react-native-sqlite' });






// Or run the tests...
REMOTE_URL = null

PouchDBExpoFix.run_local_tests().then(() => {
  console.log('local_tests complete')
  if (REMOTE_URL) PouchDBExpoFix.run_remote_tests(REMOTE_URL).then(() => console.log('remote_tests complete'))
  else console.log('remote tests skipped - please set REMOTE_URL')
})



