import { deleteTask, saveToLocalStorage, loadData, closeTaskDetails, tasks, badges } from './tasks.js';

let stopwatchElapsedSeconds = 0; // ストップウォッチ用経過時間
let stopwatchInterval;    // ストップウォッチ用インターバルID
let stopwatchIsRunning = false; // ストップウォッチ状態

let timerRemainingTime;   // タイマー用残り時間
let timerInterval;        // タイマー用インターバルID
let timerIsRunning = false; // タイマー状態

// ストップウォッチ確認フォームを表示
function showConfirmForm(task) {
    closeTaskDetails();

    const confirmModal = document.getElementById('confirm-modal'); // モーダルを取得
    confirmModal.classList.remove('hidden'); // `hidden` クラスを削除
    confirmModal.classList.add('show'); // `show` クラスを追加

    // 確認ボタンにtaskを渡す
    const yesButton = confirmModal.querySelector('#confirm-yes'); // ボタンを取得
    yesButton.onclick = () => startStopwatch(task);
}

// 「いいえ」を押したときに確認モーダルを閉じる
function closeConfirmForm() {
    const confirmModal = document.getElementById('confirm-modal');
    confirmModal.classList.remove('show'); // `show` クラスを削除
    confirmModal.classList.add('hidden'); // `hidden` クラスを追加
}

function startStopwatch(task) {
    const taskId = task.id;

    closeConfirmForm()

    const stopwatchModal = document.createElement('div');
    stopwatchModal.classList.add('modal');
    stopwatchModal.innerHTML = `
        <div class="modal">
            <div class="modal-content background-set">
                <p id="stopwatch-display">0秒</p>
                <button class="button-nomal" id="stopwatch-toggle">停止</button>
                <button class="button-nomal green" id="stopwatch-save">保存</button>
                <button class="button-nomal red" id="stopwatch-end" onclick = cancelTimer()>キャンセル</button>
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
    closeTaskDetails()

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
    closeTaskDetails();

    const timerModal = document.getElementById('timer-setup-modal'); // モーダルを取得
    timerModal.classList.remove('hidden'); // `hidden` クラスを削除
    timerModal.classList.add('show'); // `show` クラスを追加

    // 開始ボタンのクリックイベントを設定
    document.getElementById('start-timer-button').onclick = function () {
        startTimer(task); // startTimer 関数を呼び出し、task を引数として渡す
    };
}

// タイマー設定モーダルを閉じる
function closeTimerSetup() {
    const timerModal = document.getElementById('timer-setup-modal'); // モーダルを取得
    timerModal.classList.remove('show'); // `show` クラスを削除
    timerModal.classList.add('hidden'); // `hidden` クラスを追加
}

// タイマーを開始
function startTimer(task) {
    const taskId = task.id;
    const hours = parseInt(document.getElementById('timer-hours').value, 10) || 0;
    const minutes = parseInt(document.getElementById('timer-minutes').value, 10) || 0;
    const totalSeconds = hours * 3600 + minutes * 60; // 時間と分を秒に変換

    if (isNaN(totalSeconds) || totalSeconds <= 0) {
        alert("有効な時間を設定してください");
        return;
    }

    clearTimerInputs();           // タイマー設定モーダルの入力値をクリア
    closeTimerSetup()
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
            <p id="countdown-display">0秒</p>
            <button class="button-nomal" id="timer-toggle">停止</button>
            <button class="button-nomal green" id="timer-save">保存</button>
            <button class="button-nomal red" id="cancel-timer">キャンセル</button>
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

// タイマー設定モーダルの入力値をクリア
function clearTimerInputs() {
    document.getElementById('timer-hours').value = '';
    document.getElementById('timer-minutes').value = '';
}

// タスクIDに基づいて累計時間を保存
export function saveTimeToTask(taskId, timeInSeconds) {
    // タスクIDで該当するタスクを検索
    const fromType = taskId.includes("today") ? 'today' : 'long_term';
    const task = tasks[fromType].find(task => task.id === taskId);
    const durationSeconds = task.duration * 36
    console.log(tasks)
    if (task) {
        task.totalTime = (task.totalTime || 0) + timeInSeconds; // 既存の累計時間に加算
        
        // eachRecordに進捗を保存
        task.eachRecord.push((timeInSeconds / durationSeconds).toFixed(2)) ;
    } else {
        console.log("タスクが見つかりませんでした");
    }

    closeTaskDetails()
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
    const form = document.getElementById("task-update-form"); // モーダル内のフォームを取得

    // メッセージにタスク名を含める
    modal.querySelector('p').textContent = `${taskTitle}を達成しました！素晴らしい努力です！`;

    modal.classList.remove('hidden');
    sound.play(); // サウンド再生

    // 送信ボタンにクリックイベントを追加
    const updateButton = document.getElementById('update-button');
    updateButton.onclick = () => {
        const newDeadline = form.elements["new-deadline"] ? form.elements["new-deadline"].value : ''; // 期限の取得
        const newDuration = form.elements["new-duration"].value; // 新しい目標時間の取得

        // 更新する内容を格納
        const updatedValues = {
            title: taskTitle,
            duration: newDuration,
            totalTime: 0, 
            eachRecord: []
        };

        if (newDeadline) {
            updatedValues.deadline = newDeadline; // 期限が入力されていれば追加
        }

        updateTask(taskId, updatedValues); // タスクを更新
        closeCongratsModal(taskTitle, durationSeconds)
    };

    // 閉じるボタンの挙動
    const closeButton = document.getElementById('close-button');
    closeButton.onclick = () => {
        deleteTask(taskId)
        closeCongratsModal(taskTitle, durationSeconds)
        addBadge(taskTitle, durationSeconds)
    };
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

    console.log(badges)

    // バッジをリストに追加
    badges.push(badge);

    console.log(badges)
    
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
            console.log(achievedTime)
        if (achievedTime >= 100) {
            timeClass = 'gold';  // 金色
        } else if (achievedTime >= 50) {
            timeClass = 'silver';  // 銀色
        } else if (achievedTime >= 0) {
            timeClass = 'bronze';  // 銅色
        }
        badgeElement.classList.add(timeClass);  // 達成時間に応じたクラスを追加

        badgeElement.innerHTML = `
            <p>${badge.title}</p>
            <h1>${achievedTime}h</h1>
            <p> ${badge.date}</p>
        `;
        container.appendChild(badgeElement);
    });
}


window.setTimerForm = setTimerForm;
window.showConfirmForm = showConfirmForm;
window.startStopwatch = startStopwatch;
window.closeConfirmForm = closeConfirmForm;
window.startTimer = startTimer;
window.closeTimerSetup = closeTimerSetup;
window.closeCongratsModal = closeCongratsModal;