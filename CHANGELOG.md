# Changelog

## [Unreleased]

### Added

- **Extract heading** command and editor right-click items. With **Place extract-heading link at parent bottom** on (default), the new wikilink is inserted at the bottom of the parent heading (H3 → end of its H2; H2 → end of its H1). Turn the option off, including from the context menu, to replace the heading in place like Obsidian’s Extract this heading. Settings describe this in the tab, not only on hover.

## 1.9.0-beta.1

### Added

- Settings toggle **Lowercase new note titles**. When on, newly created note file names are forced to lowercase. Note content is unchanged. Off by default.

### Fixed

- Emit native ES2018 classes instead of ES5 `__extends` / `_super.call(this)` so the plugin loads on Obsidian 1.15, where `Plugin` is a native class.
