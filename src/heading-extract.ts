export interface HeadingSection {
  headingLine: number;
  headingLevel: number;
  headingText: string;
  startLine: number;
  endLine: number;
}

export interface ParentHeading {
  headingLine: number;
  headingLevel: number;
  endLine: number;
}

const ATX_HEADING = /^(#{1,6})[ \t]+(.*)$/;

export function headingLevel(line: string): number {
  const match = line.match(ATX_HEADING);
  return match ? match[1].length : 0;
}

export function headingTitle(line: string): string {
  const match = line.match(ATX_HEADING);
  return match ? match[2].trim() : line.trim();
}

function sectionEnd(lines: string[], startLine: number, level: number): number {
  for (let i = startLine + 1; i < lines.length; i++) {
    const next = headingLevel(lines[i]);
    if (next > 0 && next <= level) {
      return i;
    }
  }
  return lines.length;
}

export function findHeadingSection(lines: string[], cursorLine: number): HeadingSection | null {
  if (lines.length === 0) {
    return null;
  }
  const clamped = Math.max(0, Math.min(cursorLine, lines.length - 1));
  let headingLine = -1;
  let level = 0;
  for (let i = clamped; i >= 0; i--) {
    const found = headingLevel(lines[i]);
    if (found > 0) {
      headingLine = i;
      level = found;
      break;
    }
  }
  if (headingLine < 0) {
    return null;
  }
  return {
    headingLine,
    headingLevel: level,
    headingText: headingTitle(lines[headingLine]),
    startLine: headingLine,
    endLine: sectionEnd(lines, headingLine, level),
  };
}

export function findParentHeading(lines: string[], section: HeadingSection): ParentHeading | null {
  const parentLevel = section.headingLevel - 1;
  if (parentLevel < 1) {
    return null;
  }
  for (let i = section.startLine - 1; i >= 0; i--) {
    if (headingLevel(lines[i]) === parentLevel) {
      return {
        headingLine: i,
        headingLevel: parentLevel,
        endLine: sectionEnd(lines, i, parentLevel),
      };
    }
  }
  return null;
}

function insertLink(lines: string[], index: number, link: string): void {
  const insert: string[] = [];
  if (index > 0 && lines[index - 1] !== '') {
    insert.push('');
  }
  insert.push(link);
  if (index < lines.length && lines[index] !== '') {
    insert.push('');
  }
  lines.splice(index, 0, ...insert);
}

export function applyExtractHeadingLink(
  text: string,
  cursorLine: number,
  link: string,
  placeAtParentBottom: boolean
): { nextText: string; extractedLines: string[] } | null {
  const lines = text.split('\n');
  const section = findHeadingSection(lines, cursorLine);
  if (!section) {
    return null;
  }
  const extractedLines = lines.slice(section.startLine, section.endLine);
  const parent = placeAtParentBottom ? findParentHeading(lines, section) : null;
  const remaining = lines.slice(0, section.startLine).concat(lines.slice(section.endLine));
  let insertAt = section.startLine;
  if (parent) {
    insertAt = parent.endLine;
    if (parent.endLine > section.startLine) {
      insertAt -= section.endLine - section.startLine;
    }
  }
  insertLink(remaining, insertAt, link);
  return { nextText: remaining.join('\n'), extractedLines };
}
