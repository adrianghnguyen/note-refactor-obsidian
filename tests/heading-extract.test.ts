import { describe, expect, it } from '@jest/globals';
import {
  applyExtractHeadingLink,
  findHeadingSection,
  findParentHeading,
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
  it('places the H3 wikilink at the bottom of the parent H2', () => {
    const result = applyExtractHeadingLink(SAMPLE, 6, '[[H3 Extract me]]', true);
    expect(result?.nextText).toBe([
      '# H1 Title',
      'h1 intro',
      '',
      '## H2 Parent',
      'h2 intro',
      '',
      '### H3 sibling',
      'sibling body',
      '',
      '[[H3 Extract me]]',
      '',
      '## H2 other',
      'other body',
    ].join('\n'));
  });

  it('places the H2 wikilink at the bottom of the parent H1', () => {
    const result = applyExtractHeadingLink(SAMPLE, 3, '[[H2 Parent]]', true);
    expect(result?.nextText).toBe([
      '# H1 Title',
      'h1 intro',
      '',
      '## H2 other',
      'other body',
      '',
      '[[H2 Parent]]',
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
});
