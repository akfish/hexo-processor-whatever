const _ = require('lodash');
import Name from './name';
import Permalink from './permalink';
import paginate from 'hexo-pagination';

export default class Generator {
  constructor(hexo, name, opts) {
    this.hexo = hexo;
    this.name = new Name(name);
    this.opts = opts;
  }
  get indexGenerator() {
    return this._generateIndex.bind(this);
  }
  get itemGenerator() {
    return this._generateItem.bind(this);
  }
  register() {
    let { hexo, name, opts } = this,
      { index, item } = opts;
    if (index.enabled) {
      hexo.extend.generator.register(`${name.normalized}_index`, this.indexGenerator);
    }
    if (item.enabled) {
      hexo.extend.generator.register(`${name.normalized}`, this.itemGenerator);
    }
  }
  _generateIndex(locals) {
    let { hexo, name, opts } = this,
      { permalink, layout, pagination, perPage } = opts.index;

    let source = name.plural;
    let indexPath = Permalink.get(permalink).stringify({source});
    if (pagination) {
      return paginate(indexPath, locals[source], {
        perPage,
        layout
      });
    } else {
      return {
        path: indexPath,
        data: locals[source],
        layout: layout
      }
    }
  }
  _generateItem(locals) {
    let { hexo, name, opts } = this,
      { layout } = opts.item;

    return locals[name.plural].map((data) => ({
      path: data.path,
      data: data,
      layout
    }));
  }
}
