const path = require('path');
const slash = require('slash');
const sourceMapUrl = require('source-map-url');
const escapeRegex = require('escape-string-regexp');

class WebpackInlineModernSourcePlugin {
    constructor(HtmlWebpackPlugin) {
        this.HtmlWebpackPlugin = HtmlWebpackPlugin;
    }

    apply(compiler) {
        compiler.hooks.compilation.tap('webpack-inline-modern-source-plugin', compilation => {
            compilation.hooks.htmlWebpackPluginAlterAssetTags.tapPromise('webpack-inline-modern-source-plugin', pluginData => {
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
        const body = [];
        const head = [];
        const regex = new RegExp(pattern);
        const {
            inlineLegacy = true,
            inlineModern = true
        } = pluginData.plugin.options;

        pluginData.head.forEach(tag => {
            head.push(this.task(compilation, regex, tag, inlineLegacy, inlineModern));
        });
        pluginData.body.forEach(tag => {
            body.push(this.task(compilation, regex, tag, inlineLegacy, inlineModern));
        });

        return {
            head,
            body,
            plugin: pluginData.plugin,
            outputName: pluginData.outputName
        };
    }

    task(compilation, regex, tag, inlineLegacy = true, inlineModern = true) {
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
            let removeTag = false;
            if (/-legacy/.test(tag.attributes.src) ) {
                if (inlineLegacy) {
                    attributes = {
                        type: 'text/javascript',
                        nomodule: true
                    };
                } else {
                    // remove script
                    removeTag = true;
                    tag = {}
                }
            } else if (inlineModern) {
                attributes = {
                    type: 'module'
                };
            }

            if (attributes && !removeTag) {
                assetUrl = tag.attributes.src;
                tag = {
                    tagName: 'script',
                    closeTag: true,
                    attributes
                };
            }
        }
        if (assetUrl) {
            const publicPrefix = compilation.outputOptions.publicPath || '';
            const assetName = path.posix.relative(publicPrefix, assetUrl);
            const asset = compilation.assets[assetName];
            const sourceCode = this.resolveSource(compilation, assetName, asset);
            tag.innerHTML = (tag.tagName === 'script') ? sourceCode.replace(/(<)(\/script>)/g, '\\x3C$2') : sourceCode;
        }
        return tag;
    }

    resolveSource(compilation, assetName, asset) {
        const source = (typeof asset.source() === 'string') ? asset.source() : asset.source().toString();
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
module.exports = WebpackInlineModernSourcePlugin;
