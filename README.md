# genapp

A customizable generator application using fgen.

You can use genapp to generate project structures, files, and all sorts of templates. It's easy to use, and it's customizable. E.g. you can create a bundle (set of templates) for Node.js projects, and a bundle for Java projects, etc.

genapp is bundled with a `node` bundle for Node.js projects, see the [Quick Examples](#quick-examples) section.

## Installation

```bash
$ [sudo] npm install genapp -g
```

## Quick Examples

To generate a new Node.js project, you can do:

```bash
# generate in the current directory.
gen node

# generate myproj.
gen node -o myproj
```

To generate sub-bundles of the `node` bundle, you can do:

```bash
# generate the server sub-bundle in the current directory.
gen node server

# generate the server sub-bundle to folder servers.
gen node server -o servers
```

## Usage

The `node` bundle that comes with genapp has nothing special, you can create your own bundle just like the `node` one by following a set of rules.

First, you have to know that there is a configuration file named `.genappconfig` that you can have in your home folder, in it, you can specify all the `root` folders in where a set of bundles are found. Take a look at an sample `.genappconfig`:

```json
{
  "roots": [
    "~/projects/templates/",
    "~/java/projects/templates/"
  ]
}
```

In this sample config, we have 2 roots, each of them can contain bundles. e.g. we may have the following 2 folders in _~/projects/templates/_:

```
csharp
node
```

This means, we have 2 bundles, a _csharp_ bundle and a _node_ bundle. Note that root folders are prioritized, those are placed on the top take precedence over those below them. And the built-in bundles' root is just appended to your roots, making bundles within it easily overridden by your own bundles. So, the _node_ bundle in _~/projects/templates/_ will override the built-in `node` bundle.

> NOTE: Folders starting with double underscores are ignored by genapp, so folders with names like *__async* are not treated like bundles.

Within each bundle, you place all the templates that you want to generate. We use [mustache](http://mustache.github.com) based templates. A bundle can also contain sub-bundles, and sub-bundles can contain sub-bundles, and so on.

> NOTE: `___` folder within a bundle is especial, it is the sub-bundles' root of the current bundle. It doesn't get generated.

Alongside the bundle folder, you place a file named _[bundle].js_, like this:

```
java
java.js
csharp
csharp.js
node
node.js
```

This js file defines the context for the bundle and how to get the values for the context during template rendering process. To understand how it works, you can refer to the built-in `node` bundle's [implementation](https://github.com/sethyuan/genapp/tree/master/bundles).

## License

(The MIT License)

Copyright (c) 2013 Seth Yuan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
