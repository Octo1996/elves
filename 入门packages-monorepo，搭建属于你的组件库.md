# 入门packages-monorepo，搭建属于你的组件库

## 概要

每一个部分以第x部分开头，主要内容如下，按需食用，此外，每一部分都会涉及到其他一些仓库，欢迎评论探讨：

+ 第一部分 **lerna**的大体认识和项目结构组织；
+ 第二部分 关键打包工具和插件的介绍以及使用；
+ 第三部分 文件结构和**rollup**的配置；


## 第一部分 认识lerna和项目主体结构搭建

### 什么是lerna？为什么用lerna？

> A tool for managing JavaScript projects with multiple packages

**是什么**：lerna是多个包于一体的项目管理工具，可以用简单的命令行控制多个包的版本与发布。一般用于大型项目，并且项目里有多个库可以单独打包使用，比如说[vue 3.0](https://github.com/vuejs/vue-next)，将compilar， dom以及runtime等的包置于packages下统一管理。虽然vue-next仓库没有直接使用lerna，但是项目结构的优雅足够拿来作为代表。[vite](https://github.com/vitejs/vite)早期并没有采用这个模式，后面重构为这种结构，也能说明目前这种项目管理方式是非常不错的。

**为什么用**：lerna内置的命令行可以控制所有仓库的依赖包版本保持一致，可以在git log 发生更改的时候提示各个包的异常，避免包之间发生混乱；做了一些命令行的糖，可以同时操作所有的仓库，比较方便；可以通过命令行将仓库内部之间快速连接，便于开发，参考**npm link**或者yarn link......

一切源自[yarn workspaces](https://yarnpkg.com/features/workspaces#gatsby-focus-wrapper)，lerna只是一种管理项目的概念，并不一定非要安装lerna作为管理工具，喜欢折腾的朋友完全可以自己创建一个这样的结构。这种先进的管理模式早已被[Vuetify](https://vuetifyjs.com/en/getting-started/contributing/#local-development)，[Babel](https://github.com/babel/babel/blob/master/lerna.json)， [create-react-app](https://github.com/facebook/create-react-app)等采用，请把，合理打在公屏上。

### 安装，使用lerna

首先，我们先创建并初始化一个npm仓库，然后安装lerna

```bash
# 初始化为npm仓库，创建一点目录结构
npm init -y
# 使用yarn或者npm安装lerna，我推荐使用yarn
yarn add lerna -D
# 初始化lerna仓库，并按需要修改配置
# 可选参数 --independent/-i，是否各个子仓库的版本号独立发布，使用时会依次询问
# 本次目的是创建UI库，实际上只有一个UI库作为npm发布，所以采用独立控制
npx lerna init -i
# 先添加docs和ui库（我已名称elves为例），-y 是npm参数
# 指令 create 会在packages下创建指定名称的npm仓库
npx lerna create docs -y
```

至此，主要目录结构看起来像（你需要按照自己的要求修改LICENSE和package.json里的信息）：

```
packages
  ├── docs
  │    ├─ package.josn
  │    └─ README.md
  ├── elves
  │    ├─ package.josn
  │    └─ README.md
  ├── lerna.json
  ├── LICENSE
  └── package.json
```

#### lerna配置文件写了什么

+ 推荐参考官方[README](https://github.com/lerna/lerna#lernajson)文档，这里只说明偏常用的一些地方（其实也没什么特别的）

```json
{
    version: "independent", //版本控制，如果是版本号，子仓库的所有版本号都会跟着改
    npmClient: "yarn", //使用什么工具来安装npm包，将影响lerna add 等指令
    command: {
        publish: {}, // 预设置发布时的提交信息，如 message: "chore(release): publish %s"
        bootstrap: {} // 里面的参数将直接和npm/yarn install挂钩，如果一般的npm install不能满足你，那，在使用bootstrap的时候要注意指令是继承npm的关系
    },
    packages: ["packages/*"], // 默认路径，你可以修改你的配置规则，比如"packages/components-*"等，这里实际上非常灵活，可以忽略里面一些api-gen 类似的内部包
    useWorkspace: true // 如果使用过yarn workspace的朋友应该不会陌生
}
```

[useWorkspace](https://classic.yarnpkg.com/blog/2017/08/02/introducing-workspaces/) 出自于yarn，开启工作区后，不再是每个仓库下都有一个各自的node_modules，而是在最顶层会有一个大家共用的node_modules，一般我们通过yarn 的 `workspaces` 或者`-W`来使用工作区包的管理，lerna包装了这一切。不然你说凭什么用yarn。

作为ui库我非常推荐使用，因为当你写文档的时候，相关的库有非常大的重合。比如，我现在要给docs和elves都安装上vue 3.0：

+ 先修改配置

```diff
//package.json
- private: false,
+ private: true, // 注意yarn 的workspace只能工作在私有仓库下
+ "workspaces": [
+   "packages/*"
+ ]

//lerna.json
 {
   "packages": [
     "packages/*"
   ],
+  "useWorkspaces": true,
   "version": "independent"
 }

```

+ 添加vue 3.0

```bash
# 在根目录使用
npx lerna add vue@next

# 如果忘记设置npmClient，忘了配置workspace 用npm安装了包，可以使用lerna clean
rm -rf ./node_modules/*
npx lerna clean

# 如果清理后的package.json里已经有安装信息可以使用lerna bootstrap重新安装即可，lerna会重新按照npmClient的设置进行安装
```

+ 包之间的引用

  比如，docs 作为ui库的文档，肯定是要用ui库来写playground，所以，我们将ui库（这里是elves）安装为docs的依赖，安装外部远程依赖也是一样的，如果想安装lodash并且仅用于docs，和下面的命令行相比，除了包名之外，其他都是一样的：

  ```bash
  # 当安装某个包的时候，使用--scope可以让包仅安装到对仓库的依赖下
  npx lerna add elves --scope=docs
  ```
```
  
  ```diff
  // docs/package.json
  {
    name: "docs",
    dependencies: {
  +   elves: "^0.0.1"
      vue: "^3.0.5"
    }
  }
```

  另外，`lerna link` 也是可以用的，这个命令可以使内部的包形成相互之间的引用关系，像是各个项目里使用了`yarn link`一样。

## 第二部分 打包工具和插件介绍

此monorepo是基于rollup打包的，所以插件都是选用的rollup-plugin：

+ **rollup-plugin-typescript2** [jump](https://www.npmjs.com/package/rollup-plugin-typescript2)：fork 自**rollup-plugin-typescript**（已经停止维护并永久迁移至新仓库**@rollup/plugin-typescript**），相比于官方仓库，它更慢了，但是更强了，typescript2额外地提供了语法提示和语义诊断，我们将用来打包ts文件并生成类型声明文件

  > This version is somewhat slower than original, but it will print out typescript syntactic and semantic diagnostic messages (the main reason for using typescript after all).

+ **rollup-plugin-postcss** [jump](https://www.npmjs.com/package/rollup-plugin-postcss)：PostCSS 我称他为万能的神，在我最头疼css兼容性的时候是他拯救了我，同时，postcss支持很多非常有意思的css处理插件，[TailwindCSS](https://tailwindcss.com/docs/adding-base-styles)是其一，因为从头开始写一个主题系统，写一个Grid系统太麻烦了，我们将站在巨人的肩膀上写库，tailwind自带PuregeCSS，自动处理删减冗余的css，酸爽。

+ [TailwindCSS](https://tailwindcss.com/docs/adding-base-styles) 是一个工具优先的PostCSS插件集合，这意味着可以和其他任何PostCSS插件配合使用。同时，内置了很多组合css的指令，提高css的综合利用；Tailwind自带了各种css的预处理插件，写class类名就能编写精美的样式非常方便，更多的内容，点击移步至官网查看

+ **@rollup/plugin-replace** [jump](https://www.npmjs.com/package/@rollup/plugin-replace)：这个工具非常有用，替换打包文件内的字符串，能干啥？比如你在代码里写了 `__bundle_env__ === "production"`， 那么可以使用这个工具，把`__bundle_env__`的值更换成任意你想要的值，比如development， production等，没错，类似webpack的cross-env，但是更强，所有你想替换的字符串，都可以使用这个工具替换。

### 什么是'esm', 'cjs', 'umd'

设么是打包？至今为止，打包的目的都是为了开发时方便，编译时能将各个模块的文件组装到一起，公用模块的同时，不会产生命名冲突，即解决模块和作用域问题。

+ **cjs**：cjs 是 **Common js**的缩写，目前主要使用在nodejs（如果不配置esm模式的话）。看一眼下面的代码应该就很熟悉了。cjs加载时同步的，所以可以在任何地方引用模块并使用；cjs的引入是**copy**，所以，导出的对象是拷贝的，不会影响原对象，而为esmodule会；cjs不能在浏览器使用，需要转化；

```js
//importing 
const doSomething = require('./doSomething.js'); 

//exporting
module.exports = function doSomething(n) {
  // do something
}
```

+ **amd**：**Asynchronous Module Definition**，异步加载模块，就像cjs适用node一样，amd适用前端，关于细节，可以查看[这篇博客](https://tagneto.blogspot.com/2011/04/on-inventing-js-module-formats-and.html)。

```js
define(['module1', 'module2'], function (module1, module2) {
    //定义模块，然后再导出
    return function () {};
});
```



+ **umd**：**Universal Module Definition**，代表通用模块定义，就是前后端通用，主要用于工具类，算法类库；通过闭包函数处理局部作用域，参数传递模块，入口出口鲜明；使用amd时，不易于rollup或webpack配合打包，一般用于备用（一般谁手写这个）：

```js
(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define(["jquery", "underscore"], factory);
    } else if (typeof exports === "object") {
        module.exports = factory(require("jquery"), require("underscore"));
    } else {
        root.Requester = factory(root.$, root._);
    }
}(this, function ($, _) {
    var Requester = { // ... };

    return Requester;
}));
```

+ **esm**：现代的js的标准模块化解决方案，原生js需要在script上加`type = 'module'`。现代浏览器支持；拥有和CJS类似的写法，AMD格式的异步加载方式；使bundler易于tree-shaking等。

写起来是这样：

```js
import { foo, bar } from "./mylib"
//...
export function func1() {}
export function func2() {}
export default {}
```

除了使用 ES6 模块之外，Rollup 还静态分析代码中的 import，并将排除任何未实际使用的代码。

例如，在使用 CommonJS 时，*必须导入(import)完整的工具(tool)或库(library)对象*。

```js
// 使用 CommonJS 导入(import)完整的 utils 对象
var utils = require( 'utils' );
var query = 'Rollup';
// 使用 utils 对象的 ajax 方法
utils.ajax( 'https://api.example.com?search=' + query ).then( handleResponse );
```

但是在使用 ES6 模块时，无需导入整个 `utils` 对象，我们可以只导入(import)我们所需的 `ajax` 函数：

```js
// 使用 ES6 import 语句导入(import) ajax 函数
import { ajax } from 'utils';
var query = 'Rollup';
// 调用 ajax 函数
ajax( 'https://api.example.com?search=' + query ).then( handleResponse );
```

因为 Rollup 只引入最基本最精简代码，所以可以生成轻量、快速，以及低复杂度的 library 和应用程序。因为这种基于显式的 `import` 和 `export` 语句的方式，它远比「在编译后的输出代码中，简单地运行自动 minifier 检测未使用的变量」更有效。

所以，了解了这些，就可以根据我们的需要填加和配置打包了。

首先，作为一个库，要支持全量引入，比如`import elvesform "elves"`，也要支持单独引入某个组件`import { Button } from "elves"`， 所以我们需要写好导入导出，同时支持多种打包。这样就可以支持自动tree-shaking了和各种需要了。至于不同平台兼容性，我们都打包好就OK。

## 第三部分 配置文件结构和rollup打包

简单的文件结构如下（更多的工具代码只要引入就能进入sourcemap，就不需要在这里说明了）：

```js
elves
  ├─ src
  │  ├─ components
  │  │   ├─ EButton
  │  │   │   ├─ EButton.ts
  │  │   │   └─ index.ts
  │  │   └─ index.ts
  │  ├─ cjs.ts
  │  └─ index.ts
  ├─ package.josn
  └─ README.md
```

推荐的规范是：各个文件夹下的模块应该有一个index文件包含所有子模块的导出

### 从rollup.config.js开始

我从来不会推荐将插件的配置参数写在package.json文件里，那样会造成package.json文件过于臃肿，清理一个包都要滚来滚去非常麻烦。

rollup和webpack同样是打包工具，但是相比而言，rollup配置更加简洁，同时，在打包库的时候，代码体积总能比webpack小一点，对tree-shaking支持的非常不错。vue官方将打包工具更换为rollup，我们采用vite用作开发时playground。所以，

首先添加一个命令行解析工具[minimist](https://github.com/substack/minimist)，我们肯定不会直接使用命令行进行编译，所以，我们只需要使用`rollup -c`适用rollup.config.js 文件里的配置就好了：

```bash
# rollup -c 是 --config的缩写，在scripts里加入 执行代码 build: "rollup -c"即可
rollup -c
# -c 不加参数默认使用 rollup.config.js 文件，如果要区别开发环境和生产环境，或者其它自定义打包的话，可以改使用其他配置文件
rollup --config rollup.config.dev.js
```

+ rollup 比webpack配置简单，但是同样需要入口文件指定： `input: 'src/main.js'` 
+ 同时，在文件输出时，除了指定路径和文件名，还需要指定打包格式：

```js
  input: 'src/main.js',
  output: {
    file: 'bundle.js',
    format: 'cjs'
  },
```

+ 除了以上关键配置，就是**plugins**属性，选中合适的插件可以自定义打包、实现特殊的打包方式或者提升打包质量等，使用非常的"开箱即用"，默认配置即能解决基本需求：

```js
{
    plugins: [
    	babel(),
    	typescript()
	]
}
```

值得注意的是，typescript插件打包时会默认读取 当前目录下tsconfig.json的配置，并根据路径配置进行打包type定义，也可以传入配置进行覆盖，或者在没有配置文件时使用。

当你的写法足够完善和“esm”时，rollup已经能够完美的打包并分析你的依赖关系，甚至都不需要手动将vue进行排除。不过，当你使用了一些工具库，如lodash时，还是应该主动将其排除 `exclude: ["lodash", "time"]`

# 结语--自我吐槽--烂尾

其实到这里我觉得这片文章有些烂尾，因为个人觉得用不用lerna与否并不重要，rollup的配置也并不重要，monorepo只是一个管理项目的理念。

+ 第三部分只是一个简单的打包尝试，并没有解决所有问题；
+ 写到一半发现前端打包没啥好说的，配置都是一板一眼的，只要理解了关键点，其它的搜一下插件就能解决；
+ 马上过年了，最近这几天也没有假期，内心确实烦躁不安，这篇文章写的不好我自认，但凡评论吐槽我反驳一个字明年涨薪没我；
+ 打包是不想再写了，明年打算写一个ui库，名字都想好了，代码编写会参考vuetify Titan 和 bootstrap，设计规范会靠近fluentUi，以往明年能耐心的把文章沉淀起来
+ [仓库代码](https://github.com/Octo1996/elves) 在这里包括这边文章，作为UI库的敲门砖对我来说已经足够了，是时候开始下一步了。
+ 掘金和github都是新号，希望从此摆脱过去，一起加油吧。

最后，lerna虽然不错，但是，如果你使用的是yarn就没必要再使用lerna了，重复记忆新的功能反而多了一些限制，`yarn workspace`的概念后自己构建肯定是更好的。

**peace**

