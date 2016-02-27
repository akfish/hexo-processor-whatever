import _ from "lodash";
import Processor from "./processor";
import ModelExtender from "./model";
import Filter from "./filter"

const DEFAULT_OPTS = {
  processor: {
    item_name: ":title",
    preserved_keys: [
      'title',
      'year',
      'month',
      'day',
      'i_month',
      'i_day'
    ]
  },
  generator: {
    index: {
      enabled: true,
      permalink: ":source/index.html",
      layout: ['archive', 'index'],
      pagination: true,
      perPage: 10
    },
    item: {
      enabled: true,
      layout: ['post']
    }
  },
  filter: {
    item_permalink: ":source/:title/",
  }
}

export default class Registery {
  constructor(hexo) {
    this.hexo = hexo;
    this._processors = {};
    this._filters = {};
  }
  register(name, model, opts) {
    let {hexo} = this;

    opts = _.defaults({}, opts, DEFAULT_OPTS);
    // Check duplications
    if (name in this._processors) {
      throw new RangeError(`[Whatever] Duplicate name '${name}'`);
    }

    let modelExtender = new ModelExtender(hexo, name, model);
    modelExtender.register();

    let processor = this._processors[name] = new Processor(hexo, name, opts.processor);
    processor.register();

    let filter = this._filters[name] = new Filter(hexo, name, opts.filter);
    filter.register();
  }
  getProcessor(name) {
    return this._processors[name];
  }
  getFilter(name) {
    return this._filters[name];
  }
}

Registery.DEFAULT_OPTS = DEFAULT_OPTS;
