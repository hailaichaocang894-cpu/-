// 1. ページ（Index.html）を表示する関数
function doGet() {
  return HtmlService.createTemplateFromFile('index')
      .evaluate()
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// 2. HTMLのインクルード用関数（cssやjsの分割ファイルを読み込むためのもの）
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// 3. 🛠️ 最重要：チャット、プロキシ、ランキングのデータを保存する受け皿
function saveGlobalData(dataType, dataString) {
  var props = PropertiesService.getScriptProperties();
  
  if (dataType === 'g_chat') {
    props.setProperty('gas_chat_logs', dataString);
  } else if (dataType === 'g_proxy') {
    props.setProperty('gas_proxy_logs', dataString);
  } else if (dataType === 'g_ranking') {
    props.setProperty('gas_ranking_logs', dataString);
  }
  return true;
}

// 4. 🔄 画面を開いたとき・送信した後にデータをまとめて画面に返す関数
function getGlobalData() {
  var props = PropertiesService.getScriptProperties();
  
  // 初期化用のシステムメッセージ（最初のメッセージ）
  var defaultChat = JSON.stringify([{
    name: "SYSTEM", 
    text: "チャットルームが作成されました。", 
    time: "", 
    senderId: "system", 
    role: "system"
  }]);

  return {
    chat: props.getProperty('gas_chat_logs') || defaultChat,
    proxy: props.getProperty('gas_proxy_logs') || JSON.stringify([]),
    ranking: props.getProperty('gas_ranking_logs') || JSON.stringify([])
  };
}

// 5. 📅 予定表（時間割）を個別保存する関数
function saveSchedule(period, text) {
  var props = PropertiesService.getScriptProperties();
  props.setProperty('schedule_period_' + period, text);
}

// 6. 📅 予定表（時間割）をまとめて読み込む関数
function getSavedSchedules() {
  var props = PropertiesService.getScriptProperties();
  var schedules = {};
  for (var i = 1; i <= 6; i++) {
    var defaultText = i + '時間目：未設定';
    if (i === 1) defaultText = '1時間目：社会';
    if (i === 2) defaultText = '2時間目：数学';
    if (i === 3) defaultText = '3時間目：国語';
    if (i === 4) defaultText = '4時間目：英語';
    if (i === 5) defaultText = '5時間目：音楽';
    if (i === 6) defaultText = '6時間目：なし';
    
    schedules[i] = props.getProperty('schedule_period_' + i) || defaultText;
  }
  return schedules;
}

// ==========================================
// 🛡️ 凍結・IPBAN用のサーバー制御関数
// ==========================================

// ユーザーのアクセス時にIPBAN状態と凍結状態をまとめてチェック
function checkUserStatus(userIp) {
  var props = PropertiesService.getScriptProperties();
  
  var ipBanStr = props.getProperty('ip_blacklist') || "[]";
  var ipBanList = JSON.parse(ipBanStr);
  var isFrozen = props.getProperty('chat_frozen') === 'true';
  
  // アクセスしてきたIPがBANリストに含まれているか判定
  var isBanned = false;
  if (userIp && ipBanList.indexOf(userIp) !== -1) {
    isBanned = true;
  }
  
  return {
    isBanned: isBanned,
    isFrozen: isFrozen,
    ipList: ipBanList
  };
}

// チャットの凍結状態を切り替える（管理者用）
function setChatFreeze(freezeBoolean) {
  var props = PropertiesService.getScriptProperties();
  props.setProperty('chat_frozen', freezeBoolean ? 'true' : 'false');
  return freezeBoolean;
}

// 新しいIPアドレスをBANリストに登録する（管理者用）
function registerIpBan(ipAddress) {
  var props = PropertiesService.getScriptProperties();
  var ipBanStr = props.getProperty('ip_blacklist') || "[]";
  var ipBanList = JSON.parse(ipBanStr);
  
  if (ipBanList.indexOf(ipAddress) === -1) {
    ipBanList.push(ipAddress);
    props.setProperty('ip_blacklist', JSON.stringify(ipBanList));
  }
  return ipBanList;
}
