import pull from 'pull-stream'
import PullCont from 'pull-cont'
import path from 'path'

const log = console.log

export function createPullStreamFromPath (fs, path) {
  return PullCont(function pullFromFsStream (cb) {
    fs.readFile(path, (err, contents) => {
      if (err) return cb(err)

      return cb(null, pull.values(contents))
    })
  })
}

export async function readdirDeep (fs, dir, allFiles = [], allDirs = []) {
  const files = (await fs.readdir(dir)).map(file => path.join(dir, file))
  allFiles.push(...files)

  await Promise.all(files.map(async file => {
    const stats = await fs.stat(file)
    if (stats.isDirectory()) {
      allDirs.push(file)
      return readdirDeep(fs, file, allFiles, allDirs)
    }
  }))

  return allFiles.filter(file => allDirs.indexOf(file) < 0)
}

export async function rimraf (fs, dir) {
  try {
    await fs.stat(dir)
  } catch (e) {
    log(`${dir} does not exist`)
    return
  }

  const entries = await fs.readdir(dir)
  const entryPaths = entries.map((entry) => { return path.join(dir, entry) })

  for (const entryPath of entryPaths) {
    const entryStats = await fs.lstat(entryPath)
    if (entryStats.isDirectory()) {
      await rimraf(fs, entryPath)
    } else {
      log(`Deleting ${entryPath}`)
      await fs.unlink(entryPath)
    }
  }

  log(`Deleting directory ${dir}`)
  try {
    await fs.rmdir(dir)
  } catch (e) {
    console.error('Error deleting directory', dir)
    throw e
  }
}
