import Promise from "bluebird";
import _ from "lodash";
import Name from "./name";
const models = require('hexo/lib/models');

export default class ModelExtender {
  constructor(hexo, name, model, opts) {
    this.hexo = hexo;
    this.name = new Name(name);
    this.model = model;
    this.opts = opts;

    this._validate();
    this._extend();
  }
  register() {
    let { hexo, name, model } = this;
    hexo.database.model(name.titled, model);
  }

  _validate() {
    let { hexo, name, model } = this;
    this._isHexoModel = false;
    // Built-in model
    if (typeof model === 'string') {
      let modelMaker = models[model];
      if (typeof modelMaker !== 'function') {
        throw new TypeError(`[Whatever] '${model}' is not a Hexo built-in model`)
      }
      model = modelMaker(hexo);
      this._isHexoModel = true;
    }
    // Check model type
    // Note: model instance of Schema will not do since Schema could come from
    //       diffrent packages
    if (!(typeof model === 'object' && model.constructor && model.constructor.name === 'Schema')) {
      throw new TypeError(`[Whatever] Model for '${name.normalized}' is not an instance of wharehouse schema`);
    }
    this.model = model;
  }
  _extend() {
    let { hexo: ctx, name, model } = this;

    // item.path
    model.virtual('path').get(function() {
      var path = ctx.execFilterSync(`${name.normalized}_permalink`, this);//, {context: ctx});
      return typeof path === 'string' ? path : '';
    });

    // Do not override built-in model
    if (this._isHexoModel) return;

    // remove tag & category reference before remove
    model.pre('remove', ({_id: post_id}) => ctx.model('PostCategory').remove({post_id}));
    model.pre('remove', ({_id: post_id}) => ctx.model('PostTag').remove({post_id}));

    let Post = models.Post(ctx);
    // Copy needed virtual paths
    [
      'permalink',
      'tags',
      'categories'
    ].forEach((name) => {
      let { getter } = Post.path(name);
      model.virtual(name).get(getter);
    })
    let methods = Post.methods;
    // Copy needed methods
    [
      'setTags',
      'setCategories'
    ].forEach((name) => {
      let fn = methods[name];
      model.method(name, fn);
    })
  }
}
