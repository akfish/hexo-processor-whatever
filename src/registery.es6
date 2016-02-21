import Processor from "./processor";

const {Schema} = require('warehouse')

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
    // Check model type
    if (!(typeof model === 'object' && model instanceof Schema)) {
      throw new TypeError(`[Whatever] Model for '${name}' is not an instance of wharehouse schema`);
    }
    let processor = this._processors[name] = new Processor(hexo, name, model, opts);
    processor.register();
  }
  get(name) {
    return this._processors[name];
  }
}
