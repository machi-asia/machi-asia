import { readFileSync, writeFileSync } from 'node:fs'

const files = ['dist/index.js', 'dist/index.cjs']
for (const file of files) {
  let code = readFileSync(file, 'utf8')
  if (code.includes('./style.css')) continue
  const statement = file.endsWith('.cjs') ? 'require("./style.css");' : 'import "./style.css";'
  const lines = code.split('\n')
  if (lines[0] === '"use client";' || lines[0] === "'use client';") {
    lines.splice(1, 0, statement)
  } else {
    lines.unshift(statement)
  }
  writeFileSync(file, lines.join('\n'))
  console.log(`injected css import into ${file}`)
}
