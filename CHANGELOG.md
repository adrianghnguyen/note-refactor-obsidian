# Changelog

## [Unreleased]

### Added

- Optional setting to force new note file titles to lowercase when creating a note.

### Fixed

- Emit native ES2018 classes instead of ES5 `__extends` / `_super.call(this)` so the plugin loads on Obsidian 1.15, where `Plugin` is a native class.
