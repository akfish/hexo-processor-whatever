import Processor from "./processor";
import _ from "lodash";
import ModelExtender from "./model";

const DEFAULT_OPTS = {
  processor: {
    permalink: ":source/:title/",
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
  }
}

export default class Registery {
  constructor(hexo) {
    this.hexo = hexo;
    this._processors = {};
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
  }
  get(name) {
    return this._processors[name];
  }
}

Registery.DEFAULT_OPTS = DEFAULT_OPTS;
