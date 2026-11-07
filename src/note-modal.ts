import { App, FuzzyMatch, FuzzySuggestModal, MarkdownView, SuggestModal, TFile } from 'obsidian';
import ModalNoteCreation from './modal-note-creation';
import { destinationNotesForExtract } from './heading-extract';
const EMPTY_TEXT = 'No files found to append content. Enter to create a new one.'
const PLACEHOLDER_TEXT = 'Type file to append to or create';
const instructions = [
    {command: '↑↓', purpose: 'to navigate'},
    {command: '↵', purpose: 'to append content to file'},
    {command: 'esc', purpose: 'to dismiss'}
];

export interface NoteRefactorModalOptions {
    existingOnly?: boolean;
    excludePath?: string;
}

export default class NoteRefactorModal extends FuzzySuggestModal<TFile>{
    modalNoteCreation: ModalNoteCreation;
    files: TFile[];
    newNoteResult: HTMLDivElement;
    suggestionEmpty: HTMLDivElement;
    obsFile: any;
    noSuggestion: boolean;
    existingOnly: boolean;

    constructor(app: App, modalNoteCreation: ModalNoteCreation, options?: NoteRefactorModalOptions) {
        super(app);
        this.modalNoteCreation = modalNoteCreation;
        this.existingOnly = options?.existingOnly ?? false;
        this.init(options?.excludePath);
    }

    init(excludePath?: string) {
        this.files = this.app.vault.getMarkdownFiles();
        if (excludePath) {
            this.files = destinationNotesForExtract(this.files, excludePath);
        }
        this.emptyStateText = this.existingOnly
            ? 'No matching notes. Choose an existing note to append the heading.'
            : EMPTY_TEXT;
        this.setPlaceholder(this.existingOnly
            ? 'Choose an existing note to extract into'
            : PLACEHOLDER_TEXT);
        this.setInstructions(this.existingOnly
            ? [
                {command: '↑↓', purpose: 'to navigate'},
                {command: '↵', purpose: 'to append heading to note'},
                {command: 'esc', purpose: 'to dismiss'}
            ]
            : instructions);
    }

    getItems(): TFile[] {
        if (this.existingOnly) {
            return this.files;
        }
        const inputName = this.inputEl.value;
        if(inputName.length == 0 || this.files.filter(f => this.isMatch(f.path, inputName + '.md')).length > 0){
            return this.files;
        }
        const newFile: TFile = {basename: this.inputEl.value, path: undefined, stat: undefined, vault: undefined, extension: undefined, parent: undefined, name: undefined};
        newFile.path = this.inputEl.value;
        return [newFile, ...this.files];
    }
    
    getItemText(item: TFile): string {
        this.noSuggestion = false;
        return item.path;
    }
    
    onChooseItem(item: TFile, evt: MouseEvent | KeyboardEvent): void {
        if(this.noSuggestion || item.vault == undefined) {
            this.modalNoteCreation.create(this.inputEl.value);
        } else {
            this.modalNoteCreation.append(item);
        }
    }

    renderSuggestion(item: FuzzyMatch<TFile>, el: HTMLElement) {
        el.innerText = item.item.path.replace('.md', '');
        if(item.item.vault == undefined) {
            this.itemInstructionMessage(el, 'Enter to create new file');
        }
    }

    itemInstructionMessage(resultEl: HTMLElement, message: string) {
        const el = document.createElement('kbd');
        el.addClass('suggestion-hotkey');
        el.innerText = message;
        resultEl.appendChild(el);
    }

    isMatch(input: string, match: string){
        return input.toLocaleLowerCase() == match.toLocaleLowerCase()
    }
    
}