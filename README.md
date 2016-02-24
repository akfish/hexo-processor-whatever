# hexo-processor-whatever

Process custom source `source/_whatevers` into `hexo.locals.whatevers`.

## Usage

### 1. Install:

```bash
npm install --save hexo-processor-whatever
```

### 2. Define a model:

```js
// model.es6
import {Schema} from "warehouse";

export default function(hexo) {
  let Project = new Schema();
  // Do configuration
  return Project;
}
```
See also:
- [warehouse](https://github.com/tommy351/warehouse)
- [Hexo built in models](https://github.com/hexojs/hexo/tree/master/lib/models)

### 3. Register source type in some scripts (another extension or theme scripts):

```js
import {Project} from "./model";

hexo.whatever.register("project", Project);
```

Registering a model with name `"foo"` does the following:
1. Hexo will process sources in `source/_foos`
2. After each source is processed, filter `process_foo` will be executed for more custom processing
3. All processed data will be available in `hexo.locals.foos`

### 4. (Optional) register to `process_project` filter to do some custom processing:

```js
hexo.extend.filter.register('process_project', (data, opts) => {
  data.foo = "bar";
  return data;
})
```

### 5. Put source files in `source/_projects`

### 6. Consume processed data (in other extensions)

```js
doSomethingWith(hexo.locals.projects);
```
