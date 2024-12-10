import { saveToLocalStorage, loadData, tasks } from './tasks.js';

// ドラッグ開始時の処理
export function drag(event) {
    event.dataTransfer.setData("text/plain", event.target.id); // タスクのIDを保存
    console.log(event.dataTransfer.getData("text/plain"));
}

// ドロップ時の処理
export function drop(event) {
    event.preventDefault();
    event.stopPropagation(); // イベントの伝播を防ぐ

    const taskId = event.dataTransfer.getData("text/plain"); // ドロップされたタスクのIDを取得
    const targetList = event.target.closest("ul").id.includes("today") ? "today" : "long_term";
    
    // タスクの移動処理
    moveTask(taskId, targetList, tasks);
    console.log(tasks)
}

function moveTask(taskId, targetList) {
    loadData('tasks', tasks, task => task && task.title);
    
    const fromType = taskId.includes("today") ? 'today' : 'long_term';
    const taskIndex = tasks[fromType].findIndex(task => task.id === taskId);

    if (taskIndex === -1) return;

    const task = tasks[fromType].splice(taskIndex, 1)[0];
    task.id = `${targetList}-${taskId.split('-')[1]}`;
    tasks[targetList].push(task);

    saveToLocalStorage('tasks', tasks);
    displayTasks('today');
    displayTasks('long_term');
   
}

// ドラッグ可能なエリアの設定
document.getElementById('today-task-list').addEventListener('dragover', function(event) {
    event.preventDefault(); // デフォルトの動作を無効化
});

// ドロップ可能エリアの設定
export function allowDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.add("drag-over"); // クラスを追加
}

// ドラッグがエリアから離れたときにスタイルをリセット
export function removeDragOverClass(event) {
    event.currentTarget.classList.remove("drag-over"); // クラスを削除
}

// ドロップ後にスタイルをリセット
document.getElementById('today-task-list').addEventListener('drop', function(event) {
    event.currentTarget.classList.remove("drag-over"); // ドロップ後にスタイルをリセット
});
document.getElementById('long-term-task-list').addEventListener('drop', function(event) {
    event.currentTarget.classList.remove("drag-over"); // ドロップ後にスタイルをリセット
});

// イベントリスナーの追加
document.getElementById('today-task-list').addEventListener('dragover', allowDrop);
document.getElementById('today-task-list').addEventListener('drop', drop);
document.getElementById('today-task-list').addEventListener('dragleave', removeDragOverClass);

document.getElementById('long-term-task-list').addEventListener('dragover', allowDrop);
document.getElementById('long-term-task-list').addEventListener('drop', drop);
document.getElementById('long-term-task-list').addEventListener('dragleave', removeDragOverClass);
