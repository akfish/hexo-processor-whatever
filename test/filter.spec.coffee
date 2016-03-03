Promise = require('bluebird')
util = require('./util')
{MakeFoo} = require('./mock')
moment = require("moment")


describe "Filter", ->

  h = {hexo} = util.initHexo('test_filter')

  before ->
    hexo.whatever.register("foo", MakeFoo())
    hexo.whatever.register("bar", "Post")
    h.setup()
      .then(-> hexo.call('generate', {}))
  after h.teardown

  describe "'after_process_foo'", ->
    hexo.extend.filter.register 'after_process_foo', (data, opts) ->
      data.mutate_directly = 'bar'
      delta =
        filtered: true

    it "should extend data with delta", ->
      hexo.locals.invalidate()
      {foos} = hexo.locals.toObject()
      foos.forEach (f) -> expect(f.filtered).to.be.true
    it "should not mutate data directly", ->
      hexo.locals.invalidate()
      {foos} = hexo.locals.toObject()
      foos.forEach (f) -> expect(f.mutate_directly).to.be.undefined

  describe "'foo_permalink'", ->
    it "should return permalink via foo.path", ->
      doc = null
      hexo.model('Foo').insert(slug: "foo")
        .tap (foo) -> doc = foo
        .then (foo) ->
          foo.path.should.eql('foos/foo/')
        .finally -> doc.remove()

    it "should support custom permalink pattern", ->
      doc = null
      filter = hexo.whatever.getFilter("foo")
      permalink_pattern = filter.opts.item_permalink
      filter.opts.item_permalink = ":source/:year/:month/:day/:title/"
      now = new Date()
      hexo.model('Foo').insert(slug: "foo", date: now)
        .tap (foo) -> doc = foo
        .then (foo) ->
          foo.path.should.eql("foos/" + moment(now).format("YYYY/MM/DD") + "/foo/")
        .finally ->
          filter.opts.item_permalink = permalink_pattern
          doc.remove()




    it.skip "should override 'post_permalink' filter if model is Post", ->
      doc = null
      hexo.model('Bar').insert({source: "foo", slug: "foo"}, (err, doc) ->
        console.error(err)
        console.log(doc)
      )
        # .tap (bar) -> doc = bar
        # .then (bar) ->
        #   console.log('-_-')
        #   console.log(bar)
        #   bar.path.should.eql('bar/foo/')
        # .catch (e) -> fail(e)
        # .finally -> doc.remove()
