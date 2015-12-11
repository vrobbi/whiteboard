qs = require 'querystring'
{isArray} = require 'util'
{waterfall} = require 'async'
knox = require 'knox'
{Parser} = require 'xml2js'
KeyStream = require './key_stream'

stripLeadingSlash = (key) -> key.replace /^\//, ''

swapPrefix = (key, oldPre, newPre) ->
  "#{newPre}/#{stripLeadingSlash(key.slice(oldPre.length))}"

ensureBuffer = (data) ->
  Buffer.isBuffer(data) and data or new Buffer(data)

###
Read a whole stream into a buffer.
###
guzzle = (stream, cb) ->
  buffers = []
  stream.on 'data', (chunk) ->
    buffers.push(ensureBuffer(chunk))
  stream.on 'error', (err) ->
    cb err
  stream.on 'end', ->
    cb null, Buffer.concat(buffers)


###
Returns an http request.  Optional callback receives the response.
###
knox::copyFromBucket = (fromBucket, fromKey, toKey, headers, cb) ->
  if typeof headers is 'function'
    cb = headers
    headers = {}

  headers['x-amz-copy-source'] = "/#{fromBucket}/#{stripLeadingSlash fromKey}"
  headers['Content-Length'] = 0 # avoid chunking
  req = @request 'PUT', toKey, headers

  if cb?
    req.on('response', (res) -> cb(null, res))
    req.on('error', (err) -> cb new Error("Error copying #{fromKey}:", err))
    req.end()
  return req

###
Callback gets a JSON representation of a page of S3 Object keys.
###
knox::listPageOfKeys = ({maxKeys, marker, prefix, headers}, cb) ->
  maxKeys ?= 1000
  headers ?= {}
  prefix = stripLeadingSlash prefix if prefix?
  marker = stripLeadingSlash marker if marker?

  error = (err) ->
    cb new Error("Error listing bucket #{{marker, prefix}}:", err)

  waterfall [
    # Start request
    (next) =>
      req = @request('GET', '/', headers)
      req.path += "?" + qs.stringify {'max-keys': maxKeys, prefix, marker}

      req.on 'error', error
      req.on 'response', (res) ->
        if res.statusCode is 200
          # Buffer full response
          # Unfortunately we miss the first few chunks if we wire
          # guzzle in the waterfall without pausing the response stream.
          guzzle res, next
        else
          error res
      req.end()

    # Parse XML
    (new Parser explicitArray: false, explicitRoot: false).parseString

    # Normalize
    #   Contents always exists, always an array
    #   IsTruncated string -> Boolean
    (page, next) ->
      page.IsTruncated = page.IsTruncated is 'true'
      page.Contents =
        if isArray(page.Contents) then page.Contents
        else if page.Contents? then [page.Contents]
        else []
      next null, page

  ], (err, page) ->
    if err?
      error err
    else
      cb null, page

knox::streamKeys = ({prefix}) ->
  return new KeyStream {prefix, client: @}

# Like async.queue but pauses stream instead of queing
# worker gets stream data and a callback to call when the work is done
workOffStream = ({stream, concurrency, worker, done}) ->
  ended = false
  workerCount = 0
  done ?= ->

  stream.on 'end', -> 
    ended = true
    if workerCount is 0
      done()

  stream.on 'data', (data) ->
    if ++workerCount > concurrency
      stream.pause()
    worker data, ->
      --workerCount
      if ended and workerCount is 0
        done()
      else
        stream.resume()

knox::copyBucket = ({fromBucket, fromPrefix, toPrefix}, cb) ->
  fromBucket ?= @bucket
  fromClient = knox.createClient {@key, @secret, bucket: fromBucket}
  fromPrefix = fromPrefix and stripLeadingSlash(fromPrefix) or ''
  toPrefix = toPrefix and stripLeadingSlash(toPrefix) or ''

  # number of keys copied
  count = 0

  # abort the copy on the first unrecoverable error
  failed = false
  fail = (err) ->
    return if failed
    failed = true
    cb err, count

  keyStream = fromClient.streamKeys prefix: fromPrefix
  keyStream.on 'error', fail

  workOffStream 
    stream: keyStream
    concurrency: 5
    worker: (key, done) =>
      toKey = swapPrefix(key, fromPrefix, toPrefix)
      @copyFromBucket fromBucket, key, toKey, (err, res) ->
        if err?
          fail err
        else if res.statusCode isnt 200
          fail new Error "#{res.statusCode} response copying key #{key}"
        else
          count++
        done()
    done: ->
      if not failed
        cb null, count 

module.exports = knox