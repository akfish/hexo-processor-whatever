import Promise from 'bluebird';
import Name from './name';

const _ = require('lodash');
const yfm = require('hexo-front-matter');
const common = require('hexo/lib/plugins/processor/common');
const {Pattern, Permalink, slugize} = require('hexo-util');

export default class Processor {
  constructor(hexo, name, model, opts = {}) {
    this.hexo = hexo;
    this.name = new Name(name);
    this.model = model;
    this.opts = opts;

    _.bindAll(this, [
      "_buildData",
      "_extendData",
      "_updateDatabase"
    ]);
  }
  _parseFileInfo(file, { item_name }) {
    let { path: fullPath, params } = file,
      { path: filePath, published }  = params;
    return {
      source: fullPath,
      published
    };
  }
  _buildData(info, stats, content) {
    // TODO: generate path
    let {hexo, name, opts} = this,
      { permalink, preserved_keys } = opts,
      {timezone} = hexo.config,
      data = yfm(content);
    data.raw = content;
    data.slug = info.title;

    if (!data.hasOwnProperty('published')) data.published = info.published;
    data = _.extend(data, _.omit(info, preserved_keys, 'published'));

    if (data.date){
      data.date = common.toDate(data.date);
    } else if (info && info.year && (info.month || info.i_month) && (info.day || info.i_day)){
      data.date = new Date(
        info.year,
        parseInt(info.month || info.i_month, 10) - 1,
        parseInt(info.day || info.i_day, 10)
      );
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
  }
  _extendData(data) {
    let { hexo, name, opts } = this;
    // Filters should not mutate data directly
    // instead they should only return changed fields
    // TODO: add test specs
    return hexo.execFilter(`after_process_${name.normalized}`, _.cloneDeep(data), { args: [{opts}] })
      .then((delta) => _.extend(data, delta));
  }
  _updateDatabase(data) {
    let {hexo, name} = this,
      Model = hexo.model(name.titled),
      doc = Model.findOne({source: data.source});
    if (doc) {
      return doc.replace(data);
    }
    return Model.insert(data);
  }
  _process(file) {
    if (!file.params.renderable) return;
    let {hexo, name, opts} = this,
      Model = hexo.model(name.titled),
      doc = Model.findOne({source: file.path});

    if (file.type === 'delete') {
      return typeof doc === 'object' ? doc.remove() : null;
    }

    return Promise.all([
        this._parseFileInfo(file, opts),
        file.stat(),
        file.read()
      ])
      .spread(this._buildData)
      .then(this._extendData)
      .then(this._updateDatabase);
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
