export { generateScaffold } from './scaffold';
export type { ScaffoldOptions, ScaffoldResult, ConflictResolution, FileResolutionMap } from './scaffold';
export { detectConflicts } from './conflict-detector';
export type { ConflictMap, ConflictCategory, FileConflict } from './conflict-detector';
export { createBackup } from './backup-manager';
export type { BackupManifest } from './backup-manager';
export { mergeClaudeMd, mergeSettingsJson, mergeMcpJson, mergeGitignore } from './merge-strategies';
