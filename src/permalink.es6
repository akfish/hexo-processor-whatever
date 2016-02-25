const {Permalink} = require('hexo-util');

var PERMALINK = null;
export default class PermalinkCache {
  static get(config, opts) {
    if (PERMALINK == null) PERMALINK = new PermalinkCache();
    return PERMALINK.get(config, opts);
  }
  constructor() {
    this._links = {}
  }
  get(config, opts) {
    if (this._links[config]) return this._links.config;
    let permalink = new Permalink(config, opts);
    this._links[config] = permalink;
    return permalink;
  }
}
