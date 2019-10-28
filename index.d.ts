import { Plugin } from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';

declare class WebpackInlineModernSourcePlugin extends Plugin {
    constructor(htmlWebpackPlugin: HtmlWebpackPlugin)
}

declare namespace WebpackInlineModernSourcePlugin { }

export = WebpackInlineModernSourcePlugin;
