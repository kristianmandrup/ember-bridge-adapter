DS.BridgeSerializer = DS.JSONSerializer.extend
  bridgeAdapter: null 

  init: (bridgeAdapter) ->
    @bridgeAdapter = bridgeAdapter
    this._super().apply(this, arguments);

  clientSerializer: ->
    @bridgeAdapter.clientAdapter.serializer

  serverSerializer: ->
    @bridgeAdapter.serverAdapter.serializer

  addBelongsTo: (data, record, key, association, serverSync = true) ->
    clientSerializer().addBelongsTo(data, record, key, association)
    serverSerializer().addBelongsTo(data, record, key, association) if serverSync

  addHasMany: (data, record, key, association, serverSync = true) ->
    clientSerializer().addBelongsTo(data, record, key, association)
    serverSerializer().addHasMany(data, record, key, association) if serverSync

  # extract expects a root key, we don't want to save all these keys to
  # localStorage so we generate the root keys here
  extract: (loader, json, type, record, serverFirst = true) ->
    if serverFirst
      result = serverSerializer().extract(loader, json, type, record)
    if not result?.length
      result = clientSerializer().extract(loader, json, type, record)
    if not serverFirst and not result?.length
      serverSerializer().extract(loader, json, type, record)

  extractMany: (loader, json, type, records, serverFirst = true) ->
    if serverFirst
      result = serverSerializer().extractMany(loader, json, type, record)
    if not result?.length
      result = clientSerializer().extractMany(loader, json, type, record)
    if not serverFirst and not result?.length
      serverSerializer().extractMany(loader, json, type, record)

  rootJSON: (json, type, pluralize, serverFirst = true) ->
    if serverFirst
      result = serverSerializer().rootJSON(json, type, pluralize)
    if not result?.length
      result = clientSerializer().rootJSON(json, type, pluralize)
    if not serverFirst and not result?.length
      serverSerializer().rootJSON(json, type, pluralize)

DS.BridgeAdapter = DS.Adapter.extend(Ember.Evented,
  clientAdapter: DS.LSAdapter.create()
  serverAdapter: DS.RESTAdapter.create()

  init: ->
    this._loadData()

  # This might be problematic!
  # It could well be, that each adapter uses different Id strategy!
  generateIdForRecord: ->
    Math.random().toString(32).slice(2).substr(0,5)

  serializer: DS.BridgeSerializer.create(this)

  # Try to find via clientAdapter
  # if not found, try find via serverAdapter
  find: (store, type, id, serverFirst = true) ->
    results = @serverAdapter.find(store, type, id) if serverFirst    
    clientRecords = @clientAdapter.find(store, type, id) if not results?.length
    if not clientRecords?.length and not serverFirst
      @serverAdapter.find(store, type, id)
    else
      clientRecords

  findMany: (store, type, ids, serverFirst = true) ->
    results = @serverAdapter.findMany(store, type, ids) if serverFirst    
    clientRecords = @clientAdapter.findMany(store, type, ids) if not results?.length
    if not clientRecords?.length and not serverFirst
      @serverAdapter.findMany(store, type, ids)
    else
      clientRecords

  # Supports queries that look like this:
  #
  #   {
  #     <property to query>: <value or regex (for strings) to match>,
  #     ...
  #   }
  #
  # Every property added to the query is an "AND" query, not "OR"
  #
  # Example:
  #
  #  match records with "complete: true" and the name "foo" or "bar"
  #
  #    { complete: true, name: /foo|bar/ }
  findQuery: (store, type, query, recordArray, serverFirst = true) ->
    results = @serverAdapter.findQuery(store, type, query, recordArray) if serverFirst    
    clientRecords = @clientAdapter.findQuery(store, type, query, recordArray) not results?.length
    if not clientRecords?.length and not serverFirst
      @serverAdapter.findQuery(store, type, query, recordArray)
    else
      clientRecords

  query: (records, query, serverFirst = true) ->
    results = @serverAdapter.query(records, query) if serverFirst    
    clientRecords = @clientAdapter.query(records, query) not results?.length
    if not clientRecords?.length and not serverFirst
      @serverAdapter.query(records, query)
    else
      clientRecords

  # use serverFirst flag to force first to look on Server
  findAll: (store, type, serverFirst = true) ->
    results = @serverAdapter.findAll(store, type) if serverFirst    
    clientRecords = @clientAdapter.findAll(store, type) if not results?.length
    if not clientRecords?.length and not serverFirst
      @serverAdapter.findAll(store, type)
    else
      clientRecords

  createRecords: (store, type, records, syncServer = true) ->
    @clientAdapter.createRecords(store, type, records)
    @serverAdapter.createRecords(store, type, records) if syncServer

  updateRecords: (store, type, records, syncServer = true) ->
    @clientAdapter.updateRecords(store, type, records)
    @serverAdapter.updateRecords(store, type, records) if syncServer

  deleteRecords: (store, type, records, syncServer = true) ->
    @clientAdapter.deleteRecords(store, type, records)
    @serverAdapter.deleteRecords(store, type, records) if syncServer

  dirtyRecordsForHasManyChange: (dirtySet, parent, relationship, syncServer = true) ->
    @clientAdapter.dirtyRecordsForHasManyChange(dirtySet, parent, relationship)
    @serverAdapter.dirtyRecordsForHasManyChange(dirtySet, parent, relationship) if syncServer

  dirtyRecordsForBelongsToChange: (dirtySet, child, relationship, syncServer = true) ->
    @clientAdapter.dirtyRecordsForBelongsToChange(dirtySet, parent, relationship)
    @serverAdapter.dirtyRecordsForBelongsToChange(dirtySet, parent, relationship) if syncServer
