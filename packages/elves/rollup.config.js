import typescript from 'rollup-plugin-typescript2'
//import replace from '@rollup/plugin-replace'
import babel from '@rollup/plugin-babel'
//import postcss from 'rollup-plugin-postcss'
import minimist from 'minimist'

let formats = null

const argv = minimist(process.argv.slice(2))

if (argv.f) formats = [argv.f]
else {
  formats = ['cjs', 'umd', 'esm']
}

const baseConfig = {
  plugins: [
    typescript(),
  ],
}

function createConfig (format) {
  return {
    ...baseConfig,
    input: format === 'esm' ? 'src/index.ts' : 'src/cjs.ts',
    output: {
      file: `dist/elves.${format}.js`,
      name: 'elves',
    },
    plugins: [
      ...baseConfig.plugins,
      format !== 'esm' && babel({
        babelHelpers: 'runtime',
        extensions: ['.js', '.ts'],
        exclude: ['node_modules'],
        presets: [
          [
            '@babel/preset-env',
            {
              modules: false,
            },
          ],
        ],
        plugins: [
          [
            '@babel/plugin-transform-runtime',
            {
              useESModules: true,
            },
          ],
        ],
      }),
      //postcss({
      //
      //})
    ],
  }
}

const formatConfigs = formats.map(createConfig)
export default formatConfigs
