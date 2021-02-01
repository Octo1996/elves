# 入门packages-monorepo，搭建属于你的组件库

+ 本文记录如何创建一个基于[Lerna](https://lerna.js.org/)(多个软件包集成的包版本控制工具)管理的多包仓库；
+ 仓库模板将采用 [vue@next](https://www.npmjs.com/package/vue/v/3.0.5)，[typescript@latest](https://www.npmjs.com/package/typescript)，[rollup](https://rollupjs.org/guide/en/)，[vite@beta 2.0.0](https://www.npmjs.com/package/vite)作为dev-server，[vitepress](https://vitepress.vuejs.org/)作为docs文档开发，[commitizen](https://www.npmjs.com/package/commitizen)规范化提交和changelog；
+ 仓库将预配置好eslint和prettier作为代码风格统一，使用jest作为单元测试工具；
+ 目标是构建一个现代的、易于管理的，流程化的组件库。

## 概要

首先，为啥要写一篇这个文章？第一，我要积淀我的知识；第二，现阶段网上相关文章比较少，过着某些已经过时不太适合我；第三，上一个号注销了血亏，重新升级，赚点赞和评论升个级；第五，我要写ui库了，但是基石非常重要，希望广大掘友能提点一些建议，让我能更好的产出一个UI库。

每一个部分以第x部分开头，主要内容如下，按需食用，此外，每一部分都会涉及到其他一些仓库的评价，欢迎评论探讨：

+ 第一部分 **lerna**的大体认识和项目结构组织；
+ 第二部分 关键打包工具的介绍和使用；
+ 第三部分 **rollup**的配置；

+ 第四部分 谈谈**docs**怎么写；
+ 第五部分 番外以及预告（我要写ui库了）；

## 第一部分 认识lerna和项目主体结构搭建

### 什么是lerna？为什么用lerna？

> A tool for managing JavaScript projects with multiple packages

**是什么**：lerna是多个包于一体的项目管理工具，可以用简单的命令行控制多个包（一般是有关联关系）的版本与发布。一般用于大型项目，并且项目里有多个库可以单独打包使用，比如说[vue 3.0](https://github.com/vuejs/vue-next)，将compilar， dom以及runtime等的包置于packages下统一管理。虽然vue-next仓库没有直接使用lerna，但是项目结构的优雅足够拿来作为代表。[vite](https://github.com/vitejs/vite)早起并没有采用这个模式，后面重构为这种结构，也能说明目前这种项目管理方式是非常不错的。

**为什么用**：lerna内置的命令行可以控制所有仓库的依赖包版本保持一致，可以在git log 发生更改的时候提示各个包的异常，避免包之间发生混乱；做了一些npm命令行的糖（当然，也有一些git的），可以同时操作所有的仓库，比较方便；可以通过命令行将仓库内部之间快速连接，便于开发，参考**npm link**或者yarn link......

lerna只是一种管理项目的概念，并不一定非要安装lerna作为管理工具，喜欢折腾的朋友完全可以自己创建一个这样的结构。这种先进的管理模式已经被[Vuetify](https://vuetifyjs.com/en/getting-started/contributing/#local-development)，[Babel](https://github.com/babel/babel/blob/master/lerna.json)， [create-react-app](https://github.com/facebook/create-react-app)等采用，请把，合理打在公屏上。

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

至此，主要目录结构看起来像：

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

+ 推荐参考官方[README](https://github.com/lerna/lerna#lernajson)，这里只说明偏常用的一些地方（其实也没什么特别的）

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

  比如，docs 作为ui库的文档，肯定是要用ui库来写playground，所以，我们将ui库（这里是elves）安装位docs的依赖

  ```bash
  
  ```

  