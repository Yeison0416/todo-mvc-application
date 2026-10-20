const { merge } = require('webpack-merge');

const commonConfig = require('./webpack.common.js');

module.exports = merge(commonConfig, {
    mode: 'development',

    devtool: 'inline-source-map',

    devServer: {
        watchFiles: './src/**/*.html',
        static: './dist',
        // Served through the nginx proxy from `docker compose` (dev-infra): nginx owns 8080, the dev server listens on 3001.
        port: 3001,
        open: 'http://localhost:8080',
        client: {
            // Port 0 makes the HMR client use the page's own origin, so the websocket goes through nginx.
            webSocketURL: { port: 0 },
        },
    },

    module: {
        rules: [
            {
                test: /\.s[ac]ss$/i,
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: { sourceMap: true },
                    },
                    {
                        loader: 'sass-loader',
                        options: { api: 'modern-compiler', sourceMap: true },
                    },
                ],
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
        ],
    },
});
