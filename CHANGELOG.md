# Changelog

## [Unreleased]

### Added

- **Extract heading to existing note** command and editor right-click item. Pick a destination note; the heading is appended there and the source gets a wikilink using the same parent-bottom vs in-place rule as Extract heading. Extract heading still creates a new file.

## 1.9.0

### Added

- **Extract heading** command and editor right-click items. With **Place extract-heading link at parent bottom** on (default), the new wikilink is inserted directly under the parent heading (H3 → under its H2, before remaining H3 siblings; H2 → under its H1). Turn the option off, including from the context menu, to replace the heading in place like Obsidian’s Extract this heading. Settings describe this in the tab, not only on hover.
- Settings toggle **Lowercase new note titles**. When on, newly created note file names are forced to lowercase. Note content is unchanged. Off by default.

### Fixed

- Emit native ES2018 classes instead of ES5 `__extends` / `_super.call(this)` so the plugin loads on Obsidian 1.15, where `Plugin` is a native class.

## 1.9.0-beta.1

### Added

- Settings toggle **Lowercase new note titles**. When on, newly created note file names are forced to lowercase. Note content is unchanged. Off by default.

### Fixed

- Emit native ES2018 classes instead of ES5 `__extends` / `_super.call(this)` so the plugin loads on Obsidian 1.15, where `Plugin` is a native class.
