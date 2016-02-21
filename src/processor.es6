import Promise from 'bluebird';

const _ = require('lodash');
const yfm = require('hexo-front-matter');
const common = require('hexo/lib/plugins/processor/common');
const {Pattern} = require('hexo-util');

export class Name {
  constructor(name) {
    let first = name[0],
      rest = name.substr(1);
    this._normalized = first.toLowerCase() + rest;
    this._titled = first.toUpperCase() + rest;
    this._plural = this._normalized + "s";
    this._dirPath = `_${this._plural}/`;
  }
  get normalized() { return this._normalized; }
  get titled() { return this._titled; }
  get plural() { return this._plural; }
  get dirPath() { return this._dirPath; }
}

export default class Processor {
  constructor(hexo, name, model, opts = {}) {
    this.hexo = hexo;
    this.name = new Name(name);
    this.model = model;
    this.opts = opts;
  }
  _process(file) {
    if (!file.params.renderable) return;
    let {hexo, name, model, opts} = this,
      {config} = hexo,
      {path} = file.params,
      {timezone} = config,
      Model = hexo.model(name.titled),
      doc = Model.findOne({source: file.path});

    if (file.type === 'delete') {
      return typeof doc === 'object' ? doc.remove() : null;
    }

    return Promise.all([
        file.stat(),
        file.read()
      ]).spread((stats, content) => {
        let data = yfm(content);
        data.source = file.path;
        data.raw = content;

        if (data.date) {
          data.date = common.toDate(data.date);
        }

        if (data.date) {
          if (timezone) data.date = common.timezone(data.date, timezone);
        } else {
          data.date = stats.birthtime;
        }

        data.updated = common.toDate(data.updated);


        if (data.updated) {
          if (timezone) data.updated = common.timezone(data.updated, timezone);
        } else {
          data.updated = stats.mtime;
        }

        return data;
      }).then((data) => {
        return hexo.execFilter(`process_${name.normalized}`, data, { args: [{opts}] });
      }).then((data) => {
        let doc = Model.findOne({source: file.path});

        if (doc) {
          return doc.replace(data);
        }

        return Model.insert(data);
      });
  }
  get pattern() {
    if (!this._pattern) {
      let {name, hexo} = this;
      this._pattern = (function (path) {
        if (common.isTmpFile(path)) return;

        let result;

        if (_.startsWith(path, name.dirPath)) {
          result = {
            path: path.substr(name.dirPath.length)
          }
        }

        if (!result || common.isHiddenFile(result.path)) return;

        result.renderable = hexo.render.isRenderable(path);// Not available in 3.1.1: && !common.isMatch(path, hexo.config.skip_render);
        return result;
      });
    }
    return this._pattern;
  }
  get process() {
     return this._process.bind(this);
  }
  register() {
    let {hexo} = this;
    hexo.extend.processor.register(this.pattern, this.process);
    this._bindLocals();
  }
  _bindLocals() {
    let {hexo, name} = this,
      {locals, database} = hexo;
    locals.set(name.plural, () => database.model(name.titled));
  }
}
