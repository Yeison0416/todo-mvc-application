/** Merge two number lists into a single space-separated label (demo domain helper). */
export function joinNumberSegments(first: readonly number[], second: readonly number[]): string {
    return [...first, ...second].join(' ');
}
