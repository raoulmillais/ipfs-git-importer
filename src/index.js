import 'babel-polyfill'
import IPFS from 'ipfs'
import pify from 'pify'
import { createPullStreamFromPath, readdirDeep, rimraf } from './fs-util.js'
const git = require('isomorphic-git')

// Config
const cloneDir = '/test-git'
const remoteUrl = 'https://github.com/raoulmillais/history-check-test-repo'

// IPFS node setup
const ipfs = window.ipfs = new IPFS({ repo: String(Math.random() + Date.now()) })
window.Buffer = Buffer

// UI elements
const status = document.getElementById('status')
const output = document.getElementById('output')

// Init
output.textContent = ''

function log (txt) {
  console.info(txt)
  output.textContent += `${txt.trim()}\n`
}

ipfs.on('ready', async () => {
  status.innerText = 'Connected to IPFS :)'

  const version = await ipfs.version()

  log(`The IPFS node version is ${version.version}`)

  const fsOptions = { fs: 'IndexedDB', options: {} }

  await pify(window.BrowserFS.configure)(fsOptions)

  const fs = window.BrowserFS.BFSRequire('fs')

  // expose pfs on window for debugging
  const pfs = window.pfs = pify(fs)

  log(`Deleting existing 'directory' ${cloneDir}`)
  await rimraf(pfs, cloneDir)

  log(`Creating 'directory' ${cloneDir} for git clone`)
  await pfs.mkdir(cloneDir)

  // Initialize isomorphic-git with our new file system
  git.plugins.set('fs', fs)
  log(`Cloning ${remoteUrl} into IndexedDB`)
  await git.clone({
    dir: cloneDir,
    corsProxy: 'https://cors.isomorphic-git.org',
    url: remoteUrl,
    noCheckout: true
  })

  log(`Clone complete`)

  log('Preparing to add files to ipfs')

  const files = await readdirDeep(pfs, cloneDir)

  const fileSpecs = files.map(file => ({
    path: file,
    content: createPullStreamFromPath(pfs, file)
  }))

  log('Adding files to ipfs')

  const results = await ipfs.files.add(fileSpecs)

  const rootHash = results.find(r => r.path === cloneDir.slice(1))
  log(`Done root hash is ${rootHash.hash}`)
})
