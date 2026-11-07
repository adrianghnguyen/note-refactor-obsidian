import { describe, expect, it } from '@jest/globals';
import {
  applyExtractHeadingLink,
  destinationNotesForExtract,
  findHeadingSection,
  findParentHeading,
  joinAppendedNoteContent,
} from '../src/heading-extract';

const SAMPLE = [
  '# H1 Title',
  'h1 intro',
  '',
  '## H2 Parent',
  'h2 intro',
  '',
  '### H3 Extract me',
  'h3 body',
  '',
  '### H3 sibling',
  'sibling body',
  '',
  '## H2 other',
  'other body',
].join('\n');

describe('findHeadingSection', () => {
  it('finds an H3 from its heading line', () => {
    const lines = SAMPLE.split('\n');
    const section = findHeadingSection(lines, 6);
    expect(section).toMatchObject({
      headingLevel: 3,
      headingText: 'H3 Extract me',
      startLine: 6,
      endLine: 9,
    });
  });

  it('finds an H3 from a body line', () => {
    const lines = SAMPLE.split('\n');
    const section = findHeadingSection(lines, 7);
    expect(section?.headingText).toBe('H3 Extract me');
  });
});

describe('findParentHeading', () => {
  it('maps H3 to its parent H2', () => {
    const lines = SAMPLE.split('\n');
    const section = findHeadingSection(lines, 6);
    const parent = findParentHeading(lines, section);
    expect(parent).toMatchObject({
      headingLevel: 2,
      headingLine: 3,
      endLine: 12,
    });
  });

  it('maps H2 to its parent H1', () => {
    const lines = SAMPLE.split('\n');
    const section = findHeadingSection(lines, 3);
    const parent = findParentHeading(lines, section);
    expect(parent).toMatchObject({
      headingLevel: 1,
      headingLine: 0,
    });
  });
});

describe('applyExtractHeadingLink', () => {
  it('places the last H3 wikilink directly under its parent H2, before remaining sibling H3s', () => {
    const source = [
      '# H1',
      '## H2',
      '### H3 not target',
      '### H3 this is target',
    ].join('\n');
    const result = applyExtractHeadingLink(source, 3, '[[H3 this is target]]', true);
    expect(result?.nextText).toBe([
      '# H1',
      '## H2',
      '[[H3 this is target]]',
      '',
      '### H3 not target',
    ].join('\n'));
  });

  it('places the H3 wikilink under the parent H2, not at the end of H1', () => {
    const result = applyExtractHeadingLink(SAMPLE, 6, '[[H3 Extract me]]', true);
    expect(result?.nextText).toBe([
      '# H1 Title',
      'h1 intro',
      '',
      '## H2 Parent',
      '[[H3 Extract me]]',
      '',
      'h2 intro',
      '',
      '### H3 sibling',
      'sibling body',
      '',
      '## H2 other',
      'other body',
    ].join('\n'));
  });

  it('places the H2 wikilink directly under its parent H1, before remaining H2 siblings', () => {
    const result = applyExtractHeadingLink(SAMPLE, 3, '[[H2 Parent]]', true);
    expect(result?.nextText).toBe([
      '# H1 Title',
      '[[H2 Parent]]',
      '',
      'h1 intro',
      '',
      '## H2 other',
      'other body',
    ].join('\n'));
  });

  it('replaces the heading in place when the parent-bottom option is off', () => {
    const result = applyExtractHeadingLink(SAMPLE, 6, '[[H3 Extract me]]', false);
    expect(result?.nextText).toBe([
      '# H1 Title',
      'h1 intro',
      '',
      '## H2 Parent',
      'h2 intro',
      '',
      '[[H3 Extract me]]',
      '',
      '### H3 sibling',
      'sibling body',
      '',
      '## H2 other',
      'other body',
    ].join('\n'));
  });

  it('places a link to an existing destination note, not a new file named after the heading', () => {
    const result = applyExtractHeadingLink(SAMPLE, 6, '[[Inbox]]', true);
    expect(result?.nextText).toContain('[[Inbox]]');
    expect(result?.nextText).not.toContain('### H3 Extract me');
    expect(result?.extractedLines[0]).toBe('### H3 Extract me');
  });
});

describe('destinationNotesForExtract', () => {
  it('keeps other markdown notes and drops the source note', () => {
    const notes = destinationNotesForExtract(
      [
        { path: 'Source.md' },
        { path: 'Inbox.md' },
        { path: 'Projects/Plan.md' },
      ],
      'Source.md'
    );
    expect(notes.map((n) => n.path)).toEqual(['Inbox.md', 'Projects/Plan.md']);
  });
});

describe('joinAppendedNoteContent', () => {
  it('appends extracted heading content after existing note body with a blank line', () => {
    expect(joinAppendedNoteContent('Inbox body\n', '### H3 Extract me\nh3 body')).toBe(
      'Inbox body\n\n### H3 Extract me\nh3 body'
    );
  });

  it('writes only the extracted content when the destination is empty', () => {
    expect(joinAppendedNoteContent('', '### H3 Extract me')).toBe('### H3 Extract me');
  });
});
