import 'reset-css';
import './main.scss';

import { ToDoApp } from './app/to-do-app';
import { toDoData } from './data/data';

function App() {
    return {
        run() {
            const appRoot: HTMLElement = document.getElementById('app-root') as HTMLElement;
            ToDoApp(appRoot, toDoData.toDo);
        },
    };
}

const app = App();
app.run();
