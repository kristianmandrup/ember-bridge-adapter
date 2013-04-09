DS.BridgeAdapter = DS.Adapter.extend(Ember.Evented,
  clientAdapter: DS.LSAdapter.create()
  serverAdapter: DS.RESTAdapter.create()

  # The type of adapter (used in DS.Store.createRecord)
  bridge: true

  init: ->
    this._loadData()

  serializer: DS.BridgeSerializer.create(this)

  generateIdForRecord: ->
    clientAdapter.generateIdForRecord()

  materialize: (record, data, prematerialized, options) ->
    get(this, 'serializer').materialize(record, data, prematerialized, options)

  # Try to find via clientAdapter
  # if not found, try find via serverAdapter
  find: (store, type, id, options) ->
    serverFirst = options.serverFirst if options?
    results = @serverAdapter.find(store, type, id) if serverFirst    
    
    clientRecords = @clientAdapter.find(store, type, id) if not results?.length
    if not clientRecords?.length and not serverFirst
      @serverAdapter.find(store, type, id)
    else
      clientRecords

  findMany: (store, type, ids, options) ->
    serverFirst = options.serverFirst if options?
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
  findQuery: (store, type, query, recordArray, options) ->
    serverFirst = options.serverFirst if options?
    results = @serverAdapter.findQuery(store, type, query, recordArray) if serverFirst    

    clientRecords = @clientAdapter.findQuery(store, type, query, recordArray) not results?.length

    if not clientRecords?.length and not serverFirst
      @serverAdapter.findQuery(store, type, query, recordArray)
    else
      clientRecords

  query: (records, query, options) ->
    serverFirst = options.serverFirst if options?
    results = @serverAdapter.query(records, query) if serverFirst    

    clientRecords = @clientAdapter.query(records, query) not results?.length

    if not clientRecords?.length and not serverFirst
      @serverAdapter.query(records, query)
    else
      clientRecords

  # use serverFirst flag to force first to look on Server
  findAll: (store, type, options) ->
    serverFirst = options.serverFirst if options?
    results = @serverAdapter.findAll(store, type) if serverFirst    

    clientRecords = @clientAdapter.findAll(store, type) if not results?.length

    if not clientRecords?.length and not serverFirst
      @serverAdapter.findAll(store, type)
    else
      clientRecords

  createRecords: (store, type, records, options) ->
    syncServer = options.syncServer if options?
    @clientAdapter.createRecords(store, type, records)
    @serverAdapter.createRecords(store, type, records) if syncServer

  updateRecords: (store, type, records, options) ->
    syncServer = options.syncServer if options?
    @clientAdapter.updateRecords(store, type, records)
    @serverAdapter.updateRecords(store, type, records) if syncServer

  deleteRecords: (store, type, records, options true) ->
    syncServer = options.syncServer if options?
    @clientAdapter.deleteRecords(store, type, records)
    @serverAdapter.deleteRecords(store, type, records) if syncServer

  dirtyRecordsForHasManyChange: (dirtySet, parent, relationship, options) ->
    syncServer = options.syncServer if options?
    @clientAdapter.dirtyRecordsForHasManyChange(dirtySet, parent, relationship)
    @serverAdapter.dirtyRecordsForHasManyChange(dirtySet, parent, relationship) if syncServer

  dirtyRecordsForBelongsToChange: (dirtySet, child, relationship, options) ->
    syncServer = options.syncServer if options?
    @clientAdapter.dirtyRecordsForBelongsToChange(dirtySet, parent, relationship)
    @serverAdapter.dirtyRecordsForBelongsToChange(dirtySet, parent, relationship) if syncServer
