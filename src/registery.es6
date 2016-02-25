import Processor from "./processor";
import _ from "lodash";

const {Schema} = require('warehouse');
const models = require('hexo/lib/models');

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
    // Built-in model
    if (typeof model === 'string') {
      let modelMaker = models[model];
      if (typeof modelMaker !== 'function') {
        throw new TypeError(`[Whatever] '${model}' is not a Hexo built-in model`)
      }
      model = modelMaker(hexo);
    }
    // Check model type
    // Note: model instance of Schema will not do since Schema could come from
    //       diffrent packages
    if (!(typeof model === 'object' && model.constructor && model.constructor.name === 'Schema')) {
      throw new TypeError(`[Whatever] Model for '${name}' is not an instance of wharehouse schema`);
    }
    let processor = this._processors[name] = new Processor(hexo, name, model, opts.processor);
    processor.register();
  }
  get(name) {
    return this._processors[name];
  }
}

Registery.DEFAULT_OPTS = DEFAULT_OPTS;
