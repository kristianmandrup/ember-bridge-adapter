DS.Transaction.reopen({
  /**
    Creates a new record of the given type and assigns it to the transaction
    on which the method was called.

    This is useful as only clean records can be added to a transaction and
    new records created using other methods immediately become dirty.

    @param {DS.Model} type the model type to create
    @param {Object} hash the data hash to assign the new record
  */
  createRecord: function(type, hash, options) {
    var store = get(this, 'store');

    return store.createRecord(type, hash, this, options);
  }
});
