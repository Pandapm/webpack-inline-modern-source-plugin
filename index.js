'use strict';

import path from 'path';
import slash from 'slash';
import sourceMapUrl from 'source-map-url';
import escapeRegex from 'escape-string-regexp';

const getAssetByName = (assets, assetName) => {
    for (let key in assets) {
        if (assets.hasOwnProperty(key) && path.posix.relative('', key) === assetName) {
            return assets[key];
        }
    }
};

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
                        const pattern = options.inlineSource

                        pattern && resolve(this.run(compilation, pattern, pluginData));
                        resolve(pluginData);
                    });
                });
        });
    }

    run(compilation, pattern, pluginData) {
        const bodyTags = [];
        const headTags = [];
        const regex = new RegExp(pattern);
        const {
            filename,
            inlineLegacy = true,
            inlineModern = true
        } = pluginData.plugin.options;

        pluginData.headTags.forEach(tag => {
            headTags.push(this.task(compilation, regex, tag, filename, inlineLegacy, inlineModern));
        });
        pluginData.bodyTags.forEach(tag => {
            bodyTags.push(this.task(compilation, regex, tag, filename, inlineLegacy, inlineModern));
        });

        return {
            headTags,
            bodyTags,
            plugin: pluginData.plugin,
            outputName: pluginData.outputName
        };
    }

    task() {
        let assetUrl = '';

        // inline css
        if (tag.tagName === 'link' && regex.test(tag.attributes.href)) {
            assetUrl = tag.attributes.href;
            tag = {
                tagName: 'style',
                closeTag: true,
                attributes: {
                    type: 'text/css'
                }
            };
        } else if (tag.tagName === 'script' && tag.attributes && regex.test(tag.attributes.src)) {
            // inline js
            let attributes;
            if (/-legacy/.test(tag.attributes.src) && inlineLegacy) {
                attributes = {
                    type: 'text/javascript',
                    nomodule: true
                };
            } else if (tag.attributes.type === 'module' && inlineModern) {
                attributes = {
                    type: 'module'
                };
            }

            if (attributes) {
                assetUrl = tag.attributes.href;
                tag = {
                    tagName: 'script',
                    closeTag: true,
                    attributes
                };
            }
        }
        if (assetUrl) {
            const publicPrefix = compilation.outputOptions.publicPath || '';
            if (path.basename(filename) !== filename) {
                assetUrl = `${path.dirname(filename)}/${assetUrl}`;
            }
            const assetName = path.posix.relative(publicPrefix, assetUrl);
            const asset = getAssetByName(compilation.assets, assetName);
            const sourceCode = this.resolveSource(compilation, assetName, asset);
            tag.innerHTML = (tag.tagName === 'script') ? sourceCode.replace(/(<)(\/script>)/g, '\\x3C$2') : sourceCode;
        }
    }

    resolveSource(compilation, assetName, asset) {
        const source = (typeof asset.source() === string) ? asset.source() : asset.source().toString();
        const out = compilation.outputOptions;
        const assetPath = path.join(out.path, assetName);

        const mapUrlOriginal = sourceMapUrl.getFrom(source);
        if (!mapUrlOriginal || mapUrlOriginal.indexOf('data:') === 0 || mapUrlOriginal.indexOf('/') === 0) {
            return source;
        }

        const assetDir = path.dirname(assetPath);
        const mapPath = path.join(assetDir, mapUrlOriginal);
        const relativePath = path.relative(out.path, mapPath);
        const publicPath = out.publicPath || '';
        const regex = new RegExp(escapeRegex(mapUrlOriginal) + '(\\s*(?:\\*/)?\\s*$)');

        return source.replace(regex, (match, group) => slash(path.join(publicPath, relativePath)) + group);
    }
}
