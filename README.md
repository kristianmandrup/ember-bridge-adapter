# Ember Bridge Adapter

Bridge adapter between a LocalStorage adapter and a RestAdapter for Ember.

## Installation

Add this line to your application's Gemfile:

    gem 'ember-bridge-adapter', github: 'kristianmandrup/ember-bridge-adapter'

And then execute:

    $ bundle

Or just take the relevant coffee and js files directly from `vendor/assets/javascripts`.

## Usage

This library comes with two main Ember Bridge classes

* `DS.BridgeSerializer`
* `DS.BridgeAdapter`

The `BridgeAdapter` uses the `BridgeSerializer` to serialize data.

To use it in your app, setup your store to use a `BridgeAdapter` and set both the `serverAdapter` and `clientAdapter` properties of the `BridgeAdapter` instance.

By default they are set to:

```coffeescript
  clientAdapter: DS.LSAdapter.create()
  serverAdapter: DS.RESTAdapter.create()
```

The `LSAdapter` can be found [here](https://github.com/rpflorence/ember-localstorage-adapter).

Note: The BridgeAdapter is currently very experimental and under development. 
I'm just experimenting to see how feasible it would be to turn the current ember-data architecture into a useful architecure to support a bridge adapter. 

So far it looks like *ember-data* needs quite an upgrade in its design in order to fully support this scenario. One major "problem" is that with two different stores, you likely have two different ways of generating and assigning IDs to the records. 

Another problem is passing an options argument along in many of the method calls, in order to maintain state of how to execute the current "transaction", instrumenting the BridgeAdapter and various underlying objects, so that this "transaction" information in the end is passed to the BridgeSerializer and affects how it serializes (or materializes) the record for that particular transaction.

Here is my naïve tweak to `store.createRecord` where I try to add an extra `localId` property on the `properties` hash for the record.

```javascript
  adapter = this.adapterForType(type);      
  if (adapter && adapter.generateIdForRecord) {
    id = coerceId(adapter.generateIdForRecord(this, record));
    // for a bridge adapter, set the localId 
    // and leave the id up to the server (master of ID)
    if (adapter.bridge) {
      properties.localId = id;  
    } else {
      properties.id = id;  
    }        
  }
```

Please feel free to browse through the code, experiment with it and make suggestions or improvements in order to get closer to a working implementation. Thanks!

The key model methods should now take an optional options hash, which is passed around to the most essential functions of adapter, store, transaction etc.

Currently two options are supported `syncServer: true` and `serverFirst: true`.
The `syncServer` option is used to disable syncing with the server.
serverFirst can be set in order to first try finding the record(s) on the server, before trying in the local storage. 

Important: BridgeAdapter is still very experimental and needs further testing and improvement!!!


## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request
