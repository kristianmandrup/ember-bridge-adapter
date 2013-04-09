# Ember Bridge Adapter

Bridge adapter between a LocalStorage adapter and a RestAdapter for Ember.

## Installation

Add this line to your application's Gemfile:

    gem 'ember-bridge-adapter'

And then execute:

    $ bundle

Or install it yourself as:

    $ gem install ember-bridge-adapter

## Usage

This gem comes with two Ember Bridge classes

* `DS.BridgeSerializer`
* `DS.BridgeAdapter`

The `BridgeAdapter` uses the `BridgeSerializer` to serialize data.
To use it in your app, setup your store to use a `BridgeAdapter` and set both the `serverAdapter` and `clientAdapter` properties of the `BridgeAdapter` instance.

By default they are set to:

```coffeescript
  clientAdapter: DS.LSAdapter.create()
  serverAdapter: DS.RESTAdapter.create()
```

Note: The BridgeAdapter is currently very experimental and mainly just an idea to see if the concept could hold. It looks like *ember-data* would need an upgrade in order to fully support this (fx see the `generateIdForRecord` function).

## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request
