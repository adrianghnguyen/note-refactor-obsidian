import { FILE_NAME_REGEX } from './constants'
import { NoteRefactorSettings } from './settings';
import MomentDateRegex from './moment-date-regex'

export default class NRFile {
    
    private settings: NoteRefactorSettings;
    private momentDateRegex: MomentDateRegex;

    constructor(setting: NoteRefactorSettings) {
        this.settings = setting;
        this.momentDateRegex = new MomentDateRegex();
    }

    sanitisedFileName(unsanitisedFilename: string): string {
      const headerRegex = FILE_NAME_REGEX;
      const prefix = this.fileNamePrefix();
      const checkedPrefix = unsanitisedFilename.startsWith(prefix) ? '' : prefix;
      return this.applyNewNoteTitleCase(
        checkedPrefix + unsanitisedFilename.replace(headerRegex, '').trim().slice(0, 255)
      );
    }

    fileNamePrefix(): string {
      return this.settings.fileNamePrefix ? this.momentDateRegex.replace(this.settings.fileNamePrefix) : '';
    }

    applyNewNoteTitleCase(fileName: string): string {
      return this.settings.lowercaseNewNoteTitle ? fileName.toLocaleLowerCase() : fileName;
    }

    ensureUniqueFileNames(headingNotes: string[][]): string[] {
      const fileNames:string[] = [];
      const deduped = headingNotes.map((hn) => {
        const fileName = this.sanitisedFileName(hn[0]);
        const duplicates = fileNames.filter(fn => fn == fileName);
        fileNames.push(fileName);
        return duplicates.length >= 1 ? `${fileName}${duplicates.length + 1}` : fileName;
      });
      return deduped;
    }
}