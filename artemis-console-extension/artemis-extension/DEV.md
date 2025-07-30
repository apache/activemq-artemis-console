# Developer notes

Artemis Console Extension is a Java Maven module that uses [Frontend Maven Plugin][1] which packages Javascript application as Maven module used later by [Apache Artemis][2].

Everything besides the `pom.xml` is a [Javascript monorepository][3] containing the following:

* An Artemis Console itself - a Javascript application bundled using [Webpack][4]
* An Artemis Console plugin used by this console, but also published independently to [NPM][5], which can be consumed by other applications. This plugin is bundled using [tsup][6] which uses [esbuild][7] as actual bundler of TypeScript code and [Rollup][8] for TypeScript types generation.

## Dependencies

Artemis Console plugin (and application) depends on Hawtio because it is effectively a [Hawtio plugin][9]. That's why the most important dependency is:

    "@hawtio/react": "^1.10.0"

To keep compatibility with Hawtio, versions of [Patternfly][10] and [React][11] packages should be aligned.

To make it easier to maintain consistent dependencies between Hawtio (which can be treated as host for the plugins) and Artemis plugin (a plugin itself), the dependencies like Patternfly or React should be specified as peer dependencies here.

## Javascript tooling

It's worth following some guidelines in the fascinating world of JavaScript build tools. This distinction is very important:

* _libraries_ - packages published to NPM registry and consumable by other packages/applications
* _applications_ - final deployables that use other packages and which are not consumed further

This separation determines the _bundlers_ that should be used to change original code into distributed code.

When using _bundlers_ for libraries, we have to be careful, because the library packages will be consumed by projects using own configurations and own bundlers. That's why we use [tsup][6] = [esbuild][7] + [Rollup][8] for this task.

When using _bundlers_ for applications, we need to ensure that all dependencies are included (bundled) in most optimal way (chunking, tersing, ...). That's why we use [Webpack][4] for this task (which may be replaced by [Rspack][12] at some point).

## Project structure

We use [Javascript monorepository][3] for better separation of library and application code.

Top level `package.json` declares `workspaces` field and _child_ `package.json` contain specific dependencies and scripts.

We use `yarn` package manager and we can add dependencies to projects in a monorepo (_workspaces_) using:
```console
$ yarn workspace artemis-console-plugin add @hawtio/react
```

or simply:
```console
$ cd packages/artemis-console-plugin; yarn add @hawtio/react
```

However the recommended way is to use the `yarn workspace <workspace> add <dependency>` variant. The _classic_ one where we `cd` into a workspace usually works, but sometimes may cause problems with:
* top level `yarn.lock`
* nested `node_modules/` being created in given workspace (instead of _hoisting_ the dependency to monorepo root `node_modules/`).

## Project dependencies

[activemq-artemis-console Github repository](https://github.com/apache/activemq-artemis-console/) is a Maven project which ultimately builds a WAR archive to be used in [activemq-artemis](https://github.com/apache/activemq-artemis/).

Focusing on JavaScript only, artemis-extension is a monorepo, which contains:
* app: Application bundled by `webpack`
* packages/artemis-console-plugin: Library bundled by `tsup`

Adding Hawtio to the list, we have:

* `react`, `react-dom`, `react-router-dom`: NPM library packages from React
* `@patternfly/react-core` (and other `@patternfly/react-*` packages): NPM library packages which build on React and provide additional components - they depend on React using `peerDependencies` 
* `@hawtio/react`: NPM library package that provides React/Patternfly components and own API to build Hawtio applications
* `packages/artemis-console-plugin`: NPM library package that uses `@hawtio/react`, React itself and Patternfly
* `app`: Ultimate application that will be packaged into WAR. It is bundled using `webpack` and uses `@hawtio/react` + `packages/artemis-console-plugin` libraries

The most important product of [activemq-artemis-console Github repository](https://github.com/apache/activemq-artemis-console/) is the WAR archive and JavaScript application bundled by `webpack`, but additionally `packages/artemis-console-plugin` package itself should eventually be published to NPM.

There may be existing _applications_ that could use both `@hawtio/react` **and** `packages/artemis-console-plugin` to provide "Hawtio with Artemis support".

That's why it is important to know how to manage dependencies in JavaScript applications. There's some confusion about how to use `dependencies` and `peerDependencies`. I'd like to suggest one rule for determining which one to use:

> Should a dependency version be determined by my `package.json` or rather by other packages that use my library as dependency?

In this case, both `@hawtio/react` and `packages/artemis-console-plugin` are effectively _component libraries_ that work with React (and Patternfly) and ultimately it is the final _application_ that uses React, Patternfly **and** Hawtio + artemis libraries. So `react`, `react-dom`, etc.:
* should be in `peerDependencies` of `@hawtio/react` and `packages/artemis-console-plugin`
* should be in `dependencies` of _applications_ bundles with Webpack

`@hawtio/react` usage may be more tricky. However it is definitely a _dependency_ of an application. But because a webpack-bundled application may use both `@hawtio/react` and `packages/artemis-console-plugin`, `packages/artemis-console-plugin` should use `@hawtio/react` as _peer dependency_ to let the application decide on the version...

These are recommendations, not strict rules, but without using _peer dependencies_ it is important to strictly align versions between the packages.

## Version changes in `package.json`

With `yarn` we have a great tool to review updates to versions - both in `devDependencies` and `dependencies` fields.

Here's an example of updates, where we can choose what we want to change and what we should leave:

```console
$ yarn upgrade-interactive
 Press <up>/<down> to select packages.            Press <enter> to install.
 Press <left>/<right> to select versions.         Press <ctrl+c> to abort.

? Pick the packages you want to upgrade.          Current          Range            Latest

   @patternfly/react-charts -------------------- ◉ ^7.4.9 -------                  ◯ ^8.3.0 -------
   @patternfly/react-code-editor --------------- ◉ ^5.4.18 ------                  ◯ ^6.3.0 -------
   @patternfly/react-core ---------------------- ◉ ^5.4.14 ------                  ◯ ^6.3.0 -------
   @patternfly/react-icons --------------------- ◉ ^5.4.2 -------                  ◯ ^6.3.0 -------
   @patternfly/react-styles -------------------- ◉ ^5.4.1 -------                  ◯ ^6.3.0 -------
   @patternfly/react-table --------------------- ◉ ^5.4.16 ------                  ◯ ^6.3.0 -------
   @patternfly/react-tokens -------------------- ◉ ^5.4.1 -------                  ◯ ^6.3.0 -------
   @patternfly/react-topology ------------------ ◉ ^5.4.1 -------                  ◯ ^6.3.0 -------
   @swc/core ----------------------------------- ◯ ^1.12.14 ----- ◉ ^1.13.3 ------
   @testing-library/dom ------------------------ ◯ ^10.4.0 ------ ◉ ^10.4.1 ------
   @testing-library/jest-dom ------------------- ◯ ^6.6.3 ------- ◉ ^6.6.4 -------
   @types/node --------------------------------- ◯ ^24.0.14 ----- ◉ ^24.1.0 ------
   @types/react-dom ---------------------------- ◉ ^18.3.7 ------                  ◯ ^19.1.7 ------
   @types/react -------------------------------- ◉ ^18.3.23 -----                  ◯ ^19.1.9 ------
   jest-environment-jsdom ---------------------- ◯ ^30.0.4 ------ ◉ ^30.0.5 ------
   jest ---------------------------------------- ◯ ^30.0.4 ------ ◉ ^30.0.5 ------
   react-dom ----------------------------------- ◉ ^18.3.1 ------                  ◯ ^19.1.1 ------
   react-router-dom ---------------------------- ◉ ^6.30.1 ------                  ◯ ^7.7.1 -------
   react --------------------------------------- ◉ ^18.3.1 ------                  ◯ ^19.1.1 ------
 > webpack ------------------------------------- ◯ ^5.100.2 ----- ◉ ^5.101.0 -----
```

`yarn` highlights which version updates will match specified range and what is the actual latest version. This is very important for major version updates, because we may want to stay at React 18 or Patternfly 5.

However `yarn upgrade-interactive` is not good for updates in `resolutions` fields. However we can use some scripting. Run this command in `artemis-console-extension/artemis-extension` (top-level directory of NPM monorepo):

```console
$ for d in $(jq -r '.resolutions|keys[]' package.json); do echo "=== $d"; npm view $d versions --json | jq -r '.|last'; done
=== @babel/runtime
8.0.0-beta.1
=== @jolokia.js/simple
2.2.4
=== @typescript-eslint/eslint-plugin
8.38.0
=== @typescript-eslint/parser
8.38.0
=== axios
1.11.0
=== braces
3.0.3
=== caniuse-lite
1.0.30001731
...
```

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
5. This additional option is really handy, clear and transparent:
```console
$ yarn set version 4.9.1 --yarn-path
➤ YN0000: Downloading https://repo.yarnpkg.com/4.9.1/packages/yarnpkg-cli/bin/yarn.js
➤ YN0000: Saving the new release in .yarn/releases/yarn-4.9.1.cjs
➤ YN0000: Done in 0s 448ms
```
6. To check what's the latest version of yarn run:
```console
$ corepack up
Installing yarn@4.9.2 in the project...
...
```
7. `packageManager` field will be upgraded, but we also have to call proper `yarn set version <version> --yarn-path` to update `.yarnrc.yml`.

With `yarn set version 4.9.2 --yarn-path`:
* `packageManager` field is updated with selected version
* `yarnPath` field in `.yarnrc.yml` is updated to point to _downloaded_ version of Yarn which should be stored in SCM - by default it's `.yarn/releases/yarn-4.9.2.cjs` (for version 4.9.2)
* previous version of `.yarn/releases/yarn-*.cjs` will be removed
* `.yarn/releases/LICENSE-yarn.txt` will also be removed, so remember to restore it (and check if its content needs to be updated to match the licence information at the end of `.yarn/releases/yarn-4.9.2.cjs` file)

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
