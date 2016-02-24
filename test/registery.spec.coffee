util = require('./util')
Registery = require('../src/registery')
{MakeFoo} = require('./mock')
_ = require('lodash')
models = require('hexo/lib/models')

describe "Registery", ->
  h = {hexo} = util.initHexo('test_registery')

  before h.setup
  after h.teardown

  it "should add `hexo.whatever` field", ->
    expect(hexo).to.have.property('whatever')
      .that.is.an.instanceof(Registery)

  it "`.register` should support Hexo built-in models", ->
    _.keys(models).forEach (model) ->
      expect(-> hexo.whatever.register("my#{model}", model))
        .not.to.throw(Error)

    expect(-> hexo.whatever.register("what", "what"))
        .to.throw(TypeError, "[Whatever] 'what' is not a Hexo built-in model")

  it "`.register` should validate model type", ->
    Foo = MakeFoo(hexo)
    expect(-> hexo.whatever.register("foo", Foo))
      .not.to.throw(Error)
    expect(-> hexo.whatever.register("bar", {}))
      .to.throw(TypeError, "[Whatever] Model for 'bar' is not an instance of wharehouse schema")

  it "`.register` should reject duplicate names", ->
    Foo = MakeFoo(hexo)
    expect(-> hexo.whatever.register("baz", Foo))
      .not.to.throw(Error)
    expect(-> hexo.whatever.register("baz", Foo))
      .to.throw(RangeError, "[Whatever] Duplicate name 'baz'" )
