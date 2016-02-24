util = require('./util')
Processor = {Name} = require('../src/processor')
{MakeFoo} = require('./mock')
Model = require('warehouse/lib/model')

describe "Name", ->
  it "should transform names correctly", ->
    fooName = new Name("FoO")
    expect(fooName).to.have.property('normalized', "foO")
    expect(fooName).to.have.property('titled'    , "FoO")
    expect(fooName).to.have.property('plural'    , "foOs")
    expect(fooName).to.have.property('dirPath'   , "_foOs/")

describe "Processor", ->
  h = {hexo} = util.initHexo('test_registery')
  Foo = MakeFoo()

  hexo.extend.filter.register 'process_foo', (data, opts) ->
    data.filtered = true
    data

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

  it "should execute 'process_foo' filter", ->
    hexo.locals.invalidate()
    {foos} = hexo.locals.toObject()
    foos.forEach (f) -> expect(f.filtered).to.be.true
