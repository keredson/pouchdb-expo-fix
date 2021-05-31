![](logo.png)

# PouchDB Expo Fix

## About

[PouchdB](https://pouchdb.com/) is a database I recently started exploring.  But it sadly
doesn't work inside Expo, or worse, fails silently (or with untracable promise errors)
when a document with an attachment is  synced.  This package is a collection of hacks I 
implemented / pulled from other resources to make it usable.


## Installation

### Dependencies

In your expo app you will need these dependencies:

```bash
$ yarn add pouchdb-core pouchdb-adapter-http pouchdb-replication \
           pouchdb-adapter-utils pouchdb-adapter-websql-core events \
           expo-sqlite expo-crypto react-native-get-random-values
```

And of course:

```bash
$ yarn add pouchdb-expo-fix
```

### Code Changes

Enable the fixes to PouchDB with the following code:

```javascript
import PouchDB from 'pouchdb-core';
import PouchDBExpoFix from 'pouchdb-expo-fix';
require('pouchdb-adapter-utils').preprocessAttachments = PouchDBExpoFix.fix_pouchdb_adapter_utils()
PouchDB.plugin(PouchDBExpoFix.build_sqlite_adapter(require('pouchdb-adapter-websql-core')))
```

That should be it, but look out for the possible errors listed below (esp. `FileReader.readAsArrayBuffer`).

## Possible Errors

### Random Values Error

This project will do the following import for you:
```javascript
import 'react-native-get-random-values'
```

But this import must be called **before** `uuid` is imported elsewhere in your app.  If you get:

```javascript
Unhandled promise rejection: Error: crypto.getRandomValues() not supported.
See https://github.com/uuidjs/uuid#getrandomvalues-not-supported
```

Import it yourself at the top of your `App.js` or whatever the starting point of your app is.

### FileReader.readAsArrayBuffer

If you see:

```
Possible Unhandled Promise Rejection (id: 0):
[Error: FileReader.readAsArrayBuffer is not implemented]
```

It's likely coming from `preprocessBlob`, which this is library trys to replace.
If you're still getting this error, you likely have another copy of `pouchdb-adapter-utils` about.
  
Try `find . | grep pouchdb-adapter-utils` to find all internal versions in your `node_modules` directory.  You may find:

```bash
$ find . | grep pouchdb-adapter-utils
./node_modules/pouchdb-adapter-websql-core/node_modules/pouchdb-adapter-utils
./node_modules/pouchdb-adapter-websql-core/node_modules/pouchdb-adapter-utils/README.md
./node_modules/pouchdb-adapter-websql-core/node_modules/pouchdb-adapter-utils/package.json
./node_modules/pouchdb-adapter-websql-core/node_modules/pouchdb-adapter-utils/LICENSE
./node_modules/pouchdb-adapter-websql-core/node_modules/pouchdb-adapter-utils/lib
./node_modules/pouchdb-adapter-websql-core/node_modules/pouchdb-adapter-utils/lib/index.es.js
./node_modules/pouchdb-adapter-websql-core/node_modules/pouchdb-adapter-utils/lib/index.js
```

This shows that `pouchdb-adapter-websql-core` is importing its own (likely older) version of
`pouchdb-adapter-utils`, bypassing our implementation of `preprocessBlob`.  To stop this,
override the internal version by setting `resolutions` in `package.json`.

For example, my `pouchdb-adapter-websql-core` was locked to `pouchdb-adapter-utils`
version 7.0.0, not the 7.2.2 that's currently out (and this library is modifying).
To fix, I let `pouchdb-adapter-websql-core` use any version greater than 7.0.0 
(by specifying `"^7.0.0"`).

```json
"resolutions": {
  "pouchdb-adapter-websql-core/pouchdb-adapter-utils": "^7.0.0"
}
```

## Heads Up

### Sets `process.browser`

This library sets `process.browser = true`.  This prevents the following error:

```javascript
TypeError: Cannot assign to read only property 'type' of object
```

This is a workaround until [this PouchDB bug fix](https://github.com/pouchdb/pouchdb/pull/8255/files)
makes it into a release, but it could have side effects elsewhere in your app.

### Overwrites `PouchDB.getAttachment`

This fix overwrites the implementation of `PouchDB.getAttachment`, to make
`opts.binary` default to `false` (instead of `true`), which tells PouchDB to use base64 strings
instead of `Blob`s and `ArrayBuffer`s.  If you're still getting the following error:

```javascript
Error: Creating blobs from 'ArrayBuffer' and 'ArrayBufferView' are not supported
```

Search for other copies of this function with:
```bash
$ grep -R "opts.binary = true" node_modules/
```

If you see more than:
```
node_modules/pouchdb-core/lib/index.es.js:      opts.binary = true;
node_modules/pouchdb-core/lib/index.js:      opts.binary = true;
```
You may need to do something like the `FileReader.readAsArrayBuffer` fix above.

### Sets Global Base64

If `global.btoa` or `global.atob` don't exist in your app, this package will set them for you.


## Other Work

None of these (currently) work in Expo, but I used heavily in building this lib:

- https://medium.com/@duytq94/making-a-simple-note-app-with-pouchdb-in-react-native-ec4810b18a42
- https://dev.to/craftzdog/created-pouchdb-7-for-react-native-23g6
- https://github.com/badbod99/pouchdb-expo-example
