import { drag, drop, allowDrop, removeDragOverClass } from './drag.js';
import { saveTimeToTask, displayBadges } from './timer.js';

export let tasks = {
    today: [],
    long_term: []
};

export let badges = [];

// モーダルの参照を取得

function showTaskForm(type) {
    document.getElementById('task-form').dataset.type = type;

    const taskForm = document.getElementById('task-form-container'); // モーダルを取得
    taskForm.classList.remove('hidden'); // `hidden` クラスを削除
    taskForm.classList.add('show'); // `show` クラスを追加
}

// タスク作成フォームを非表示
function hideTaskForm() {
    const taskForm = document.getElementById('task-form-container'); // モーダルを取得
    
    taskForm.classList.remove('show'); 
    taskForm.classList.add('hidden'); 
}

// タスク削除処理
export function deleteTask(taskId) {
    
    // タスクのリストを削除
    tasks['today'] = tasks['today'].filter(t => t.id !== taskId);
    tasks['long_term'] = tasks['long_term'].filter(t => t.id !== taskId);

    saveToLocalStorage('tasks', tasks);
    displayTasks('today');
    displayTasks('long_term');
}

export function saveToLocalStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
    console.log(`${key} saved to localStorage:`, data);
}

// ローカルストレージからタスクを読み込む
export function loadData(key, target, filterFunction)  {
    
    const savedData = localStorage.getItem(key);
    if (savedData) {
        const parsedData = JSON.parse(savedData);
        
        // ターゲットが配列の場合
        if (Array.isArray(target)) {
            target.length = 0; // 配列を空にする
            target.push(...(filterFunction ? parsedData.filter(filterFunction) : parsedData));
        }

        // ターゲットがオブジェクトの場合
        else if (typeof target === 'object') {
            Object.keys(target).forEach(key => {
                if (parsedData[key] && Array.isArray(target[key])) {
                    target[key] = filterFunction
                        ? parsedData[key].filter(filterFunction)
                        : parsedData[key];
                }
            });
        }
    }
    
    if (key ===  "tasks") {
        displayTasks('today');
    displayTasks('long_term');
    }
    
    else if (key === "badges") {
        displayBadges();
    }
}

// ページ読み込み時にタスクを読み込む
window.onload = loadData('tasks', tasks, task => task && task.title);

// バッジを読み込む
window.onload = loadData('badges', badges, badge => badge && badge.title);

window.onload = () => {
    loadTitle('today-tasks', 'today-tasks-title');
    loadTitle('long-term-tasks', 'long-term-tasks-title');
};


function editTitle(sectionId) {
    const section = document.getElementById(sectionId);
    const titleElement = section.querySelector('h2');
    const currentTitle = titleElement.childNodes[0].nodeValue.trim(); // 現在のタイトル

    // 入力フィールドを生成
    const inputField = document.createElement('input');
    inputField.type = 'text';
    inputField.value = currentTitle;
    inputField.className = 'edit-title-input';

    // ペケマークボタンを生成
    const cancelButton = document.createElement('button');
    cancelButton.textContent = '✔';
    cancelButton.className = 'edit-title-cancel';

    const confirmEdit = () => {
        const newTitle = inputField.value.trim() || currentTitle;
        titleElement.innerHTML = '';
        titleElement.appendChild(document.createTextNode(newTitle));
        titleElement.appendChild(createEditButton(sectionId));
        saveTitle(sectionId, `${sectionId}-title`); // タイトルを保存
    };    

    // Enter キーで確定する
    inputField.onkeydown = (e) => {
        if (e.key === 'Enter') {
            confirmEdit();
        }
    };

    // ペケマークで確定する
    cancelButton.onclick = () => {
        confirmEdit();
    };

    // h2 の中身を編集モードに置き換え
    titleElement.innerHTML = '';
    titleElement.appendChild(inputField);
    titleElement.appendChild(cancelButton);

    // 入力フィールドにフォーカスを当てる
    inputField.focus();
}

// タイトルを保存する
function saveTitle(sectionId, key) {
    const section = document.getElementById(sectionId);
    const titleElement = section.querySelector('h2');
    const titleText = titleElement.childNodes[0].nodeValue.trim(); // タイトルを取得
    localStorage.setItem(key, titleText); // ローカルストレージに保存
}

// タイトルをロードして表示する
function loadTitle(sectionId, key) {
    const savedTitle = localStorage.getItem(key); // ローカルストレージから取得
    if (savedTitle) {
        const section = document.getElementById(sectionId);
        const titleElement = section.querySelector('h2');
        titleElement.childNodes[0].nodeValue = savedTitle; // タイトルをセット
    }
}

// 編集ボタン（Font Awesome のアイコンを使用）を生成する関数
function createEditButton(sectionId) {
    const editButton = document.createElement('button');
    editButton.className = 'edit-title-button';

    // アイコンを追加
    const icon = document.createElement('i');
    icon.className = 'fas fa-edit'; // Font Awesome のクラス
    editButton.appendChild(icon);

    editButton.onclick = () => editTitle(sectionId);
    return editButton;
}

function clearFormInputs(formId) {
    const modalForm = document.querySelector(`#${formId}`);
    if (modalForm) {
        modalForm.querySelectorAll('input, textarea, select').forEach(input => {
            if (input.type === 'checkbox' || input.type === 'radio') {
                input.checked = false;
            } else {
                input.value = '';
            }
        });
    }
}

// タスク追加後の処理
function addTask() {
    let nextTaskId = parseInt(localStorage.getItem('nextTaskId'), 10) || 1;
    const type = document.getElementById('task-form').dataset.type;
    const title = document.getElementById('task-title').value;
    const deadline = document.getElementById('task-deadline').value;
    const duration = document.getElementById('task-duration').value;
    const id = `${type}-${nextTaskId}`;

    if (title) {
        const task = { id, title, deadline, duration, totalTime: 0, eachRecord: [] };

        tasks[type].push(task);
        nextTaskId++;
        localStorage.setItem('nextTaskId', nextTaskId);

        saveToLocalStorage('tasks', tasks);
        displayTasks(type);
        clearFormInputs('task-form');
        hideTaskForm();
    }
}

export function displayTasks() {
    // 今日と長期のタスクを表示するセクションを取得
    const sections = {
        today: document.getElementById('today-task-list'),
        long_term: document.getElementById('long-term-task-list'),
    };

    // タスクテンプレートを取得
    const template = document.getElementById('task-template');

    // 各セクションにタスクを表示
    Object.keys(sections).forEach((type) => {
        const list = sections[type];
        list.innerHTML = ''; // 現在のリストをクリア

        tasks[type].forEach((task) => {
            // テンプレートからタスク要素を作成
            const taskItem = template.content.cloneNode(true);

            // データを挿入
            const taskElement = taskItem.querySelector('.task-item');
            taskElement.id = task.id;
            taskElement.ondragstart = drag;

            const titleElement = taskItem.querySelector('.task-title');
            titleElement.textContent = task.title;

            const progressPercent = (task.totalTime / (task.duration * 36)).toFixed();
            const progressElement = taskItem.querySelector('.progress-percent');
            progressElement.textContent = `${progressPercent}%`;

            const progressBarWrapper = taskItem.querySelector('.progress-bar-wrapper');
            let previousWidth = 0;

            task.eachRecord.forEach((record, index) => {
                const sectionWidth = ((record / 100) * 100);
                const progressSection = document.createElement('div');
                progressSection.classList.add('progress-section');
                progressSection.style.width = `${sectionWidth}%`;
                progressSection.style.left = `${previousWidth}%`;
                progressSection.style.backgroundColor = getProgressSectionColor(index);

                progressBarWrapper.appendChild(progressSection);
                previousWidth += sectionWidth;
            });

            // 削除ボタンを作成
            const deleteButton = createDeleteButton(task.id); // 新しい関数を使って削除ボタンを作成
            taskElement.appendChild(deleteButton); // ボタンをタスクアイテムに追加

            // タスククリック時の詳細表示設定
            taskElement.onclick = () => {
                showTaskDetails(task);
                document.getElementById('task-details-modal').setAttribute('data-task-id', task.id);
            };

            // リストにタスクを追加
            list.appendChild(taskItem);
        });
    });
}

// 削除ボタンを作成する関数
function createDeleteButton(taskId) {
    const deleteButton = document.createElement('button');
    deleteButton.classList.add('delete-button'); // CSSクラスを追加

    // ゴミ箱アイコン画像をボタン内に追加
    const trashIcon = document.createElement('img');
    trashIcon.src = '../other/画像/trash.png'; // 画像のパスを設定
    trashIcon.classList.add('trash-icon'); // クラスを追加してスタイル設定

    deleteButton.appendChild(trashIcon);

    // 削除ボタンのクリックイベント
    deleteButton.onclick = (event) => {
        event.stopPropagation(); // 親要素のクリックイベントを防ぐ
        confirmDelete(taskId); // 削除処理
    };

    return deleteButton; // 作成した削除ボタンを返す
}

function confirmDelete(taskId) {
    const modal = document.getElementById('delete-confirm-modal');
    modal.classList.remove('hidden'); // モーダルを表示
    modal.classList.add('show')

    // 「はい」ボタンのイベント
    const confirmYes = document.getElementById('confirm-yes');
    confirmYes.onclick = () => {
        deleteTask(taskId);  // 削除処理を実行
        modal.classList.remove('show')
        modal.classList.add('hidden'); // モーダルを非表示にする
    };

    // 「いいえ」ボタンのイベント
    const confirmNo = document.getElementById('confirm-no');
    confirmNo.onclick = () => {
        modal.classList.remove('show')
        modal.classList.add('hidden'); 
    };
}

// 進捗セクションの色を設定する関数
function getProgressSectionColor(index) {
    // セクションの順番に応じて色を変える
    const colors = ['#9bd2fa', '#cdf4a9', '#f999c2', '#ffb0a1', '#ffdaa9', '#ffd4ed', '#e2bdff', '#8EB8FF', '#FFFF99', '	#86F9C5'];
    return colors[index % colors.length]; // 色の順番を繰り返す
}

function showTaskDetails(task) {
    console.log("表示するタスク:", task); // デバッグ用のログ

    const modal = document.getElementById("task-details-modal");
    const form = document.getElementById('task-details-form');

    if (!modal || !form) {
        console.error("モーダルまたはフォームが見つかりません");
        return;
    }

    // フォームにタスクの詳細を表示
    form.querySelector('#task-title').value = task.title || ''; // デフォルト値を設定
    form.querySelector('#task-deadline').value = task.deadline || '';
    form.querySelector('#task-duration').value = task.duration || '';

    // モーダルを表示
    modal.classList.remove('hidden');
    console.log("モーダルを表示しました");

    // ボタンにイベントを設定
    document.getElementById('set-timer').onclick = () => setTimerForm(task);
    document.getElementById('set-stopwatch').onclick = () => showConfirmForm(task);
}


// タスクを更新する汎用関数
export function updateTask(taskId, updatedValues) {
    const taskType = taskId.includes("today") ? "today" : "long_term"; // タスクの種類を判別
    const task = tasks[taskType].find(task => task.id === taskId);     // 対象タスクを取得

    if (task) {
        Object.assign(task, updatedValues); // 更新内容を反映
        saveToLocalStorage('tasks', tasks);                        // ローカルストレージに保存
        displayTasks(taskType);             // 表示を更新
    }
}

// モーダルからタスクを保存
export function saveTaskDetails() {
    const taskId = document.getElementById("task-details-modal").getAttribute("data-task-id"); // タスクID取得
    const form = document.getElementById("task-details-form"); // モーダル内のフォームを取得

    // 時間と分の入力値を取得
    const hours = form.elements['hours'].value;
    const minutes = form.elements['minutes'].value;

    // 時間と分が入力されていれば、保存処理を行う
    if (hours || minutes) {
        // 時間と分を「秒」に換算
        const timeInSeconds = (parseInt(hours) || 0) * 3600 + (parseInt(minutes) || 0) * 60;
        
        // saveTimeToTaskを呼び出し、時間を保存
        saveTimeToTask(taskId, timeInSeconds);

        // 入力フィールドを空にする
        form.elements['hours'].value = '';
        form.elements['minutes'].value = '';
    }

    // フォームから更新内容を取得
    const updatedValues = {
        title: form.elements["title"].value,
        deadline: form.elements["deadline"].value,
        duration: form.elements["duration"].value
    };

    // 汎用のタスク更新関数を呼び出し
    updateTask(taskId, updatedValues);

    // モーダルを閉じる
    closeTaskDetails();
}

// モーダルを閉じる
export function closeTaskDetails() {
    (document.getElementById("task-details-modal")).classList.remove("show");
    (document.getElementById("task-details-modal")).classList.add("hidden");
}

window.showTaskForm = showTaskForm;
window.displayTasks = displayTasks;
window.saveTaskDetails = saveTaskDetails;
window.closeTaskDetails = closeTaskDetails;
window.addTask = addTask;
window.hideTaskForm = hideTaskForm;
window.editTitle = editTitle;
window.updateTask = updateTask;

// イベントリスナーの追加
document.getElementById('today-task-list').addEventListener('dragover', allowDrop);
document.getElementById('today-task-list').addEventListener('drop', drop);

document.getElementById('long-term-task-list').addEventListener('dragover', allowDrop);
document.getElementById('long-term-task-list').addEventListener('drop', drop);

document.getElementById('today-task-list').addEventListener('dragleave', removeDragOverClass);
document.getElementById('long-term-task-list').addEventListener('dragleave', removeDragOverClass);