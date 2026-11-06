import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'
import { transformAsync } from '@babel/core'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

// O chunk de polyfills do plugin-legacy sai com arrow functions, que o Safari 9 não lê.
function polyfillsEs5() {
  const renomeados = []
  return {
    name: 'polyfills-es5',
    enforce: 'post',
    writeBundle(opcoes) {
      const arquivo = join(opcoes.dir, 'index.html')
      if (!existsSync(arquivo)) return
      let html = readFileSync(arquivo, 'utf8')
      for (const [antigo, novo] of renomeados) html = html.split(antigo).join(novo)
      writeFileSync(arquivo, html)
    },
    generateBundle: {
      order: 'post',
      async handler(_, bundle) {
        for (const chunk of Object.values(bundle)) {
          if (chunk.type !== 'chunk' || !chunk.fileName.includes('polyfills-legacy')) continue
          const resultado = await transformAsync(chunk.code, {
            babelrc: false,
            configFile: false,
            compact: true,
            sourceType: 'script',
            presets: [['@babel/preset-env', { targets: { ios: '8', safari: '8' }, modules: false }]],
          })
          chunk.code = resultado.code
          const nomeAntigo = chunk.fileName
          chunk.fileName = nomeAntigo.replace('polyfills-legacy-', 'polyfills-legacy-es5-')
          renomeados.push([nomeAntigo, chunk.fileName])
        }
      },
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    polyfillsEs5(),
    legacy({
      targets: ['defaults', 'iOS >= 8', 'Safari >= 8'],
    }),
  ],
  build: {
    minify: 'terser',
  },
})
