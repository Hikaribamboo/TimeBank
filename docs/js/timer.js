import { deleteTask, saveToLocalStorage, updateTask, loadData, clearFormInputs, closeModal, tasks, badges } from './tasks.js';

let stopwatchElapsedSeconds = 0; // ストップウォッチ用経過時間
let stopwatchInterval;    // ストップウォッチ用インターバルID
let stopwatchIsRunning = false; // ストップウォッチ状態

let timerRemainingTime;   // タイマー用残り時間
let timerInterval;        // タイマー用インターバルID
let timerIsRunning = false; // タイマー状態

// ストップウォッチ確認フォームを表示
function showConfirmForm(task) {
    closeModal('task-details-modal')

    const confirmModal = document.getElementById('confirm-modal'); // モーダルを取得
    confirmModal.classList.remove('hidden'); // `hidden` クラスを削除
    confirmModal.classList.add('show'); // `show` クラスを追加

    // 確認ボタンにtaskを渡す
    const yesButton = confirmModal.querySelector('#confirm-yes'); // ボタンを取得
    yesButton.onclick = () => startStopwatch(task);

    const noButton = confirmModal.querySelector('#confirm-no'); // ボタンを取得
    noButton.onclick = () => closeModal('confirm-modal');
}

function startStopwatch(task) {
    const taskId = task.id;

    closeModal('confirm-modal')

    const stopwatchModal = document.createElement('div');
    stopwatchModal.classList.add('modal');
    stopwatchModal.innerHTML = `
        <div class="modal">
            <div class="modal-content background-set">
                <h3 id="stopwatch-display">0秒</h3>
                <div class="next-container">
                    <button class="button-nomal" id="stopwatch-toggle">停止</button>
                    <button class="button-nomal green" id="stopwatch-save">保存</button>
                    <button class="button-nomal red" id="stopwatch-end" onclick = cancelTimer()>キャンセル</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(stopwatchModal);

    const display = stopwatchModal.querySelector('#stopwatch-display');
    const toggleButton = stopwatchModal.querySelector('#stopwatch-toggle');
    const saveButton = stopwatchModal.querySelector('#stopwatch-save');
    const endButton = stopwatchModal.querySelector('#stopwatch-end');

    // 初期状態でストップウォッチを開始
    startStopwatchCounting(display, toggleButton);

    // ストップウォッチの開始/停止トグル処理
    toggleButton.onclick = () => {
        toggleStopwatch(display, toggleButton);
    };

    // 保存ボタン
    saveButton.onclick = () => {
        saveTimeToTask(taskId, stopwatchElapsedSeconds); // ストップウォッチの経過時間を保存
        alert('時間が保存されました');
        resetStopwatch(display);          // ストップウォッチをリセット
        stopwatchModal.remove();          // モーダルを閉じる
    };

    // キャンセルボタン
    endButton.onclick = () => {
        clearInterval(stopwatchInterval); // インターバルを停止
        resetStopwatch(display);          // ストップウォッチをリセット
        stopwatchModal.remove();          // モーダルを閉じる
    };

}

// ストップウォッチを開始する
function startStopwatchCounting(display, toggleButton) {
    closeModal('task-details-modal')

    stopwatchInterval = setInterval(() => {
        stopwatchElapsedSeconds++;  // 1秒ごとに経過時間を増やす
        const hours = Math.floor(stopwatchElapsedSeconds / 3600);
        const minutes = Math.floor((stopwatchElapsedSeconds % 3600) / 60);
        const seconds = stopwatchElapsedSeconds % 60;
        display.textContent = `${hours}時間 ${minutes}分 ${seconds}秒`; // 時間の表示を更新
    }, 1000);

    toggleButton.textContent = '停止'; // ボタンのテキストを「停止」に変更
    stopwatchIsRunning = true;  // ストップウォッチが動いている状態にする
}

// ストップウォッチを停止/再開する
function toggleStopwatch(display, toggleButton) {
    if (stopwatchIsRunning) {
        // ストップウォッチを停止
        clearInterval(stopwatchInterval);
        toggleButton.textContent = '再開'; // ボタンのテキストを「再開」に変更
        stopwatchIsRunning = false;  // ストップウォッチが停止している状態
    } else {
        // ストップウォッチを再開
        startStopwatchCounting(display, toggleButton);
    }
}

// ストップウォッチをリセットする
function resetStopwatch(display) {
    stopwatchElapsedSeconds = 0; // 経過時間を0にリセット
    const hours = Math.floor(stopwatchElapsedSeconds / 3600);
    const minutes = Math.floor((stopwatchElapsedSeconds % 3600) / 60);
    const seconds = stopwatchElapsedSeconds % 60;
    display.textContent = `${hours}時間 ${minutes}分 ${seconds}秒`; // 表示を更新
}

// タイマー設定フォームを表示
function setTimerForm(task) {
    closeModal('task-details-modal')

    const timerModal = document.getElementById('timer-setup-modal'); // モーダルを取得
    timerModal.classList.remove('hidden'); // `hidden` クラスを削除
    timerModal.classList.add('show'); // `show` クラスを追加

    // 開始ボタンのクリックイベントを設定
    document.getElementById('start-timer-button').onclick = () => startTimer(task);

    document.getElementById('cancel-button').onclick = () => closeModal('timer-setup-modal')
}

// タイマーを開始
function startTimer(task) {
    closeModal('timer-setup-modal')

    const taskId = task.id;
    const hours = parseInt(document.getElementById('timer-hours').value, 10) || 0;
    const minutes = parseInt(document.getElementById('timer-minutes').value, 10) || 0;
    const totalSeconds = hours * 3600 + minutes * 60; // 時間と分を秒に変換

    if (isNaN(totalSeconds) || totalSeconds <= 0) {
        alert("有効な時間を設定してください");
        return;
    }

    clearFormInputs('timer-setup-modal');
    startCountdown(totalSeconds, taskId); // カウントダウン開始
}

function startCountdown(totalSeconds, taskId) {
    // タイマーの残り時間を設定
    timerRemainingTime = totalSeconds;

    const timerModal = document.createElement('div');
    timerModal.classList.add('modal');
    timerModal.innerHTML = `
    <div class="modal">
        <div class="modal-content hidden">
            <h3 id="countdown-display">0秒</h3>
            <div class="next-container">
                <button class="button-nomal" id="timer-toggle">停止</button>
                <button class="button-nomal green" id="timer-save">保存</button>
                <button class="button-nomal red" id="cancel-timer">キャンセル</button>
            </div>
        </div>
    </div>
    `;
    document.body.appendChild(timerModal);

    const countdownDisplay = timerModal.querySelector('#countdown-display');
    const cancelButton = timerModal.querySelector('#cancel-timer');
    const toggleButton = timerModal.querySelector('#timer-toggle');
    const saveButton = timerModal.querySelector('#timer-save');

    timerModal.classList.remove('hidden'); // `hidden` クラスを削除
    timerModal.classList.add('show'); // `show` クラスを追加

    // 初回のディスプレイ更新
    updateDisplay(countdownDisplay);

    // カウントダウンの開始
    startTimerCountingInterval(countdownDisplay, toggleButton);

    // 停止/再開ボタンのクリックイベント
    toggleButton.onclick = () => {
        toggleTimer(countdownDisplay, toggleButton);
    };

    // 保存ボタン
    saveButton.onclick = () => {
        const elapsedTime = totalSeconds - timerRemainingTime; // タイマーで計測した時間
        saveTimeToTask(taskId, elapsedTime); // 時間を保存
        alert('時間が保存されました');
        
        timerModal.classList.remove('show');
        timerModal.classList.add('hidden');
    };

    // キャンセルボタンのクリックイベント
    cancelButton.onclick = () => {
        clearInterval(timerInterval); // タイマーを停止
        
        timerModal.classList.remove('show');
        timerModal.classList.add('hidden');
    };
}

// タイマーのカウントダウンインターバル
function startTimerCountingInterval(display, toggleButton) {
    const alarmSound = document.getElementById('timer-end-sound');

    timerInterval = setInterval(() => {
        if (timerIsRunning) {
            timerRemainingTime--;  // 1秒ごとに残り時間を減らす
            updateDisplay(display); // 時間の表示を更新
        }

        if (timerRemainingTime <= 0) {
            clearInterval(timerInterval);

            timerIsRunning = false;

            // アラーム音を再生
            alarmSound.play();

            alert('タイマーが終了しました！');
        }
    }, 1000);

    toggleButton.textContent = '停止'; // ボタンのテキストを「停止」に変更
    timerIsRunning = true;  // タイマーが動いている状態
}

// 停止/再開ボタンの処理
function toggleTimer(display, toggleButton) {
    if (timerIsRunning) {
        // タイマーを停止
        clearInterval(timerInterval);
        toggleButton.textContent = '再開'; // ボタンのテキストを「再開」に変更
        timerIsRunning = false;  // ストップウォッチが停止している状態
    } else {
        // タイマーを再開
        startTimerCountingInterval(display, toggleButton);
    }
}

// タイマーの表示を更新
function updateDisplay(display) {
    const hours = Math.floor(timerRemainingTime / 3600);
    const minutes = Math.floor((timerRemainingTime % 3600) / 60);
    const seconds = timerRemainingTime % 60;
    display.textContent = `${hours}時間 ${minutes}分 ${seconds}秒`; // 時間の表示を更新
}

// タスクIDに基づいて累計時間を保存
export function saveTimeToTask(taskId, timeInSeconds) {
    // タスクIDで該当するタスクを検索
    const fromType = taskId.includes("today") ? 'today' : 'long_term';
    const task = tasks[fromType].find(task => task.id === taskId);
    const durationSeconds = task.duration * 36
    
    if (task) {
        task.totalTime = (task.totalTime || 0) + timeInSeconds; // 既存の累計時間に加算
        
        // eachRecordに進捗を保存
        task.eachRecord.push((timeInSeconds / durationSeconds).toFixed(2)) ;
    } else {
        console.log("タスクが見つかりませんでした");
    }

    closeModal('task-details-modal')
    saveToLocalStorage('tasks', tasks)
    loadData('tasks', tasks, task => task && task.title);

    if (task.totalTime >= task.duration * 3600) { // 目標タイム達成
        showCongratsModal(taskId, durationSeconds); // モーダルを表示
    }
}

function showCongratsModal(taskId, durationSeconds) {

    const modal = document.getElementById('congrats-modal');
    const sound = document.getElementById('celebration-sound');
    const fromType = taskId.includes("today") ? 'today' : 'long_term';
    const task = tasks[fromType].find(task => task.id === taskId);
    const taskTitle = task.title;

    // メッセージにタスク名を含める
    modal.querySelector('p').textContent = `${taskTitle}を達成しました！素晴らしい努力です！`;

    modal.classList.remove('hidden');
    modal.classList.add('show')
    sound.play(); // サウンド再生

    //次へボタンの挙動
    const nextButton = document.getElementById('next-modal-button');
    nextButton.onclick = () => {
        closeModal('congrats-modal')
        addBadge(taskTitle, durationSeconds)
        showSetmodal(taskId)
    }
}

function showSetmodal(taskId) {
    const modal = document.getElementById('new-goal-modal');

    modal.classList.remove('hidden');
    modal.classList.add('show')

    //送信ボタンの挙動
    const sendButton = document.getElementById('update-button');
    sendButton.onclick = () => {
        setNewgoal(taskId)
    }

    // 閉じるボタンの挙動
    const closeButton = document.getElementById('close-button2');
    closeButton.onclick = () => {
        closeModal('new-goal-modal')
        deleteTask(taskId)
    };
} 

function setNewgoal(taskId) {
    const fromType = taskId.includes("today") ? 'today' : 'long_term';
    const task = tasks[fromType].find(task => task.id === taskId);
    const taskTitle = task.title;

    // フォームから更新内容を取得
    const form = document.getElementById("task-update-form"); // モーダル内のフォームを取得
    const updatedValues = {
        title: taskTitle,
        deadline: form.elements["new-deadline"].value,
        duration: form.elements["new-duration"].value,
        totalTime: 0, 
        eachRecord: []
    };

    updateTask(taskId, updatedValues)
    closeModal('new-goal-modal')
}

// モーダルを閉じる
function closeCongratsModal() {
    const modal = document.getElementById('congrats-modal');

    modal.classList.add('hidden');
}

// タスク達成時にバッジを付与する
export function addBadge(taskTitle, durationSeconds) {
    const badge = {
        title: taskTitle,
        achievedTime: durationSeconds,
        date: new Date().toLocaleDateString('ja-JP')  // 日本の形式（YYYY年MM月DD日）

    };

    // バッジをリストに追加
    badges.push(badge);
    
    // バッジをローカルストレージに保存
    saveToLocalStorage('badges', badges);
    displayBadges();
}

export function displayBadges() {
    const container = document.getElementById('badges-container');
    container.innerHTML = ''; // 以前のバッジをクリア

    badges.forEach(badge => {
        const badgeElement = document.createElement('div');
        badgeElement.classList.add('badge');

        // 達成時間に応じてクラスを追加
        let timeClass = '';
        const achievedTime = ((badge.achievedTime) / 36);
        if (achievedTime >= 100) {
            timeClass = 'purple'
        } else if (achievedTime >= 50) {
            timeClass = 'gold';  // 金色
        } else if (achievedTime >= 10) {
            timeClass = 'silver';  // 銀色
        } else if (achievedTime >= 0) {
            timeClass = 'bronze';  // 銅色
        }
        badgeElement.classList.add(timeClass);  // 達成時間に応じたクラスを追加

        badgeElement.innerHTML = `
            <h1>${achievedTime}</h1>
        `;
        container.appendChild(badgeElement);
    });
}


window.setTimerForm = setTimerForm;
window.showConfirmForm = showConfirmForm;
window.startStopwatch = startStopwatch;
window.startTimer = startTimer;
window.closeCongratsModal = closeCongratsModal;