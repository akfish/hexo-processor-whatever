import Promise from 'bluebird';
import Name from './name';
import Permalink from './permalink';
import path from 'path';

const _ = require('lodash');
const yfm = require('hexo-front-matter');
const common = require('hexo/lib/plugins/processor/common');
const {Pattern, slugize} = require('hexo-util');

export default class Processor {
  constructor(hexo, name, opts = {}) {
    this.hexo = hexo;
    this.name = new Name(name);
    // this.model = model;
    this.opts = opts;

    _.bindAll(this, [
      "_buildData",
      "_extendData",
      "_updateDatabase",
      "_linkMeta"
    ]);
  }
  _parseFileInfo(file, { item_name }) {
    let { path: fullPath, params } = file,
      { path: filePath, published }  = params;

    item_name = item_name.substring(0, item_name.length - path.extname(item_name).length);
    filePath = filePath.substring(0, filePath.length - path.extname(filePath).length);

    let permalink = Permalink.get(item_name, {
      segments: {
        year: /(\d{4})/,
        month: /(\d{2})/,
        day: /(\d{2})/,
        i_month: /(\d{1,2})/,
        i_day: /(\d{1,2})/
      }
    }),
      data = permalink.parse(filePath);

    return _.defaults(
      {
        source: fullPath,
        published
      },
      data,
      {
        title: slugize(filePath)
      }
    );
  }
  _buildData(info, stats, content) {
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

    if (data.category && !data.categories) {
      data.categories = data.category;
      delete data.category;
    }

    if (data.tag && !data.tags) {
      data.tags = data.tag;
      delete data.tag;
    }

    let categories = data.categories || [],
      tags = data.tags || [];

    if (!Array.isArray(categories)) categories = [categories];
    if (!Array.isArray(tags)) tags = [tags];

    data.categories = categories;
    data.tags = tags;

    if (data.photo && !data.photos){
      data.photos = data.photo;
      delete data.photo;
    }

    if (data.photos && !Array.isArray(data.photos)){
      data.photos = [data.photos];
    }

    if (data.link && !data.title){
      data.title = data.link.replace(/^https?:\/\/|\/$/g, '');
    }

    if (data.permalink){
      data.slug = data.permalink;
      delete data.permalink;
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

    let defered = doc ? doc.replace(data) : Model.insert(data);
    return [defered, data];
  }
  _linkMeta(doc, data) {
    let { categories, tags } = data;
    return Promise.all([
      doc.setCategories(categories),
      doc.setTags(tags)
    ]);
  }
  _process(file) {
    let {hexo, name, opts} = this,
      Model = hexo.model(name.titled),
      doc = Model.findOne({source: file.path});

    if (file.type === 'delete') {
      return typeof doc === 'object' ? doc.remove() : null;
    }
    let renderedBefore = file.type === 'update' && typeof doc === 'object';
    if (!file.params.renderable && !renderedBefore) return;

    return Promise.all([
        this._parseFileInfo(file, opts),
        file.stat(),
        file.read()
      ])
      .spread(this._buildData)
      .then(this._extendData)
      .then(this._updateDatabase)
      .spread(this._linkMeta);
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
