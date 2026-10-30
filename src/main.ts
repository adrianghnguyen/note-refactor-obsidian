import {
  MarkdownView,
  Plugin,
  Vault, 
  DataAdapter,
  getLinkpath,
  Editor,
  Menu,
  Notice
} from 'obsidian';
import MomentDateRegex from './moment-date-regex';
import { NoteRefactorSettingsTab } from './settings-tab';
import { NoteRefactorSettings } from './settings';
import NRFile from './file';
import ObsidianFile from './obsidian-file';
import NRDoc, { ReplaceMode } from './doc';
import NoteRefactorModal from './note-modal';
import ModalNoteCreation from './modal-note-creation';
import { findHeadingSection } from './heading-extract';

export default class NoteRefactor extends Plugin {
  settings: NoteRefactorSettings;
  momentDateRegex: MomentDateRegex;
  obsFile: ObsidianFile;
  file: NRFile;
  NRDoc: NRDoc;
  vault: Vault;
  vaultAdapter: DataAdapter;

  onInit() {}

  async onload() {
    console.log("Loading Note Refactor plugin");
    this.settings = Object.assign(new NoteRefactorSettings(), await this.loadData());
    this.momentDateRegex = new MomentDateRegex();
    this.obsFile = new ObsidianFile(this.settings, this.app)
    this.file = new NRFile(this.settings);
    this.NRDoc = new NRDoc(this.settings, this.app.vault, this.app.fileManager);
    
    this.addCommand({
      id: 'app:extract-selection-first-line',
      name: 'Extract selection to new note - first line as file name',
      callback: () => this.editModeGuard(async () => await this.extractSelectionFirstLine('replace-selection')),
      hotkeys: [
        {
          modifiers: ["Mod", "Shift"],
          key: "n",
        },
      ],
    });

    this.addCommand({
      id: 'app:extract-selection-content-only',
      name: 'Extract selection to new note - content only',
      callback: () => this.editModeGuard(() => this.extractSelectionContentOnly('replace-selection')),
      hotkeys: [
        {
          modifiers: ["Mod", "Shift"],
          key: "c",
        },
      ],
    });

    this.addCommand({
      id: 'app:extract-selection-autogenerate-name',
      name: 'Extract selection to new note - only prefix as file name',
      callback: () => this.editModeGuard(() => this.extractSelectionAutogenerate('replace-selection'))
    });

    this.addCommand({
      id: 'app:split-note-first-line',
      name: 'Split note here - first line as file name',
      callback: () => this.editModeGuard(() => this.extractSelectionFirstLine('split')),
    });

    this.addCommand({
      id: 'app:split-note-content-only',
      name: 'Split note here - content only',
      callback: () => this.editModeGuard(() => this.extractSelectionContentOnly('split')),
    });

    this.addCommand({
      id: 'app:split-note-by-heading-h1',
      name: 'Split note by headings - H1',
      callback: () => this.editModeGuard(() => this.splitOnHeading(1)),
    });

    this.addCommand({
      id: 'app:split-note-by-heading-h2',
      name: 'Split note by headings - H2',
      callback: () => this.editModeGuard(() => this.splitOnHeading(2)),
    });

    this.addCommand({
      id: 'app:split-note-by-heading-h3',
      name: 'Split note by headings - H3',
      callback: () => this.editModeGuard(() => this.splitOnHeading(3)),
    });

    this.addCommand({
      id: 'app:extract-heading',
      name: 'Extract heading',
      checkCallback: (checking: boolean) => {
        const mdView = this.app.workspace.activeLeaf?.view as MarkdownView;
        if (!mdView || mdView.getMode() !== 'source') {
          return false;
        }
        const lines = mdView.editor.getValue().split('\n');
        const section = findHeadingSection(lines, mdView.editor.getCursor().line);
        if (!section) {
          return false;
        }
        if (!checking) {
          void this.extractHeading();
        }
        return true;
      },
    });

    this.registerEvent(this.app.workspace.on('editor-menu', (menu: Menu, editor: Editor, view: MarkdownView) => {
      if (!view || view.getMode() !== 'source') {
        return;
      }
      const lines = editor.getValue().split('\n');
      const section = findHeadingSection(lines, editor.getCursor().line);
      if (!section) {
        return;
      }
      menu.addItem((item) => {
        item
          .setTitle('Extract heading')
          .setIcon('scissors')
          .onClick(() => {
            void this.extractHeading();
          });
      });
      menu.addItem((item) => {
        item
          .setTitle('Place extract link at parent heading bottom')
          .setChecked(this.settings.extractHeadingLinkAtParentBottom)
          .onClick(async () => {
            this.settings.extractHeadingLinkAtParentBottom = !this.settings.extractHeadingLinkAtParentBottom;
            await this.saveData(this.settings);
            new Notice(
              this.settings.extractHeadingLinkAtParentBottom
                ? 'Extract heading: link goes at the bottom of the parent heading'
                : 'Extract heading: link replaces the heading in place'
            );
          });
      });
    }));

    this.addSettingTab(new NoteRefactorSettingsTab(this.app, this));
  }

  onunload() {
    console.log("Unloading Note Refactor plugin");
  }

  editModeGuard(command: () => any): void {
    const mdView = this.app.workspace.activeLeaf.view as MarkdownView;
    if(!mdView || mdView.getMode() !== 'source') {
      new Notification('Please use Note Refactor plugin in edit mode');
      return;
    } else {
      command();
    }
  }

  async splitOnHeading(headingLevel: number){
      const mdView = this.app.workspace.activeLeaf.view as MarkdownView;
      const doc = mdView.editor;
      const headingNotes = this.NRDoc.contentSplitByHeading(doc, headingLevel);
      const dedupedFileNames = this.file.ensureUniqueFileNames(headingNotes);
      headingNotes.forEach((hn, i) => this.createNoteWithFirstLineAsFileName(dedupedFileNames[i], hn, mdView, doc, 'replace-headings', true));
  }

  async extractHeading(): Promise<void> {
    const mdView = this.app.workspace.activeLeaf.view as MarkdownView;
    const doc = mdView.editor;
    if (!mdView) { return }

    const lines = doc.getValue().split('\n');
    const section = findHeadingSection(lines, doc.getCursor().line);
    if (!section) {
      new Notice('Place the cursor in a heading to extract it');
      return;
    }
    const extractedLines = lines.slice(section.startLine, section.endLine);

    await this.createNoteWithFirstLineAsFileName(
      extractedLines[0],
      extractedLines,
      mdView,
      doc,
      'extract-heading',
      false
    );
  }

  async extractSelectionFirstLine(mode: ReplaceMode): Promise<void> {
      const mdView = this.app.workspace.activeLeaf.view as MarkdownView;
      const doc = mdView.editor;
      if(!mdView) {return}
      
      const selectedContent = mode === 'split' ? this.NRDoc.noteRemainder(doc) : this.NRDoc.selectedContent(doc);
      if(selectedContent.length <= 0) { return }

      await this.createNoteWithFirstLineAsFileName(selectedContent[0], selectedContent, mdView, doc, mode, false);
  }

  async extractSelectionAutogenerate(mode: ReplaceMode): Promise<void> {
      const mdView = this.app.workspace.activeLeaf.view as MarkdownView;
      const doc = mdView.editor;
      if(!mdView) {return}
      
      const selectedContent = mode === 'split' ? this.NRDoc.noteRemainder(doc) : this.NRDoc.selectedContent(doc);
      if(selectedContent.length <= 0) { return }

      await this.createAutogeneratedNote(selectedContent, mdView, doc, mode, true); // Don't open a new note in a new pane. TODO: perhaps a setting would be useful?
  }

  private async createAutogeneratedNote(selectedContent: string[], mdView: MarkdownView, doc: Editor, mode: ReplaceMode, isMultiple: boolean) {
    const [header, ...contentArr] = selectedContent;

    const fileName = this.file.applyNewNoteTitleCase(this.file.fileNamePrefix()); // Only prefix is used for the note file name
    const originalNote = this.NRDoc.noteContent(header, contentArr);
    let note = originalNote;
    const filePath = await this.obsFile.createOrAppendFile(fileName, '');

    if (this.settings.refactoredNoteTemplate !== undefined && this.settings.refactoredNoteTemplate !== '') {
      const link = await this.app.fileManager.generateMarkdownLink(mdView.file, '', '', '');
      const newNoteLink = await this.NRDoc.markdownLink(filePath);
      note = this.NRDoc.templatedContent(note, this.settings.refactoredNoteTemplate, mdView.file.basename, link, fileName, newNoteLink, '', note);
    }

    await this.obsFile.createOrAppendFile(fileName, note);
    await this.NRDoc.replaceContent(fileName, filePath, doc, mdView.file, note, originalNote, mode);
    if(!isMultiple) {
        await this.app.workspace.openLinkText(fileName, getLinkpath(filePath), true);
    }
  }

  private async createNoteWithFirstLineAsFileName(dedupedHeader: string, selectedContent: string[], mdView: MarkdownView, doc: Editor, mode: ReplaceMode, isMultiple: boolean) {
    const [originalHeader, ...contentArr] = selectedContent;

    const fileName = this.file.sanitisedFileName(dedupedHeader);
    const originalNote = this.NRDoc.noteContent(originalHeader, contentArr);
    let note = originalNote;
    const filePath = await this.obsFile.createOrAppendFile(fileName, '');

    if (this.settings.refactoredNoteTemplate !== undefined && this.settings.refactoredNoteTemplate !== '') {
      const link = await this.app.fileManager.generateMarkdownLink(mdView.file, '', '', '');
      const newNoteLink = await this.NRDoc.markdownLink(filePath);
      note = this.NRDoc.templatedContent(note, this.settings.refactoredNoteTemplate, mdView.file.basename, link, fileName, newNoteLink, '', note);
    }
    await this.obsFile.createOrAppendFile(fileName, note);
    await this.NRDoc.replaceContent(fileName, filePath, doc, mdView.file, note, originalNote, mode);
    if(!isMultiple && this.settings.openNewNote) {
        await this.app.workspace.openLinkText(fileName, getLinkpath(filePath), true);
    }
  }

  extractSelectionContentOnly(mode:ReplaceMode): void {
    const mdView = this.app.workspace.activeLeaf.view as MarkdownView;
    if(!mdView) {return}
    const doc = mdView.editor;
    
    const contentArr = mode === 'split' ? this.NRDoc.noteRemainder(doc): this.NRDoc.selectedContent(doc);
    if(contentArr.length <= 0) { return }
    this.loadModal(contentArr, doc, mode);
  }
  
  loadModal(contentArr:string[], doc:Editor, mode:ReplaceMode): void {
    let note = this.NRDoc.noteContent(contentArr[0], contentArr.slice(1), true);
    const modalCreation = new ModalNoteCreation(this.app, this.settings, this.NRDoc, this.file, this.obsFile, note, doc, mode);
    new NoteRefactorModal(this.app, modalCreation).open();
  }
}