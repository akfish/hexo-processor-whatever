Promise = require('bluebird')
util = require('./util')
{MakeFoo} = require('./mock')
moment = require('hexo/node_modules/moment')

dateFormat = 'YYYY-MM-DD HH:mm:ss'

describe "Processor", ->
  h = {hexo, createFileForTest, newFile} = util.initHexo('test_processor')

  createFileForFooTest = createFileForTest.bind(null, "foo")
  newFooFile = newFile.bind(null, "foo")
  before ->
    hexo.whatever.register("foo", MakeFoo())
    h.deployAssets("./test/asset/_foos", "source/_foos")
      .then(h.setup)
      .then(-> hexo.call('generate', {}))
  after h.teardown

  describe "Basic Behaivor", ->
    it "should have pattern that matches source/_foos", ->
      {pattern} = hexo.whatever.getProcessor("foo")
      expect(pattern("_foos/test.html")).to.deep.equal({ path: 'test.html', renderable: true })
      expect(pattern("_foos/test.md")).to.deep.equal({ path: 'test.md', renderable: false })
      expect(pattern("_posts/test.md")).to.be.undefined

    it "should bind `foos` to `hexo.locals`", ->
      {name} = hexo.whatever.getProcessor("foo")
      foos = hexo.locals.get(name.plural)
      expect(foos).to.be.an.instanceof(hexo.database.Model)

    it "should process file in source/_foos", ->
      hexo.locals.invalidate()
      {foos} = hexo.locals.toObject()
      foos = foos.toArray()
      expect(foos.length).to.above(0)

  describe "File Lifecycle", ->
    it "create", ->
      body = """
        title: "Hello world"
        date: 2006-01-02 15:04:05
        updated: 2014-12-13 01:02:03
        ---
        The quick brown fox jumps over the lazy dog
        """
      createFileForFooTest body,
        {
          path: 'foo.html',
          published: true,
          type: 'create',
          renderable: true
        },
        (file, Foo) ->
          foo = Foo.findOne(source: file.path)
          foo.title.should.eql("Hello world")
          moment(foo.date).format(dateFormat).should.eql('2006-01-02 15:04:05')
          moment(foo.updated).format(dateFormat).should.eql('2014-12-13 01:02:03')
          foo._content.should.eql('The quick brown fox jumps over the lazy dog')
          foo.source.should.eql(file.path)
          foo.raw.should.eql(body)
          foo.slug.should.eql('foo')
          foo.published.should.be.true

    it "update", ->
      body = """
        title: "New world"
        ---
        """

      file_opts =
        path: 'foo.html'
        published: true
        type: 'update'
        # renderable: true

      Foo = hexo.model('Foo')
      file = newFooFile(file_opts)

      id = null

      Promise.all([
        Foo.insert(source: file.path, slug: 'foo'),
        fs.writeFile(file.source, body)
      ])
        .spread (doc) ->
          id = doc._id
          hexo.whatever.getProcessor('foo')._process(file)
        .then ->
          foo = Foo.findOne(source: file.path)
          foo._id.should.eql(id)
          foo.title.should.eql('New world')
        .finally ->
          Promise.all([
            Foo.findOne(source: file.path).remove()
            fs.unlink(file.source)
          ])

    it "delete", ->
      file_opts =
        path: 'foo.html',
        published: true,
        type: 'delete'
      file = newFooFile(file_opts)
      Foo = hexo.model('Foo')

      Foo.insert(source: file.path, slug: 'foo')
        .then ->
          hexo.whatever.getProcessor('foo')._process(file)
        .then ->
          doc = Foo.findOne(source: file.path)
          expect(doc).to.be.undefined

  describe "Data Fields", ->
    it "should parse file name", ->
      body = """
        title: "Hello world"
        ---
        """
      fooProcessor = hexo.whatever.getProcessor('foo')
      { item_name } = fooProcessor.opts
      fooProcessor.opts.item_name = ':year/:month/:day/:title'
      createFileForFooTest body,
        {
          path: '2006/01/02/foo.html',
          published: true,
          type: 'create',
          renderable: true
        },
        (file, Foo) ->
          fooProcessor.opts.item_name = item_name
          foo = Foo.findOne(source: file.path)
          foo.slug.should.eql('foo')
          moment(foo.date).format("YYYY-MM-DD").should.eql('2006-01-02')

    it "should parse custom 'item_name' pattern", ->
      body = """
        title: "Hello world"
        ---
        """
      fooProcessor = hexo.whatever.getProcessor('foo')
      { item_name } = fooProcessor.opts
      fooProcessor.opts.item_name = ':lang/:title'
      createFileForFooTest body,
        {
          path: 'zh/foo.html',
          published: true,
          type: 'create',
          renderable: true
        },
        (file, Foo) ->
          fooProcessor.opts.item_name = item_name
          foo = Foo.findOne(source: file.path)
          foo.lang.should.eql('zh')

    it "should handle file name that does not match 'item_name' pattern", ->
      body = """
        title: "Hello world"
        ---
        """
      fooProcessor = hexo.whatever.getProcessor('foo')
      { item_name } = fooProcessor.opts
      fooProcessor.opts.item_name = ':year/:month/:day/:title'
      createFileForFooTest body,
        {
          path: 'foo.html',
          published: true,
          type: 'create',
          renderable: true
        },
        (file, Foo) ->
          fooProcessor.opts.item_name = item_name
          foo = Foo.findOne(source: file.path)
          foo.slug.should.eql('foo')

    it "should extract 'title' from 'link' if 'title' is not set", ->
      body = """
        link: http://hexo.io/
        ---
        """
      createFileForFooTest body,
        {
          path: 'foo.html',
          published: true,
          type: 'create',
          renderable: true
        },
        (file, Foo) ->
          foo = Foo.findOne(source: file.path)

          foo.link.should.eql('http://hexo.io/')
          foo.title.should.eql('hexo.io')

    it "should have 'published' field", ->
      body = """
        title: "Hello world"
        published: false
        ---
        """
      createFileForFooTest body,
        {
          path: 'foo.html',
          published: true,
          type: 'create',
          renderable: true
        },
        (file, Foo) ->
          foo = Foo.findOne(source: file.path)
          foo.published.should.be.false

    it "should parse 'date'", ->
      body = """
        title: "Hello world"
        date: Apr 24 2014
        updated: May 5 2015
        ---
        """
      createFileForFooTest body,
        {
          path: 'foo.html',
          published: true,
          type: 'create',
          renderable: true
        },
        (file, Foo) ->
          foo = Foo.findOne(source: file.path)

          moment(foo.date).format(dateFormat).should.eql('2014-04-24 00:00:00')
          moment(foo.updated).format(dateFormat).should.eql('2015-05-05 00:00:00')

    it "should use stats of source file as default 'date' source", ->
      body = """
        title: "Hello world"
        ---
        """
      createFileForFooTest body,
        {
          path: 'foo.html',
          published: true,
          type: 'create',
          renderable: true
        },
        (file, Foo) ->
          foo = Foo.findOne(source: file.path)
          stats = file.statSync()

          foo.date.should.eql(stats.birthtime)
          foo.updated.should.eql(stats.mtime)



    it "should fall back to source file's stats if 'date' is invalid", ->
      body = """
        title: "Hello world"
        date: YoYoYo
        updated: Sup
        ---
        """
      createFileForFooTest body,
        {
          path: 'foo.html',
          published: true,
          type: 'create',
          renderable: true
        },
        (file, Foo) ->
          foo = Foo.findOne(source: file.path)
          stats = file.statSync()

          foo.date.should.eql(stats.birthtime)
          foo.updated.should.eql(stats.mtime)

    it "should process 'timezone'", ->
      body = """
        title: "Hello world"
        date: 2014-04-24
        updated: 2015-05-05
        ---
        """
      hexo.config.timezone = 'UTC'
      createFileForFooTest body,
        {
          path: 'foo.html',
          published: true,
          type: 'create',
          renderable: true
        },
        (file, Foo) ->
          hexo.config.timezone = ''
          foo = Foo.findOne(source: file.path)

          moment(foo.date).utc().format(dateFormat).should.eql('2014-04-24 00:00:00')
          moment(foo.updated).utc().format(dateFormat).should.eql('2015-05-05 00:00:00')

    it "should use 'photo' as an alias for 'photos'", ->
      body = """
        title: "Hello world"
        photo:
        - http://hexo.io/foo.jpg
        - http://hexo.io/bar.png
        ---
        """

      createFileForFooTest body,
        {
          path: 'foo.html',
          published: true,
          type: 'create',
          renderable: true
        },
        (file, Foo) ->
          foo = Foo.findOne(source: file.path)

          foo.photos.should.eql([
            'http://hexo.io/foo.jpg'
            'http://hexo.io/bar.png'
          ])

          expect(foo.photo).to.be.undefined

    it "should accept string as 'photos' value", ->
      body = """
        title: "Hello world"
        photos: http://hexo.io/foo.jpg
        ---
        """

      createFileForFooTest body,
        {
          path: 'foo.html',
          published: true,
          type: 'create',
          renderable: true
        },
        (file, Foo) ->
          foo = Foo.findOne(source: file.path)

          foo.photos.should.eql([
            'http://hexo.io/foo.jpg'
          ])

    it "should use 'category' as an alias for 'categories'", ->
      body = """
        title: "Hello world"
        category:
        - foo
        - bar
        ---
        """

      createFileForFooTest body,
        {
          path: 'foo.html',
          published: true,
          type: 'create',
          renderable: true
        },
        (file, Foo) ->
          foo = Foo.findOne(source: file.path)

          expect(foo.category).to.be.undefined
          foo.categories.map((c) -> c.name)
            .sort()
            .should.eql(['bar', 'foo'])

    it "should accept string as 'categories' value", ->
      body = """
        title: "Hello world"
        categories: foo
        ---
        """

      createFileForFooTest body,
        {
          path: 'foo.html',
          published: true,
          type: 'create',
          renderable: true
        },
        (file, Foo) ->
          foo = Foo.findOne(source: file.path)

          foo.categories.map((c) -> c.name)
            .should.eql(['foo'])

    it "should use 'tag' as an alias for 'tags'", ->
      body = """
        title: "Hello world"
        tag:
        - foo
        - bar
        ---
        """

      createFileForFooTest body,
        {
          path: 'foo.html',
          published: true,
          type: 'create',
          renderable: true
        },
        (file, Foo) ->
          foo = Foo.findOne(source: file.path)

          expect(foo.tag).to.be.undefined
          foo.tags.map((c) -> c.name)
            .sort()
            .should.eql(['bar', 'foo'])

    it "should accept string as 'tags' value", ->
      body = """
        title: "Hello world"
        tags: foo
        ---
        """

      createFileForFooTest body,
        {
          path: 'foo.html',
          published: true,
          type: 'create',
          renderable: true
        },
        (file, Foo) ->
          foo = Foo.findOne(source: file.path)

          foo.tags.map((c) -> c.name)
            .should.eql(['foo'])

    it "should process 'permalink'", ->
      body = """
        title: "Hello world"
        permalink: biuuuuuuuu
        ---
        """

      createFileForFooTest body,
        {
          path: 'foo.html',
          published: true,
          type: 'create',
          renderable: true
        },
        (file, Foo) ->
          foo = Foo.findOne(source: file.path)

          foo.slug.should.eql('biuuuuuuuu')
