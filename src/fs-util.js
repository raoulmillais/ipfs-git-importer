import path from 'path'

const log = console.log;

/*
export async function readdirDeep (fs, dir, allFiles = []) {
  const files = (await fs.readdir(dir))
  const fullFilePaths = files.map(file => path.join(dir, file))
  allFiles.push(...files)

  const stats = await Promise.all(fullFilePaths.map(fs.stat(fullFilePath))));
  const subDirectories = stats.filter(stat.isDirectory());

  await Promise.all(subDirectories.map(readdirDeep(fullFilePath,

  await Promise.all(fullFilePaths.map(async fullFilePath => {
    const stats = await fs.stat(fullFilePath)
    if (stats.isDirectory()) readdirDeep(fullFilePath, allFiles)
  }))

  return allFiles
}
*/

export async function readdirDeep (fs, dir, allFiles = [], allDirs = []) {
  const files = (await fs.readdir(dir)).map(f => path.join(dir, f))
  allFiles.push(...files)

  await Promise.all(files.map(async f => {
    const stats = await fs.stat(f)
    if (stats.isDirectory()) {
      allDirs.push(f)
      return readdirDeep(fs, f, allFiles, allDirs)
    }
  }))

  return allFiles.filter(x => allDirs.indexOf(x) < 0)
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
