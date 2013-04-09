DS.Model.reopen({
  /**
    Reload the record from the adapter.

    This will only work if the record has already finished loading
    and has not yet been modified (`isLoaded` but not `isDirty`,
    or `isSaving`).
  */
  reload: function(options) {
    this.send('reloadRecord', options);
  },

  deleteRecord: function(options) {
    this.send('deleteRecord', options);
  },

  unloadRecord: function(options) {
    Ember.assert("You can only unload a loaded, non-dirty record.", !get(this, 'isDirty'));

    this.send('unloadRecord', options);
  }
});

