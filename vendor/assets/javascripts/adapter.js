DS.Adapter.reopen({

  /**
    Loads a payload for a record into the store.

    This method asks the serializer to break the payload into
    constituent parts, and then loads them into the store. For example,
    if you have a payload that contains embedded records, they will be
    extracted by the serializer and loaded into the store.

    For example:

    ```javascript
      adapter.load(store, App.Person, {
        id: 123,
        firstName: "Yehuda",
        lastName: "Katz",
        occupations: [{
          id: 345,
          title: "Tricycle Mechanic"
        }]    
      });
    ```

    This will load the payload for the `App.Person` with ID `123` and
    the embedded `App.Occupation` with ID `345`.

    @param {DS.Store} store
    @param {subclass of DS.Model} type
    @param {any} payload
  */
  load: function(store, type, payload, options) {
    var loader = loaderFor(store);
    get(this, 'serializer').extractRecordRepresentation(loader, type, payload, options);
  },

  /**
    Acknowledges that the adapter has finished creating several records.

    Your adapter should call this method from `createRecords` when it
    has saved multiple created records to its persistent storage 
    received an acknowledgement.

    If the persistent storage returns a new payload in response to the
    creation, and you want to update the existing record with the
    new information, pass the payload as the fourth parameter.

    @param {DS.Store} store
    @param {subclass of DS.Model} type
    @param {DS.Model} record
    @param {any} payload 
  */
  didCreateRecords: function(store, type, records, payload, options) {
    records.forEach(function(record) {
      store.didSaveRecord(record);
    }, this);

    if (payload) {
      var loader = DS.loaderFor(store);
      get(this, 'serializer').extractMany(loader, payload, type, records, options);
    }
  },

  /**
    @private

    Acknowledges that the adapter has finished updating or deleting a record.

    Your adapter should call this method from `updateRecord` or `deleteRecord`
    when it has updated or deleted a record to its persistent storage and
    received an acknowledgement.

    If the persistent storage returns a new payload in response to the
    update or delete, and you want to update the existing record with the
    new information, pass the payload as the fourth parameter.

    @param {DS.Store} store
    @param {subclass of DS.Model} type
    @param {DS.Model} record
    @param {any} payload 
  */
  didSaveRecord: function(store, type, record, payload, options) {
    store.didSaveRecord(record);

    var serializer = get(this, 'serializer'),
        mappings = serializer.mappingForType(type);

    serializer.eachEmbeddedRecord(record, function(embeddedRecord, embeddedType) {
      if (embeddedType === 'load') { return; }

      this.didSaveRecord(store, embeddedRecord.constructor, embeddedRecord, options);
    }, this);

    if (payload) {
      var loader = DS.loaderFor(store);
      serializer.extract(loader, payload, type, options);
    }
  }
})