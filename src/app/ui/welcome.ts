import { joinNumberSegments } from '../domain/joinNumberSegments';

/** Bootstraps the placeholder paragraphs (same behavior as the original inline script). */
export function mountPlaceholderDemo(doc: Document): void {
    const greeting = doc.createElement('p');
    greeting.textContent = 'hello webpack';

    const summary = doc.createElement('p');
    summary.textContent = joinNumberSegments([1, 2, 3, 4, 5, 6], [7, 8, 9, 10]);

    doc.body.appendChild(summary);
    doc.body.appendChild(greeting);
}
