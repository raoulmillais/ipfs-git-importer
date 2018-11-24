import path from 'path'
import 'babel-polyfill'
import IPFS from 'ipfs'
import pify from 'pify'
const git = require('isomorphic-git')

// Config
const cloneDir = '/test-git'
const remoteUrl = 'https://github.com/raoulmillais/history-check-test-repo'

// IPFS node setup
const node = new IPFS({ repo: String(Math.random() + Date.now()) })

// UI elements
const status = document.getElementById('status')
const output = document.getElementById('output')

// Init
output.textContent = ''

function log (txt) {
  console.info(txt)
  output.textContent += `${txt.trim()}\n`
}

async function rimraf (pfs, dir) {
  try {
    await pfs.stat(dir)
  } catch (e) {
    log(`${dir} does not exist`)
    return
  }

  const entries = await pfs.readdir(dir)
  const entryPaths = entries.map((entry) => { return path.join(dir, entry) })

  for (const entryPath of entryPaths) {
    const entryStats = await pfs.lstat(entryPath)
    if (entryStats.isDirectory()) {
      await rimraf(pfs, entryPath)
    } else {
      log(`Deleting ${entryPath}`)
      await pfs.unlink(entryPath)
    }
  }

  log(`Deleting directory ${dir}`)
  try {
    await pfs.rmdir(dir)
  } catch (e) {
    console.error('Error deleting directory', dir)
    throw e
  }
}

node.on('ready', async () => {
  status.innerText = 'Connected to IPFS :)'

  const version = await node.version()

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
})
