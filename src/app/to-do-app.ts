import template from './to-do-app.hbs';
import { ToDo } from './types/types';

export function ToDoApp(container: HTMLElement, toDoData: ToDo) {
    // Render the template
    container.innerHTML = template(toDoData);

    return {};
}
