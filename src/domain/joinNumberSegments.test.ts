import { joinNumberSegments } from './joinNumberSegments';

describe('joinNumberSegments', () => {
    it('concatenates segments with spaces', () => {
        expect(joinNumberSegments([1, 2], [3])).toBe('1 2 3');
    });

    it('handles empty inputs', () => {
        expect(joinNumberSegments([], [])).toBe('');
    });
});
