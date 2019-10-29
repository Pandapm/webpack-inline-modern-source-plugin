'use strict';

import path, { resolve } from 'path';
import slash  from 'slash';
import sourceMapUrl  from 'source-map-url';
import escapeRegex  from 'escape-string-regexp';

export default class WebpackInlineModernSourcePlugin {
    constructor(webpackPlugin) {
        this.webpackPlugin = webpackPlugin;
    }

    apply(compiler) {
        compiler.hooks.compilation.tap('webpack-inline-modern-source-plugin', compilation => {
            this.webpackPlugin
                .getHooks(compilation)
                .alterAssetTagGroups.tapPromise('webpack-inline-modern-source-plugin', pluginData => {
                    return new Promise((resolve, reject) => {
                        const options = pluginData.plugin.options || {};
                        const regex = options.inlineSource
    
                        regex && resolve(this.run(compilation, regex, pluginData));
                        resolve(pluginData);
                    });
                });
        });
    }

    run(compilation, regex, pluginData) {

    }

    singleTask() {

    }


}
