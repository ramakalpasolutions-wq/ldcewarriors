// Copies the pdf.js worker into /public so the reader can load it.
// Runs on postinstall so it always matches the installed pdfjs-dist version.
const fs = require('fs')
const path = require('path')

const src = path.join(__dirname, '..', 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs')
const dest = path.join(__dirname, '..', 'public', 'pdf.worker.min.mjs')

if (fs.existsSync(src)) fs.copyFileSync(src, dest)
