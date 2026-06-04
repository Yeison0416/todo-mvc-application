import 'reset-css';
import './main.scss';

import { ToDoApp } from './app/to-do-app';
import { toDodata } from './data/data';

function App() {
    return {
        run() {
            const appRoot: HTMLElement = document.getElementById('app-root') as HTMLElement;
            const toDoApp = ToDoApp(appRoot, toDodata.toDo);
        },
    };
}

const app = App();
app.run();
