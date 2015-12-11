Stream = require 'stream'
{nextTick} = require 'async'

module.exports = class KeyStream extends Stream
  #
  # Stream Configuration
  #
  readable: true
  writable: false

  paused: false

  #
  # Pagination state
  #

  # true if a request for keys is pending
  replenishing: false

  # true once all keys have been retrieved from Amazon.  We batch requests, so 
  # we may still have a queue of keys that haven't been iterated yet.
  allKeysQueued: false

  # true once a data event has been emitted for every key.
  allKeysStreamed: false

  # number of keys to list per request.  The stream queue caps at ~1.5x this size.
  maxKeysPerRequest: 500

  # pagination index
  marker: null

  # queue of keys returned from Amazon but not yet iterated
  keyQueue: null

  constructor: ({@client, @prefix}) ->
    @keyQueue = []
    @_replenishKeys @_continueStreaming

  pause: ->
    @paused = true

  resume: ->
    return unless @paused
    @paused = false
    @_continueStreaming()

  isExhausted: ->
    @allKeysStreamed

  _keysRunningLow: -> 
      @keyQueue.length < (@maxKeysPerRequest / 2)
  
  _continueStreaming: =>
    while @keyQueue.length > 0
      if @paused
        return
      
      if not @allKeysQueued and not @replenishing and @_keysRunningLow()
        # Wait 'till next tick to guarantee this loop terminates first.
        # Don't want to double end!
        @_replenishKeys =>
          nextTick =>
            @_continueStreaming

      @emit 'data', @keyQueue.shift() 

    if @allKeysQueued and not @allKeysStreamed
      @allKeysStreamed = true
      @emit 'end'

  # enqueue the next page of keys
  _replenishKeys: (done) ->
    @replenishing = true
    @client.listPageOfKeys {@prefix, maxKeys: @maxKeysPerRequest, @marker}, (err, page) =>
      @replenishing = false
      if err?
        @emit 'error', err
        return done()

      # extract and queue up the keys
      for row in page.Contents
        @keyQueue.push row.Key

      if page.IsTruncated
        # advance the marker a page
        @marker = @keyQueue.slice(-1)[0]
      else
        @allKeysQueued = true
      done()