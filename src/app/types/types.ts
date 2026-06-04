type toDoAnchorHeader = {
    type: 'to-do-anchor-header';
    title: string;
    href: string;
};

type ToDoForm = {
    type: 'to-do-form';
    placeholder: string;
};

type ToDoAnchorfilters = {
    type: 'to-do-anchor-filter';
    text: string;
    href: string;
};

type ToDoClearCompletedButton = {
    type: 'to-do-clear-completed-button';
    text: string;
};

type ToDoStatus = {
    type: 'to-do-status';
    text: string;
};

type ToDoBar = {
    type: 'to-do-bar';
    toDoAnchorfilters: ToDoAnchorfilters[];
    toDoClearCompletedButton: ToDoClearCompletedButton;
    toDoStatus: ToDoStatus;
};

export type ToDo = {
    type: 'to-do';
    toDoAnchorHeader: toDoAnchorHeader;
    toDoForm: ToDoForm;
    toDoBar: ToDoBar;
};
