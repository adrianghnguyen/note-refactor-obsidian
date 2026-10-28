# Changelog

## [Unreleased]

### Fixed

- Emit native ES2018 classes instead of ES5 `__extends` / `_super.call(this)` so the plugin loads on Obsidian 1.15, where `Plugin` is a native class.
