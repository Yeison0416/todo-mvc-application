import { mountPlaceholderDemo } from './welcome';

describe('mountPlaceholderDemo', () => {
    it('renders greeting and summary paragraphs on body', () => {
        mountPlaceholderDemo(document);

        const paragraphs = document.body.querySelectorAll('p');
        expect(paragraphs).toHaveLength(2);
        expect(paragraphs[0]).toHaveTextContent('1 2 3 4 5 6 7 8 9 10');
        expect(paragraphs[1]).toHaveTextContent('hello webpack');
    });
});
