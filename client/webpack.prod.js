const webpack = require('webpack');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'production',
  devtool: 'source-map',
  context: __dirname + '/src',
  entry: {
    main: './main.js',
    css: './app.scss',
  },

  output: {
    filename: '[name].min.js',
    chunkFilename: '[name].min.js',
    path: __dirname + '/dist',
    publicPath: '/dist/',
  },

  resolve: {
    // Add '.ts' and '.tsx' as resolvable extensions.
    extensions: ['.ts', '.tsx', '.js', '.json'],
  },

  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /(node_modules|bower_components)/,
        enforce: 'pre',
        loader: 'eslint-loader',
        options: {
          configFile: '.eslintrc',
        },
      },
      {
        test: /\.jsx?$/,
        // Don't exclude the node_modules directory, otherwise the error is:
        // [21:23:59] GulpUglifyError: unable to minify JavaScript
        // Caused by: SyntaxError: Unexpected token: name (e)
        // exclude: /(node_modules|bower_components)/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              babelrc: true,
            },
          },
        ],
      },
      // All files with a '.ts' or '.tsx' extension will be handled by
      // 'awesome-typescript-loader'.
      {
        test: /\.tsx?$/,
        loader: 'awesome-typescript-loader',
      },

      // All scss files
      {
        test: /\.s?css$/,
        use: [
          {
            loader: 'style-loader', // creates style nodes from JS strings
          },
          {
            loader: 'css-loader', // translates CSS into CommonJS
          },
          {
            loader: 'sass-loader', // compiles Sass to CSS
          },
        ],
      },
      {
        test: /\.svg$/,
        loader: 'svg-inline-loader',
      },
    ],
  },

  plugins: [
    new UglifyJSPlugin({
      sourceMap: true,
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    new CopyWebpackPlugin([
      {
        from: './assets/**/',
        to: '',
      },
      {
        from: './**/*.js',
        to: '[name].js',
      },
      {
        from: './**/index.html',
        to: 'index.html',
        transform: function(content) {
          return content
            .toString()
            .replace('src="./main.js"', 'src="./main.min.js"');
        },
      },
    ]),
  ],

  externals: {
    tslib: 'tslib',
  },
};
