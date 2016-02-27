import Name from "./name";
import Permalink from './permalink';
import path from "path";
import _ from "lodash";
const {Pattern, slugize} = require('hexo-util');

const moment = require('hexo/node_modules/moment');

export default class Filter {
  constructor(hexo, name, opts) {
    this.hexo = hexo;
    this.name = new Name(name);
    this.opts = opts;
  }
  register() {
    let { hexo, name } = this,
      { filter } = hexo.extend;
    filter.register(`${name.normalized}_permalink`, this._permalink.bind(this));
  }
  _permalink(data) {
    let { hexo, name, opts } = this,
      { config } = hexo,
      { id, _id, slug, title, date, categories } = data;

    id = id || _id;
    date = moment(date);
    let category = categories.length ? categories.last().slug : config.default_category;

    let meta = {
      id,
      title: slug,
      name: path.basename(slug),
      post_title: slugize(title || slug, { transform: 1 }),
      year: date.format('YYYY'),
      month: date.format('MM'),
      day: date.format('DD'),
      i_month: date.format('M'),
      i_day: date.format('D'),
      category,
      source: name.plural
    };

    let keys = _.omit(_.keys(data), ['path', 'permalink', 'categories', 'tags']);
    _.each(keys, (key) => {
      if (meta.hasOwnProperty(key)) return;

      Object.defineProperty(meta, key, Object.getOwnPropertyDescriptor(data, key));
    });

    return Permalink.get(opts.item_permalink).stringify(meta);

  }
}
