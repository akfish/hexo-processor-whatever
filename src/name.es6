export default class Name {
  constructor(name) {
    let first = name[0],
      rest = name.substr(1);
    this._normalized = first.toLowerCase() + rest;
    this._titled = first.toUpperCase() + rest;
    this._plural = this._normalized + "s";
    this._dirPath = `_${this._plural}/`;
  }
  get normalized() { return this._normalized; }
  get titled() { return this._titled; }
  get plural() { return this._plural; }
  get dirPath() { return this._dirPath; }
}
