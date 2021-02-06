# 入门packages-monorepo，搭建属于你的组件库

+ 本文记录如何创建一个基于[Lerna](https://lerna.js.org/)(多个软件包集成的包版本控制工具)管理的多包仓库；
+ 仓库模板将采用 [vue@next](https://www.npmjs.com/package/vue/v/3.0.5)，[typescript@latest](https://www.npmjs.com/package/typescript)，[rollup](https://rollupjs.org/guide/en/)，[vite@beta 2.0.0](https://www.npmjs.com/package/vite)作为dev-server，[vitepress](https://vitepress.vuejs.org/)作为docs文档开发，[commitizen](https://www.npmjs.com/package/commitizen)规范化提交和changelog；
+ 仓库将预配置好eslint和prettier作为代码风格统一，使用jest作为单元测试工具；
+ 目标是构建一个现代的、易于管理的，流程化的组件库。

## 概要

每一个部分以第x部分开头，主要内容如下，按需食用，此外，每一部分都会涉及到其他一些仓库，欢迎评论探讨：

+ 第一部分 **lerna**的大体认识和项目结构组织；
+ 第二部分 关键打包工具和插件的介绍以及使用；
+ 第三部分 文件结构和**rollup**的配置；

+ 第四部分 谈谈**docs**怎么写；

## 第一部分 认识lerna和项目主体结构搭建

### 什么是lerna？为什么用lerna？

> A tool for managing JavaScript projects with multiple packages

**是什么**：lerna是多个包于一体的项目管理工具，可以用简单的命令行控制多个包的版本与发布。一般用于大型项目，并且项目里有多个库可以单独打包使用，比如说[vue 3.0](https://github.com/vuejs/vue-next)，将compilar， dom以及runtime等的包置于packages下统一管理。虽然vue-next仓库没有直接使用lerna，但是项目结构的优雅足够拿来作为代表。[vite](https://github.com/vitejs/vite)早起并没有采用这个模式，后面重构为这种结构，也能说明目前这种项目管理方式是非常不错的。

**为什么用**：lerna内置的命令行可以控制所有仓库的依赖包版本保持一致，可以在git log 发生更改的时候提示各个包的异常，避免包之间发生混乱；做了一些命令行的糖，可以同时操作所有的仓库，比较方便；可以通过命令行将仓库内部之间快速连接，便于开发，参考**npm link**或者yarn link......

lerna只是一种管理项目的概念，并不一定非要安装lerna作为管理工具，喜欢折腾的朋友完全可以自己创建一个这样的结构。这种先进的管理模式早已被[Vuetify](https://vuetifyjs.com/en/getting-started/contributing/#local-development)，[Babel](https://github.com/babel/babel/blob/master/lerna.json)， [create-react-app](https://github.com/facebook/create-react-app)等采用，请把，合理打在公屏上。

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

[useWorkspace](https://classic.yarnpkg.com/blog/2017/08/02/introducing-workspaces/) 出自于yarn，开启工作区后，不再是每个仓库下都有一个各自的node_modules，而是在最顶层会有一个大家共用的node_modules，一般我们通过yarn 的 `workspaces` 或者`-W`来使用工作区包的管理，lerna包装了这一切。

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

+ **rollup-plugin-typescript2** [jump](https://www.npmjs.com/package/rollup-plugin-typescript2)：fork 自**rollup-plugin-typescript**（已经停止维护并永久迁移至新仓库**@rollup/plugin-typescript**），相比于官方仓库，它更慢了，但是更强了，typescript2额外地提供了语法提示和语义诊断

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

所以，了解了这些，就可以根据我们的需要填加和配置打包了。

首先，作为一个库，要支持全量引入，比如`import elvesform "elves"`，也要支持单独引入某个组件`import { Button } from "elves"`， 所以我们需要同时支持cjs 和 esm打包，这样就可以支持自动tree-shaking了。

## 第三部分 配置文件结构和rollup打包

由于cjs是要支持模块化引入的，所以cjs打包的入口是不同于全量打包的入口的，常规的文件结构如下：

```js
elves
  ├─ src
     ├─ components
     │   ├─ Button.ts
     │   └─ index.ts
     ├─ cjs.ts   // 打包cjs入口
     └─ index.ts // 打包umd格式入口
  ├─ package.josn
  └─ README.md
```

