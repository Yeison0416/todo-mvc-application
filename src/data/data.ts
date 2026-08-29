import { ToDo } from '../app/types/types';

export const toDoData: { toDo: ToDo } = {
    toDo: {
        type: 'to-do',
        toDoAnchorHeader: {
            type: 'to-do-anchor-header',
            title: 'todos',
            href: '#',
        },
        toDoForm: {
            type: 'to-do-form',
            placeholder: 'What needs to be done?',
        },
        toDoBar: {
            type: 'to-do-bar',
            toDoAnchorFlters: [
                {
                    type: 'to-do-anchor-filter',
                    text: 'All',
                    href: '#/',
                },
                {
                    type: 'to-do-anchor-filter',
                    text: 'Active',
                    href: '#/active',
                },
                {
                    type: 'to-do-anchor-filter',
                    text: 'Completed',
                    href: '#/completed',
                },
            ],
            toDoClearCompletedButton: {
                type: 'to-do-clear-completed-button',
                text: 'Clear completed',
            },
            toDoStatus: {
                type: 'to-do-status',
                text: 'items left!',
            },
        },
    },
};
