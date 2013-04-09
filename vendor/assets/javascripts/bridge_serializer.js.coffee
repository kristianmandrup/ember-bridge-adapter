DS.BridgeSerializer = DS.JSONSerializer.extend
  bridgeAdapter: null 

  init: (bridgeAdapter) ->
    @bridgeAdapter = bridgeAdapter
    this._super().apply(this, arguments);

  # Should be tweaked ??
  materialize: (record, serialized, prematerialized, options) ->
    if (Ember.isNone(get(record, 'id'))) {
      if (prematerialized && prematerialized.hasOwnProperty('id')) {
        id = prematerialized.id;
      } else {
        id = this.extractId(record.constructor, serialized);
      }
      record.materializeId(id);
    }

    this.materializeAttributes(record, serialized, prematerialized);
    this.materializeRelationships(record, serialized, prematerialized);

  clientSerializer: ->
    @bridgeAdapter.clientAdapter.serializer

  serverSerializer: ->
    @bridgeAdapter.serverAdapter.serializer

  addBelongsTo: (data, record, key, association, options) ->
    syncServer = options.syncServer if options?
    clientSerializer().addBelongsTo(data, record, key, association)
    serverSerializer().addBelongsTo(data, record, key, association) if serverSync

  addHasMany: (data, record, key, association, options) ->
    syncServer = options.syncServer if options?
    clientSerializer().addBelongsTo(data, record, key, association)
    serverSerializer().addHasMany(data, record, key, association) if serverSync

  # extract expects a root key, we don't want to save all these keys to
  # localStorage so we generate the root keys here
  extract: (loader, json, type, record, options) ->
    serverFirst = options.serverFirst if options?
    if serverFirst
      result = serverSerializer().extract(loader, json, type, record)
    if not result?.length
      result = clientSerializer().extract(loader, json, type, record)
    if not serverFirst and not result?.length
      serverSerializer().extract(loader, json, type, record)

  extractMany: (loader, json, type, records, options) ->
    serverFirst = options.serverFirst if options?
    if serverFirst
      result = serverSerializer().extractMany(loader, json, type, record)
    if not result?.length
      result = clientSerializer().extractMany(loader, json, type, record)
    if not serverFirst and not result?.length
      serverSerializer().extractMany(loader, json, type, record)

  rootJSON: (json, type, pluralize, options) ->
    serverFirst = options.serverFirst if options?
    if serverFirst
      result = serverSerializer().rootJSON(json, type, pluralize)
    if not result?.length
      result = clientSerializer().rootJSON(json, type, pluralize)
    if not serverFirst and not result?.length
      serverSerializer().rootJSON(json, type, pluralize)