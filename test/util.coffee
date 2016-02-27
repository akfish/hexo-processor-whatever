path = require('path')
whatever = require('../src/main')
Name = require('../src/name')

module.exports =
  initHexo: (name) ->
    base_dir = path.join(__dirname, name)
    hexo = new Hexo(base_dir, silent: false)
    whatever(hexo)
    setup = ->
      fs.mkdirs(base_dir).then(-> hexo.init())
    teardown = ->
      fs.rmdir(base_dir)
    deployAssets = (src, relative_dst) ->
      dst = path.join(base_dir, relative_dst)
      fs.copyDir(src, dst)
    newFile = (model_name, opts) ->
      name = new Name(model_name)
      { source } = hexo
      { File } = source
      { path: file_path, published, renderable } = opts

      opts.path = name.dirPath + file_path
      opts.source = path.join(source.base, opts.path)

      opts.params = {
        published,
        path: file_path,
        renderable
      }

      file = new File(opts)

    createFileForTest = (model_name, file_body, file_opts, tester) ->
      name = new Name(model_name)
      file = newFile(model_name, file_opts)

      fs.writeFile(file.source, file_body)
        .then ->
          hexo.whatever.getProcessor(name.normalized)._process(file)
        .then (data) ->
          Model = hexo.model(name.titled)
          tester(file, Model, data)
        .finally () ->
          Model = hexo.model(name.titled)
          doc = Model.findOne(source: file.path)
          Promise.all([
            doc.remove()
            fs.unlink(file.source)
          ])

    return {
      base_dir,
      hexo,
      setup,
      teardown,
      deployAssets,
      newFile,
      createFileForTest
    }
