import path from 'path'
import 'babel-polyfill'
import IPFS from 'ipfs'
import pify from 'pify'
import { readdirDeep, rimraf } from './fs-util.js'
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

async function createBufferFromPath (pfs, path) {
  // TODO: don't buffer the file contents in memory
  const fileContents = await pfs.readFile(path)
  return ipfs.types.Buffer.from(fileContents)
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
  console.log('Clone dir ', cloneDir)
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
  const fileSpecs = await Promise.all(files.map(createFileSpec))

  console.log(fileSpecs)

  log('Adding files to ipfs')
  async function createFileSpec (file) {
    const buffer = await createBufferFromPath(pfs, file)
    return { path: file, content: buffer }
  }
  const results = await ipfs.add(fileSpecs)

  log('Done')
  console.log(results)
})
