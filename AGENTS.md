# AGENTS.md

Fork of [lynchjames/note-refactor-obsidian](https://github.com/lynchjames/note-refactor-obsidian). Day-to-day work targets `origin` (`adrianghnguyen/note-refactor-obsidian`). Plugin id stays `note-refactor-obsidian`.

- `origin` — fork (`adrianghnguyen/note-refactor-obsidian`)
- `upstream` — parent (`lynchjames/note-refactor-obsidian`); keep this remote permanently

Do not use Community plugins **Update** on a fork install — it overwrites the fork build.

## Deploy

Staging first: copy `main.js`, `manifest.json`, and `styles.css` to `<sandbox>/.obsidian/plugins/note-refactor-obsidian/` (Cloud: `~/plugin-sandbox-Obsidian`), then `obsidian vault=plugin-sandbox-Obsidian plugin:reload id=note-refactor-obsidian`. Promote to production only when asked.

## Obsidian 1.15 constructor

`tsconfig.json` `compilerOptions.target` must stay **ES2018 or newer**. ES5 emit uses `__extends` and `_super.call(this)` / `_super.apply(this, …)`, which V8 rejects when subclassing Obsidian’s native `Plugin` class.
