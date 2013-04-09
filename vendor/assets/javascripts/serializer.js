DS.Serializer.reopen({
  /**
    @private

    This method converts the relationship name to a key for serialization,
    and then invokes the public `addBelongsTo` hook.

    @param {any} data the serialized representation that is being built
    @param {DS.Model} record the record to serialize
    @param {String} name the relationship name
    @param {Object} relationship an object representing the relationship
  */
  _addBelongsTo: function(data, record, name, relationship, options) {
    var key = this._keyForBelongsTo(record.constructor, name);
    this.addBelongsTo(data, record, key, relationship, options);
  },

  /**
    @private

    This method converts the relationship name to a key for serialization,
    and then invokes the public `addHasMany` hook.

    @param {any} data the serialized representation that is being built
    @param {DS.Model} record the record to serialize
    @param {String} name the relationship name
    @param {Object} relationship an object representing the relationship
  */
  _addHasMany: function(data, record, name, relationship, options) {
    var key = this._keyForHasMany(record.constructor, name);
    this.addHasMany(data, record, key, relationship, options);
  }
});