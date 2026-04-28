import 'reset-css';
import './index.scss';

function component() {
    const xyeison: number = 2;
    console.log(xyeison);
    const element = document.createElement('p');
    element.textContent = 'hello webpack';

    const p2 = document.createElement('p');
    const numbers1 = [1, 2, 3, 4, 5, 6];
    const numbers2 = [7, 8, 9, 10];
    const numbers3 = [...numbers1, ...numbers2];
    p2.textContent = numbers3.join(' ');
    document.body.appendChild(p2);
    return element;
}

document.body.appendChild(component());
