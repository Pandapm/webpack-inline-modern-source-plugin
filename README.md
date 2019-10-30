# webpack-inline-modern-source-plugin

[![npm version](https://badge.fury.io/js/webpack-inline-modern-source-plugin.svg)](https://badge.fury.io/js/html-webpack-inline-source-plugin)

An extension plugin for the [webpack](http://webpack.github.io) plugin [html-webpack-plugin](https://github.com/ampedandwired/html-webpack-plugin).It allows you to embed css and ES6 or legacy-js sources inline as you choose.

If you don't use `modern mode`, [html-webpack-inline-source-plugin](https://github.com/DustinJackson/html-webpack-inline-source-plugin) maybe a better choice.

## Installation

Required node 6 or higher.

Install:

```shell
$ npm install --save-dev webpack-inline-modern-source-plugin
```

## Basic Usage

Require the plugin in your webpack config:

```javascript
var WebpackInlineMordernSourcePlugin = require('webpack-inline-modern-source-plugin');
```

Add the plugin to your webpack config:

```javascript
plugins: [
  new HtmlWebpackPlugin({
      inlineSource: '.(js|css)$'
  }),
  new WebpackInlineMordernSourcePlugin()
]  
```

It will embed all js and css sources inline. If you want to embed modern chunks or legacy chunks only, use `inlineLegacy` or `inlineModern`:

```javascript
plugins: [
  new HtmlWebpackPlugin({
      inlineSource: '.(js|css)$',
      inlineLegacy: false, // default value: true
      inlineModern: true, // default value: true
  }),
  new WebpackInlineMordernSourcePlugin()
]  
```
