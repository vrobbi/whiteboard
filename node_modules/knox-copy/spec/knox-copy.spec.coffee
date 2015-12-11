knoxCopy = require '..'
fs = require 'fs'
{parallel} = require 'async'

try
  auth = JSON.parse fs.readFileSync('auth', 'ascii')
  bucket = auth.bucket
  client = knoxCopy.createClient auth
catch err
  console.error 'The tests require ./auth to contain a JSON string with'
  console.error '`key, secret, and bucket in order to run tests.'
  process.exit 1


describe 'knox-copy', ->
  describe 'with a file', ->
    beforeEach (done) ->
      client.putBuffer 'test file', '/tmp/spec/test_file', done

    afterEach (done) ->
      parallel(
        [
          '/tmp/spec/test_file'
          '/tmp/spec/test_file_copy'
        ].map (key) -> (cb) ->
          client.deleteFile(key, cb)
        done)

    describe 'copyFromBucket()', ->
      it 'should copy from any bucket', (done) ->
        client.copyFromBucket bucket,
          '/tmp/spec/test_file',
          '/tmp/spec/test_file_copy',
          (err, response) ->
            expect(err).toBeFalsy()
            expect(response.statusCode).toEqual 200
            done()

  describe 'with 4 files', ->
    keys = [1..4].map (n) -> "tmp/spec/list/file_#{n}"

    beforeEach (done) ->
      parallel(
        keys.map (key) -> (cb) ->
          client.putBuffer 'test file', key, cb
        done)

    afterEach (done) ->
      parallel(
        keys.map (key) -> (cb) ->
          client.deleteFile key, cb
        done)
 
    describe 'listPageOfKeys()', ->
      it 'should list a page of S3 Object keys', (done) ->
        # Middle 2 of 4 files
        client.listPageOfKeys 
          maxKeys: 2
          prefix: '/tmp/spec/list'
          marker: '/tmp/spec/list/file_1'
          (err, page) ->
            expect(err).toBeFalsy()
            expect(page.IsTruncated).toBeTruthy()
            expect(page.Contents.length).toBe 2
            done()

        # Last of 4 files
        client.listPageOfKeys 
          maxKeys: 4
          prefix: '/tmp/spec/list'
          marker: '/tmp/spec/list/file_3'
          (err, page) ->
            expect(err).toBeFalsy()
            expect(page.IsTruncated).toBeFalsy()
            expect(page.Contents.length).toBe 1
            done()

        # Marker at the end
        client.listPageOfKeys 
          maxKeys: 4
          prefix: '/tmp/spec/list'
          marker: '/tmp/spec/list/file_4'
          (err, page) ->
            expect(err).toBeFalsy()
            expect(page.IsTruncated).toBeFalsy()
            expect(page.Contents.length).toBe 0
            done()

        # Empty prefix
        client.listPageOfKeys 
          maxKeys: 4
          prefix: '/does_not_exist'
          (err, page) ->
            expect(err).toBeFalsy()
            expect(page.IsTruncated).toBeFalsy()
            expect(page.Contents.length).toBe 0
            done()

    describe 'streamKeys()', ->
      it 'should emit a data event for every key and an end event when keys are exhausted', (done) ->
        streamedKeys = []
        stream = client.streamKeys(prefix: '/tmp/spec/list')
        stream.on 'data', (key) -> streamedKeys.push key
        stream.on 'end', ->
          expect(streamedKeys).toEqual keys
          done()

    describe 'copyBucket()', ->

      afterEach (done) ->
        parallel(
          [1..4].map (n) -> (cb) ->
            client.deleteFile "/tmp/spec/copy_bucket/file_#{n}", cb
          done)

      it 'should copy a prefixed set of files across buckets', (done) ->
        client.copyBucket
          fromBucket: bucket # this is the default value.  Included here to show where you'd set a different bucket
          fromPrefix: '/tmp/spec/list'
          toPrefix: '/tmp/spec/copy_bucket'
          (err, count) ->
            expect(err).toBeFalsy()
            # returns the number of copied objects
            expect(count).toBe 4
            done()
