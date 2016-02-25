util = require('./util')
{MakeFoo} = require('./mock')
Model = require('warehouse/lib/model')

describe "Processor", ->
  h = {hexo} = util.initHexo('test_registery')
  Foo = MakeFoo()

  hexo.extend.filter.register 'after_process_foo', (data, opts) ->
    delta =
      filtered: true

  before ->
    hexo.whatever.register("foo", Foo)
    h.deployAssets("./test/asset/_foos", "source/_foos")
      .then(h.setup)
      .then(-> hexo.call('generate', {}))
  after h.teardown

  it "should have pattern that matches source/_foos", ->
    {pattern} = hexo.whatever.get("foo")
    expect(pattern("_foos/test.html")).to.deep.equal({ path: 'test.html', renderable: true })
    expect(pattern("_foos/test.md")).to.deep.equal({ path: 'test.md', renderable: false })
    expect(pattern("_posts/test.md")).to.be.undefined


  it "should bind `foos` to `hexo.locals`", ->
    {name} = hexo.whatever.get("foo")
    foos = hexo.locals.get(name.plural)
    expect(foos).to.be.an.instanceof(hexo.database.Model)

  it "should process file in source/_foos", ->
    hexo.locals.invalidate()
    {foos} = hexo.locals.toObject()
    foos = foos.toArray()
    expect(foos.length).to.equal(1)

  describe "'after_process_foo' filter", ->
    it "should extend data with delta", ->
      hexo.locals.invalidate()
      {foos} = hexo.locals.toObject()
      foos.forEach (f) -> expect(f.filtered).to.be.true
    it "should not mutate data directly"
