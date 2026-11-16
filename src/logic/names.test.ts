import { describe, expect, it } from 'vitest';
import { initials, parseNameList } from './names';

describe('names', () => {
  it('reads a pasted list: numbering, bullets, empty lines and repeats are dropped', () => {
    expect(parseNameList('1. Avi Klein\n2) Dovid  Weiss\n\n- משה לוי\n• Eli Stern\navi klein\n')).toEqual(['Avi Klein', 'Dovid Weiss', 'משה לוי', 'Eli Stern']);
  });
  it('keeps a name that merely starts with a digit-free word', () => {
    expect(parseNameList('Ben-Zion Katz')).toEqual(['Ben-Zion Katz']);
  });
  it('makes initials, also from Hebrew letters', () => {
    expect(initials('Avi Klein')).toBe('AK');
    expect(initials('משה לוי')).toBe('מל');
    expect(initials('Mendel')).toBe('M');
    expect(initials('  ')).toBe('?');
  });
});
