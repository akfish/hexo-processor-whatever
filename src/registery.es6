import Processor from "./processor";

const {Schema} = require('warehouse');
const models = require('hexo/lib/models');

const DEFAULT_OPTS = {
  generateIndex: true,
  generatePost: true,
  indexLayout: [],
}

export default class Registery {
  constructor(hexo) {
    this.hexo = hexo;
    this._processors = {};
  }
  register(name, model, opts) {
    let {hexo} = this;
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
    let processor = this._processors[name] = new Processor(hexo, name, model, opts);
    processor.register();
  }
  get(name) {
    return this._processors[name];
  }
}

Registery.DEFAULT_OPTS = DEFAULT_OPTS;
