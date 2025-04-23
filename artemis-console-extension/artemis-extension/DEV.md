# Developer notes

Artemis Console Extension is a Java Maven module that uses [Frontend Maven Plugin][1] which packages Javascript application as Maven module used later by [Apache Artemis][2].

Everything besides the `pom.xml` is a [Javascript monorepository][3] containing the following:

* An Artemis Console itself - a Javascript application bundled using [Webpack][4]
* An Artemis Console plugin used by this console, but also published independently to [NPM][5], which can be consumed by other applications. This plugin is bundled using [tsup][6] which uses [esbuild][7] as actual bundler of TypeScript code and [Rollup][8] for TypeScript types generation.

## Dependencies

Artemis Console plugin (and application) depends on Hawtio because it is effectively a [Hawtio plugin][9]. That's why the most important dependency is:

    "@hawtio/react": "^1.9.0"

To keep compatibility with Hawtio, versions of [Patternfly][10] and [React][11] packages should be aligned.

To make it easier to maintain consistent dependencies between Hawtio (which can be treated as host for the plugins) and Artemis plugin (a plugin itself), the dependencies like Patternfly or React should be specified as peer dependencies here.

## Javascript tooling

It's worth following some guidelines in the fascinating world of JavaScript build tools. Personally I find this distinction very important:

* _libraries_ - packages published to NPM registry and consumable by other packages/applications
* _applications_ - final deployables that use other packages which are not consumed further

This separation determines the _bundlers_ that should be used to change original code into distributed code.

When using _bundlers_ for libraries, we have to be careful, because the libraries package will be consumed by projects using own configurations and own bundlers. That's why we use [tsup][6] = [esbuild][7] + [Rollup][8] for this task.

When using _bundlers_ for applications, we need to ensure that all dependencies are included (bundled) in most optimal way (chunking, tersing, ...). That's why we use [Webpack][4] for this task (which may be replaced by [Rspack][12] at some point).

## Project structure

We use [Javascript monorepository][3] for better separation of library and application code.

Top level `package.json` declares `workspaces` field and _child_ `package.json` contain specific dependencies and scripts. Common dependencies are declared in parent `package.json`.

## Yarn package manager management

In the early days, developers were using `npm install -g` to install common JS tools available as NPM packages _globally_. This was the case with tools like Grunt, Gulp or Bower.

Ideally though, we should avoid global dependencies, because these make projects location dependent and developers may struggle from environment differences. Here's a quick guide into clean JS development from the perspective of tools.

1. The only global dependency should be (from the perspective of this project) `corepack`:
```console
$ npm list -g
/usr/local/lib
└── corepack@0.32.0
```
2. `corepack` is documented [at Yarn page][13] and [at Node.js page][14] and is (as of April 2025) the recommended way to deal with Node package managers as Yarn.
3. Main purpose of `corepack` is to find nearest `package.json` file and its `packageManager` field and delegate the package management to project-specific package manager.
4. `corepack use yarn@latest` is the way to add `packageManager` field to your `package.json` and later, `yarn set version x.y.z` can be used to update this version
5. I found it really handy, clear and transparent to use this additional option:
```console
$ yarn set version 4.9.1 --yarn-path
➤ YN0000: Downloading https://repo.yarnpkg.com/4.9.1/packages/yarnpkg-cli/bin/yarn.js
➤ YN0000: Saving the new release in .yarn/releases/yarn-4.9.1.cjs
➤ YN0000: Done in 0s 448ms
```

With `yarn set version 4.9.1 --yarn-path`:
* `packageManager` field is updated with selected version
* `yarnPath` field in `.yarnrc.yml` is updated to point to _downloaded_ version of Yarn which should be stored in SCM - by default it's `.yarn/releases/yarn-4.9.1.cjs` (for version 4.9.1)

----
[1]: https://github.com/eirslett/frontend-maven-plugin
[2]: https://activemq.apache.org/components/artemis
[3]: https://yarnpkg.com/features/workspaces
[4]: https://webpack.js.org/
[5]: https://www.npmjs.com/
[6]: https://tsup.egoist.dev/
[7]: https://github.com/evanw/esbuild
[8]: https://rollupjs.org/
[9]: https://hawt.io/docs/plugins.html
[10]: https://v5-archive.patternfly.org/
[11]: https://react.dev/
[12]: https://rspack.dev/
[13]: https://yarnpkg.com/corepack
[14]: https://github.com/nodejs/corepack
