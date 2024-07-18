const webpack = require('webpack');

module.exports = function override(config, env) {
    // Polyfill for process
    config.plugins = (config.plugins || []).concat([
        new webpack.ProvidePlugin({
            process: 'process/browser.js',
        }),
    ]);

    // Extend existing fallback configuration to include 'vm'
    config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        vm: require.resolve('vm-browserify'), // Add this line
    };
    config.module.rules.push({
        test: /\.m?js$/,
        resolve: {
            fullySpecified: false, // This allows you to omit the extension when importing
        },
    });
    // Add custom module rule for source-map-loader


    return config;
};