Promise = require('bluebird')
util = require('./util')
{MakeFoo} = require('./mock')
_ = require('lodash')


describe "Generator", ->

  h = {hexo, locals} = util.initHexo('test_generator')

  generator = null
  test_docs = null
  generator_opts = null

  before ->
    hexo.whatever.register("foo", MakeFoo())
    generator = hexo.whatever.getGenerator('foo')
    h.setup()
      .then(-> hexo.call('generate', {}))
      .then ->
        Foo = hexo.model("Foo")
        Promise.all [
          { source: "foo", slug: "foo" }
          { source: "bar", slug: "bar" }
          { source: "biu", slug: "biu" }
          { source: "zzz", slug: "zzz" }
        ].map (item) -> Foo.insert(item)
      .then (docs) ->
        test_docs = docs
  after h.teardown

  it "should generate index route with pagination", ->
    routes = generator._generateIndex(locals())
    routes.should.be.an('array')
    routes.should.have.length(1)
    _.map(routes, (r) -> r.path).should.eql [
      'foos/'
    ]
    routes.forEach (r) ->
      r.layout.should.eql(['archive', 'index'])
      r.data.posts.should.have.length(4)

  it "should generate index route with pagination (multiple pages)", ->
    perPage = generator.opts.index.perPage
    generator.opts.index.perPage = 2
    routes = generator._generateIndex(locals())
    generator.opts.index.perPage = perPage
    routes.should.be.an('array')
    routes.should.have.length(2)
    _.map(routes, (r) -> r.path).should.eql [
      'foos/'
      'foos/page/2/'
    ]
    routes.forEach (r) ->
      r.layout.should.eql(['archive', 'index'])
      r.data.posts.should.have.length(2)


  it "should generate index route with pagination (custom layout)", ->
    layout = generator.opts.index.layout
    generator.opts.index.layout = ['foo']
    routes = generator._generateIndex(locals())
    generator.opts.index.layout = layout
    routes.should.be.an('array')
    routes.should.have.length(1)
    _.map(routes, (r) -> r.path).should.eql [
      'foos/'
    ]
    routes.forEach (r) ->
      r.layout.should.eql(['foo'])
      r.data.posts.should.have.length(4)


  it "should generate index route without pagination", ->
    l = locals()
    generator.opts.index.pagination = false
    routes = generator._generateIndex(l)
    generator.opts.index.pagination = true
    routes.path.should.eql('foos/')
    routes.data.should.eql(l.foos)
    routes.layout.should.eql(['archive', 'index'])

  it "should generate item routes", ->
    {foos} = l = locals()
    data_map = _.keyBy(foos.toArray(), (f) -> f.path)
    routes = generator._generateItem(l)
    routes.should.be.an('array')
    routes.should.have.length(foos.length)
    routes.forEach (r) ->
      r.layout.should.eql(['post'])
      r.path.should.eql(r.data.path)
      r.data.should.eql(data_map[r.path])

  it "should generate item routes (custom layout)", ->
    {foos} = l = locals()
    layout = generator.opts.index.layout
    generator.opts.item.layout = ['foo_item']
    routes = generator._generateItem(l)
    generator.opts.item.layout = layout
    routes.should.be.an('array')
    routes.should.have.length(foos.length)
    routes.forEach (r) ->
      r.layout.should.eql(['foo_item'])
