# hexo-whatever [![Build Status](https://travis-ci.org/akfish/hexo-whatever.svg?branch=master)](https://travis-ci.org/akfish/hexo-whatever)

Process custom source `source/_whatevers` into `hexo.locals.whatevers`.

## Usage

### 1. Install:

```bash
npm install --save hexo-whatever
```

### 2. (Optional) Define a model:

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

### 3. Register source type in some scripts (another extension or theme scripts):

* Use custom model:

```js
import {Project} from "./model";

hexo.whatever.register("project", Project);
```

* Use Hexo built-in model (identified by name string):

```js
hexo.whatever.register("myPost", "Post");
```

See also:
- [Hexo built in models](https://github.com/hexojs/hexo/tree/master/lib/models)

Registering a model with name `"foo"` does the following:
1. Hexo will process sources in `source/_foos`
2. After each source is processed, filter `after_process_foo` will be executed for more custom processing
3. All processed data will be available in `hexo.locals.foos`
4. When accessing `foo.path`, filter `foo_permalink` will be executed to determine the permalink.

### 4. (Optional) register to `after_process_project` filter to do some custom processing:

```js
hexo.extend.filter.register('process_project', (data, opts) => {
  // Wrong: you should not mutate data directly
  // data.foo = "bar";
  // Return additional data
  let delta = { foo: "bar"; }
  return delta;
})
```

### 5. Put source files in `source/_projects`

### 6. Consume processed data (in other extensions)

```js
doSomethingWith(hexo.locals.projects);
```

### 7. Generate index and item pages

When calling `register`, a thrid `opts` argument can be passed along. Its default options are:

```js
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
      permalink: ":source/",
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
```

In this example, with default options, index pages `//yoursite.com/projects/index.html` with paging will be generated.
As well as `//yousite.com/projects/project_title/` for each projects.
