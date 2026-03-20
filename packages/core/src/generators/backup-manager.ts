// packages/core/src/generators/backup-manager.ts
import { mkdir, copyFile, writeFile, rename } from 'fs/promises';
import { existsSync, statSync } from 'fs';
import { join, dirname } from 'path';

export interface BackupManifest {
  timestamp: string;
  fishi_version: string;
  files: { path: string; size: number }[];
}

export async function createBackup(
  targetDir: string,
  conflictingFiles: string[]
): Promise<string> {
  const now = new Date();
  const timestamp = now.toISOString().replace(/:/g, '-').replace(/\.\d+Z$/, '');
  const backupDir = join(targetDir, '.fishi', 'backup', timestamp);

  await mkdir(backupDir, { recursive: true });

  const manifestFiles: { path: string; size: number }[] = [];

  for (const relPath of conflictingFiles) {
    const srcPath = join(targetDir, relPath);
    const destPath = join(backupDir, relPath);

    if (existsSync(srcPath)) {
      await mkdir(dirname(destPath), { recursive: true });
      await copyFile(srcPath, destPath);
      const stat = statSync(srcPath);
      manifestFiles.push({ path: relPath, size: stat.size });
    }
  }

  const fishiVersion = '0.8.0';

  const manifest: BackupManifest = {
    timestamp: now.toISOString(),
    fishi_version: fishiVersion,
    files: manifestFiles,
  };

  // Atomic write: tmp → rename
  const manifestPath = join(backupDir, 'manifest.json');
  const tmpPath = manifestPath + '.tmp';
  await writeFile(tmpPath, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');
  await rename(tmpPath, manifestPath);

  return backupDir;
}
