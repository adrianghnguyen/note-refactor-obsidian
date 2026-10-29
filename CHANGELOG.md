# Changelog

## [Unreleased]

## 1.9.0-beta.1

### Added

- Settings toggle **Lowercase new note titles**. When on, newly created note file names are forced to lowercase. Note content is unchanged. Off by default.

### Fixed

- Emit native ES2018 classes instead of ES5 `__extends` / `_super.call(this)` so the plugin loads on Obsidian 1.15, where `Plugin` is a native class.
