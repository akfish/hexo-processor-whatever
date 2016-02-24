path = require('path')
whatever = require('../src')

module.exports =
  initHexo: (name) ->
    base_dir = path.join(__dirname, name)
    hexo = new Hexo(base_dir, silent: true)
    whatever(hexo)
    setup = ->
      fs.mkdirs(base_dir).then(-> hexo.init())
    teardown = ->
      fs.rmdir(base_dir)
    deployAssets = (src, relative_dst) ->
      dst = path.join(base_dir, relative_dst)
      fs.copyDir(src, dst)


    return {
      base_dir,
      hexo,
      setup,
      teardown,
      deployAssets
    }
