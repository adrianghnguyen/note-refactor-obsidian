import { HEADING_FORMAT } from './constants';

export class NoteRefactorSettings {
    includeFirstLineAsNoteHeading: boolean = false;
    excludeFirstLineInNote: boolean = false;
    openNewNote: boolean = true;
    headingFormat: string = HEADING_FORMAT;
    newFileLocation: Location = Location.VaultFolder;
    customFolder: string = '';
    fileNamePrefix: string = '';
    lowercaseNewNoteTitle: boolean = false;
    transcludeByDefault: boolean = false;
    noteLinkTemplate: string = '';
    refactoredNoteTemplate: string = '';
    normalizeHeaderLevels: boolean = false;
    extractHeadingLinkAtParentBottom: boolean = true;
  }
  
export enum Location {
    VaultFolder,
    SameFolder,
    SpecifiedFolder
}