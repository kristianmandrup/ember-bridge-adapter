/**
  The store contains all of the data for records loaded from the server.
  It is also responsible for creating instances of DS.Model that wraps
  the individual data for a record, so that they can be bound to in your
  Handlebars templates.

  Create a new store like this:

       MyApp.store = DS.Store.create();

  You can retrieve DS.Model instances from the store in several ways. To retrieve
  a record for a specific id, use the `find()` method:

       var record = MyApp.store.find(MyApp.Contact, 123);

   By default, the store will talk to your backend using a standard REST mechanism.
   You can customize how the store talks to your backend by specifying a custom adapter:

       MyApp.store = DS.Store.create({
         adapter: 'MyApp.CustomAdapter'
       });

    You can learn more about writing a custom adapter by reading the `DS.Adapter`
    documentation.
*/
DS.Store.reopen({
  /**
    @private

    Instructs the store to materialize the data for a given record.

    To materialize a record, the store first retrieves the opaque data that was
    passed to either `load()` or `loadMany()`. Then, the data and the record
    are passed to the adapter's `materialize()` method, which allows the adapter
    to translate arbitrary data structures from the adapter into the normalized
    form the record expects.

    The adapter's `materialize()` method will invoke `materializeAttribute()`,
    `materializeHasMany()` and `materializeBelongsTo()` on the record to
    populate it with normalized values.

    @param {DS.Model} record
  */
  materializeData: function(record, options) {
    var clientId = get(record, 'clientId'),
        cidToData = this.clientIdToData,
        adapter = this.adapterForType(record.constructor),
        data = cidToData[clientId];

    cidToData[clientId] = MATERIALIZED;

    var prematerialized = this.clientIdToPrematerializedData[clientId];

    // Ensures the record's data structures are setup
    // before being populated by the adapter.
    record.setupData();

    if (data !== CREATED) {
      // Instructs the adapter to extract information from the
      // opaque data and materialize the record's attributes and
      // relationships.
      adapter.materialize(record, data, prematerialized, options);
    }
  },

  // .....................
  // . CREATE NEW RECORD .
  // .....................

  /**
    Create a new record in the current store. The properties passed
    to this method are set on the newly created record.

    Note: The third `transaction` property is for internal use only.
    If you want to create a record inside of a given transaction,
    use `transaction.createRecord()` instead of `store.createRecord()`.

    @param {subclass of DS.Model} type
    @param {Object} properties a hash of properties to set on the
      newly created record.
    @param {Hash options}
    @returns DS.Model
  */
  createRecord: function(type, properties, transaction, options) {
    properties = properties || {};

    // Create a new instance of the model `type` and put it
    // into the specified `transaction`. If no transaction is
    // specified, the default transaction will be used.
    var record = type._create({
      store: this
    });

    transaction = transaction || get(this, 'defaultTransaction');

    // adoptRecord is an internal API that allows records to move
    // into a transaction without assertions designed for app
    // code. It is used here to ensure that regardless of new
    // restrictions on the use of the public `transaction.add()`
    // API, we will always be able to insert new records into
    // their transaction.
    transaction.adoptRecord(record);

    // `id` is a special property that may not be a `DS.attr`
    var id = properties.id;

    // If the passed properties do not include a primary key,
    // give the adapter an opportunity to generate one. Typically,
    // client-side ID generators will use something like uuid.js
    // to avoid conflicts.
    var adapter;
    if (Ember.isNone(id)) {
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
    }

    id = coerceId(id);

    // Create a new `clientId` and associate it with the
    // specified (or generated) `id`. Since we don't have
    // any data for the server yet (by definition), store
    // the sentinel value CREATED as the data for this
    // clientId. If we see this value later, we will skip
    // materialization.
    var clientId = this.pushData(CREATED, id, type);

    // Now that we have a clientId, attach it to the record we
    // just created.
    set(record, 'clientId', clientId);

    // Move the record out of its initial `empty` state into
    // the `loaded` state.
    record.loadedData();

    // Make sure the data is set up so the record doesn't
    // try to materialize its nonexistent data.
    record.setupData();

    // Store the record we just created in the record cache for
    // this clientId.
    this.recordCache[clientId] = record;

    // Set the properties specified on the record.
    record.setProperties(properties);

    // Resolve record promise
    Ember.run(record, 'resolve', record);

    return record;
  },

  // .................
  // . DELETE RECORD .
  // .................

  /**
    For symmetry, a record can be deleted via the store.

    @param {DS.Model} record
    @param {Hash options}
  */
  deleteRecord: function(record, options) {
    record.deleteRecord(options);
  },

  /**
    For symmetry, a record can be unloaded via the store.

    @param {DS.Model} record
    @param {Hash options}
  */
  unloadRecord: function(record, options) {
    record.unloadRecord(options);
  },

  // ................
  // . FIND RECORDS .
  // ................

  /**
    This is the main entry point into finding records. The first parameter to
    this method is always a subclass of `DS.Model`.

    You can use the `find` method on a subclass of `DS.Model` directly if your
    application only has one store. For example, instead of
    `store.find(App.Person, 1)`, you could say `App.Person.find(1)`.

    ---

    To find a record by ID, pass the `id` as the second parameter:

        store.find(App.Person, 1);
        App.Person.find(1);

    If the record with that `id` had not previously been loaded, the store will
    return an empty record immediately and ask the adapter to find the data by
    calling the adapter's `find` method.

    The `find` method will always return the same object for a given type and
    `id`. To check whether the adapter has populated a record, you can check
    its `isLoaded` property.

    ---

    To find all records for a type, call `find` with no additional parameters:

        store.find(App.Person);
        App.Person.find();

    This will return a `RecordArray` representing all known records for the
    given type and kick off a request to the adapter's `findAll` method to load
    any additional records for the type.

    The `RecordArray` returned by `find()` is live. If any more records for the
    type are added at a later time through any mechanism, it will automatically
    update to reflect the change.

    ---

    To find a record by a query, call `find` with a hash as the second
    parameter:

        store.find(App.Person, { page: 1 });
        App.Person.find({ page: 1 });

    This will return a `RecordArray` immediately, but it will always be an
    empty `RecordArray` at first. It will call the adapter's `findQuery`
    method, which will populate the `RecordArray` once the server has returned
    results.

    You can check whether a query results `RecordArray` has loaded by checking
    its `isLoaded` property.

    @param {Class} type
    @param {Number|String} id
    @param {Hash options}
  */
  find: function(type, id, options) {
    if (id === undefined) {
      return this.findAll(type, options);
    }

    // We are passed a query instead of an id.
    if (Ember.typeOf(id) === 'object') {
      return this.findQuery(type, id, options);
    }

    return this.findById(type, coerceId(id), options);
  },

  /**
    @private

    This method returns a record for a given type and id combination.

    If the store has never seen this combination of type and id before, it
    creates a new `clientId` with the LOADING sentinel and asks the adapter to
    load the data.

    If the store has seen the combination, this method delegates to
    `getByReference`.

    @param {Class} type
    @param {Number|String} id
    @param {Hash options}
  */
  findById: function(type, id, options) {
    var clientId = this.typeMapFor(type).idToCid[id];

    if (clientId) {
      return this.findByClientId(type, clientId);
    }

    clientId = this.pushData(LOADING, id, type);

    // create a new instance of the model type in the
    // 'isLoading' state
    var record = this.materializeRecord(type, clientId, id, options);

    // let the adapter set the data, possibly async
    var adapter = this.adapterForType(type);

    Ember.assert("You tried to find a record but you have no adapter (for " + type + ")", adapter);
    Ember.assert("You tried to find a record but your adapter does not implement `find`", adapter.find);

    adapter.find(this, type, id, options);

    return record;
  },

  /* 
    @param {DS.Model} record
    @param {Hash options}
  */
  reloadRecord: function(record, options) {
    var type = record.constructor,
        adapter = this.adapterForType(type),
        id = get(record, 'id');

    Ember.assert("You cannot update a record without an ID", id);
    Ember.assert("You tried to update a record but you have no adapter (for " + type + ")", adapter);
    Ember.assert("You tried to update a record but your adapter does not implement `find`", adapter.find);

    adapter.find(this, type, id, options);
  },

  /**
    @private

    This method returns a record for a given clientId.

    If there is no record object yet for the clientId, this method materializes
    a new record object. This allows adapters to eagerly load large amounts of
    data into the store, and avoid incurring the cost to create the objects
    until they are requested.

    Several parts of Ember Data call this method:

    * findById, if a clientId already exists for a given type and
      id combination
    * OneToManyChange, which is backed by clientIds, when getChild,
      getOldParent or getNewParent are called
    * RecordArray, which is backed by clientIds, when an object at
      a particular index is looked up

    In short, it's a convenient way to get a record for a known
    clientId, materializing it if necessary.

    @param {Class} type
    @param {Number|String} clientId
    @param {Hash options}    
  */
  findByClientId: function(type, clientId, options) {
    var cidToData, record, id;

    record = this.recordCache[clientId];

    if (!record) {
      // create a new instance of the model type in the
      // 'isLoading' state
      id = this.clientIdToId[clientId];
      record = this.materializeRecord(type, clientId, id, options);

      cidToData = this.clientIdToData;

      if (typeof cidToData[clientId] === 'object') {
        record.loadedData();
      }
    }

    return record;
  }
});
