const drinkTypes = [
  { id: "level01", name: "蓝星", icon: "assets/drinks/level-01.png", base: 80, unlock: 1 },
  { id: "level02", name: "橙光", icon: "assets/drinks/level-02.png", base: 110, unlock: 1 },
  { id: "level03", name: "紫莓", icon: "assets/drinks/level-03.png", base: 150, unlock: 2 },
  { id: "level04", name: "红樱", icon: "assets/drinks/level-04.png", base: 210, unlock: 3 },
  { id: "level05", name: "粉梦", icon: "assets/drinks/level-05.png", base: 300, unlock: 4 },
  { id: "level06", name: "金调", icon: "assets/drinks/level-06.png", base: 430, unlock: 5 },
  { id: "level07", name: "薄荷", icon: "assets/drinks/level-07.png", base: 610, unlock: 6 },
  { id: "level08", name: "蝶影", icon: "assets/drinks/level-08.png", base: 860, unlock: 7 },
  { id: "level09", name: "翠晶", icon: "assets/drinks/level-09.png", base: 1200, unlock: 8 },
  { id: "level10", name: "玫瑰", icon: "assets/drinks/level-10.png", base: 1680, unlock: 9 },
  { id: "level11", name: "银月", icon: "assets/drinks/level-11.png", base: 2350, unlock: 10 },
  { id: "level12", name: "午夜", icon: "assets/drinks/level-12.png", base: 3300, unlock: 11 },
  { id: "level13", name: "虹光", icon: "assets/drinks/level-13.png", base: 4600, unlock: 12 },
  { id: "level14", name: "星冠", icon: "assets/drinks/level-14.png", base: 6400, unlock: 13 },
];

const ROWS = 4;
const COLS = 4;
const TRAY_CAPACITY = 6;
const START_ENERGY = 50;
const levelThresholds = [0, 900, 2300, 4600, 7600, 11500, 16500, 23000, 31500, 42500, 57000, 76000, 101000, 134000];
const SUPABASE_URL = "https://dkaabuxszrbnnrajnoaa.supabase.co";
const SUPABASE_KEY = "sb_publishable_8UjZAjC-Ts2NiP8_NpmFdA_jv-CEzhd";
const PROFILE_KEY = "starlight-cocktail-profile-v1";
const SAVE_KEY = "starlight-cocktail-save-v1";
const PLAYERS_TABLE = "starlight_players";
const RESULTS_TABLE = "starlight_game_results";
const REMOTE_SYNC_INTERVAL = 4200;

const supabaseClient = window.supabase?.createClient?.(SUPABASE_URL, SUPABASE_KEY) || null;
let leaderboardMode = "score";
let leaderboardRefreshTimer = null;
let profile = loadProfile();

const state = {
  board: [],
  queue: [],
  drag: null,
  hoverIndex: null,
  tool: null,
  score: 0,
  coin: 0,
  energy: START_ENERGY,
  level: 1,
  lastUnlockedLevel: 1,
  bestFullLevel: 0,
  combo: 0,
  bestCombo: 0,
  fullCount: 0,
  trash: 2,
  tongs: 2,
  challengeCards: 0,
  bestScore: 0,
  ended: false,
  locked: false,
  queueFresh: false,
  cue: "待机",
  audio: null,
  pointerDrag: null,
  resultSubmitted: false,
  remoteResultId: null,
  dirty: false,
  saveTimer: null,
  syncTimer: null,
};

const els = {
  loginScreen: document.querySelector("#loginScreen"),
  loginNameInput: document.querySelector("#loginNameInput"),
  guestLoginBtn: document.querySelector("#guestLoginBtn"),
  loginStatus: document.querySelector("#loginStatus"),
  loginHelpBtn: document.querySelector("#loginHelpBtn"),
  playerNameLabel: document.querySelector("#playerNameLabel"),
  profileBtn: document.querySelector("#profileBtn"),
  leaderboardBtn: document.querySelector("#leaderboardBtn"),
  board: document.querySelector("#board"),
  queue: document.querySelector("#queue"),
  drinkDexBtn: document.querySelector("#drinkDexBtn"),
  drinkDexIcon: document.querySelector("#drinkDexIcon"),
  drinkDexLevel: document.querySelector("#drinkDexLevel"),
  drinkDexPanel: document.querySelector("#drinkDexPanel"),
  drinkDexGrid: document.querySelector("#drinkDexGrid"),
  drinkDexClose: document.querySelector("#drinkDexClose"),
  score: document.querySelector("#score"),
  coin: document.querySelector("#coin"),
  energy: document.querySelector("#energy"),
  level: document.querySelector("#level"),
  message: document.querySelector("#message"),
  trashBtn: document.querySelector("#trashBtn"),
  tongsBtn: document.querySelector("#tongsBtn"),
  trashCount: document.querySelector("#trashCount"),
  tongsCount: document.querySelector("#tongsCount"),
  scoreFill: document.querySelector("#scoreFill"),
  scoreTarget: document.querySelector("#scoreTarget"),
  challengeCount: document.querySelector("#challengeCount"),
  bestScore: document.querySelector("#bestScore"),
  combo: document.querySelector("#combo"),
  soundCue: document.querySelector("#soundCue"),
  newGameBtn: document.querySelector("#newGameBtn"),
  overlay: document.querySelector("#overlay"),
  modalTitle: document.querySelector("#modalTitle"),
  modalText: document.querySelector("#modalText"),
  modalBtn: document.querySelector("#modalBtn"),
  effects: document.querySelector("#effects"),
  profilePanel: document.querySelector("#profilePanel"),
  profileClose: document.querySelector("#profileClose"),
  profileNameInput: document.querySelector("#profileNameInput"),
  profilePhoneInput: document.querySelector("#profilePhoneInput"),
  saveProfileBtn: document.querySelector("#saveProfileBtn"),
  profileStatus: document.querySelector("#profileStatus"),
  leaderboardPanel: document.querySelector("#leaderboardPanel"),
  leaderboardClose: document.querySelector("#leaderboardClose"),
  scoreRankTab: document.querySelector("#scoreRankTab"),
  cupRankTab: document.querySelector("#cupRankTab"),
  leaderboardList: document.querySelector("#leaderboardList"),
  leaderboardStatus: document.querySelector("#leaderboardStatus"),
};

function makeGuestName() {
  return `游客${Math.floor(1000 + Math.random() * 9000)}`;
}

function makeGuestKey() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `guest-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadProfile() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(PROFILE_KEY) || "null");
    if (saved?.guestKey) {
      return {
        guestKey: saved.guestKey,
        playerId: saved.playerId || null,
        displayName: saved.displayName || makeGuestName(),
        phone: saved.phone || "",
        hasEntered: Boolean(saved.hasEntered),
      };
    }
  } catch {
    // Fall through to a fresh local guest profile.
  }
  return {
    guestKey: makeGuestKey(),
    playerId: null,
    displayName: makeGuestName(),
    phone: "",
    hasEntered: false,
  };
}

function saveLocalProfile() {
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

function renderProfile() {
  els.playerNameLabel.textContent = profile.displayName;
  els.loginNameInput.value = profile.displayName;
  els.profileNameInput.value = profile.displayName;
  els.profilePhoneInput.value = profile.phone || "";
}

async function isDisplayNameAvailable(name) {
  if (!supabaseClient) {
    return { ok: false, message: "当前网络组件未加载，暂时不能校验昵称是否重复。" };
  }
  const { data, error } = await supabaseClient
    .from(PLAYERS_TABLE)
    .select("id, guest_key")
    .ilike("display_name", name)
    .neq("guest_key", profile.guestKey)
    .limit(1);
  if (error) return { ok: false, message: `昵称校验失败：${error.message}` };
  if (data?.length) return { ok: false, message: "这个昵称已经被使用了，请换一个。" };
  return { ok: true, message: "" };
}

function showLoginIfNeeded() {
  if (profile.hasEntered) {
    els.loginScreen.classList.add("hidden");
    return;
  }
  els.loginScreen.classList.remove("hidden");
}

async function syncProfile() {
  saveLocalProfile();
  renderProfile();
  if (!supabaseClient) {
    setNetworkStatus("离线本地模式：Supabase SDK 未加载，玩法不受影响。");
    return false;
  }
  const nameCheck = await isDisplayNameAvailable(profile.displayName);
  if (!nameCheck.ok) {
    setNetworkStatus(nameCheck.message);
    return false;
  }
  const record = {
    guest_key: profile.guestKey,
    display_name: profile.displayName,
    phone: profile.phone || null,
  };
  const { data, error } = await supabaseClient
    .from(PLAYERS_TABLE)
    .upsert(record, { onConflict: "guest_key" })
    .select("id, display_name, phone")
    .single();
  if (error) {
    const duplicateName = error.code === "23505" || error.message?.includes("display_name");
    setNetworkStatus(duplicateName ? "这个昵称已经被使用了，请换一个。" : `同步失败：${error.message}`);
    return false;
  }
  profile.playerId = data.id;
  profile.displayName = data.display_name || profile.displayName;
  profile.phone = data.phone || "";
  saveLocalProfile();
  renderProfile();
  setNetworkStatus("资料已同步。");
  return true;
}

function setNetworkStatus(text) {
  if (els.loginStatus) els.loginStatus.textContent = text;
  if (els.profileStatus) els.profileStatus.textContent = text;
}

function syncTimeLabel() {
  return new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function setLeaderboardStatus(text) {
  if (els.leaderboardStatus) els.leaderboardStatus.textContent = text;
}

function openProfilePanel() {
  renderProfile();
  els.profileStatus.textContent = supabaseClient ? "可修改昵称，手机号可选填。" : "当前离线本地保存，联网后会同步。";
  els.profilePanel.classList.remove("hidden");
}

function closePanel(panel) {
  panel.classList.add("hidden");
  if (panel === els.leaderboardPanel) stopLeaderboardAutoRefresh();
}

function serializableState() {
  return {
    board: state.board,
    queue: state.queue,
    score: state.score,
    coin: state.coin,
    energy: state.energy,
    level: state.level,
    lastUnlockedLevel: state.lastUnlockedLevel,
    bestFullLevel: state.bestFullLevel,
    combo: state.combo,
    bestCombo: state.bestCombo,
    fullCount: state.fullCount,
    trash: state.trash,
    tongs: state.tongs,
    challengeCards: state.challengeCards,
    bestScore: state.bestScore,
    remoteResultId: state.remoteResultId,
  };
}

function saveGameProgress() {
  if (state.ended) return;
  window.localStorage.setItem(SAVE_KEY, JSON.stringify(serializableState()));
}

function markProgressChanged() {
  state.dirty = true;
  saveGameProgress();
}

function scheduleGameSave() {
  state.dirty = true;
  window.clearTimeout(state.saveTimer);
  state.saveTimer = window.setTimeout(saveGameProgress, 160);
}

function loadGameProgress() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(SAVE_KEY) || "null");
    if (!saved?.board || !saved?.queue) return false;
    state.board = saved.board;
    state.queue = saved.queue;
    state.score = saved.score || 0;
    state.coin = saved.coin || 0;
    state.energy = saved.energy ?? START_ENERGY;
    state.level = saved.level || 1;
    state.lastUnlockedLevel = saved.lastUnlockedLevel || state.level;
    state.bestFullLevel = saved.bestFullLevel || 0;
    state.combo = saved.combo || 0;
    state.bestCombo = saved.bestCombo || 0;
    state.fullCount = saved.fullCount || 0;
    state.trash = saved.trash ?? 2;
    state.tongs = saved.tongs ?? 2;
    state.challengeCards = saved.challengeCards || 0;
    state.bestScore = saved.bestScore || 0;
    state.remoteResultId = saved.remoteResultId || null;
    state.ended = false;
    state.locked = false;
    state.queueFresh = false;
    state.resultSubmitted = false;
    state.cue = "待机";
    return true;
  } catch {
    return false;
  }
}

function clearGameProgress() {
  window.localStorage.removeItem(SAVE_KEY);
}

function flushGameProgress() {
  if (!state.ended) saveGameProgress();
}

async function syncGameSnapshot({ final = false } = {}) {
  if (!supabaseClient) {
    setLeaderboardStatus("Supabase SDK 未加载，成绩暂未联网同步。");
    return;
  }
  if (!state.dirty && !final && state.remoteResultId) return;
  const result = {
    score: state.score,
    bestFullLevel: state.bestFullLevel || 1,
    fullCount: state.fullCount,
    bestCombo: state.bestCombo,
  };
  const synced = profile.playerId ? true : await syncProfile();
  if (!synced || !profile.playerId) {
    setLeaderboardStatus("玩家资料未同步，成绩暂未上传。");
    return;
  }
  const bestDrink = drinkTypes[Math.max(0, result.bestFullLevel - 1)] || drinkTypes[0];
  const payload = {
    player_id: profile.playerId,
    score: result.score,
    best_cup_level: result.bestFullLevel,
    best_cup_name: bestDrink.name,
    full_count: result.fullCount,
    best_combo: result.bestCombo,
  };
  const request = state.remoteResultId
    ? supabaseClient.from(RESULTS_TABLE).update(payload).eq("id", state.remoteResultId).select("id").maybeSingle()
    : supabaseClient.from(RESULTS_TABLE).insert(payload).select("id").single();
  const { data, error } = await request;
  if (error) {
    const message = `成绩同步失败：${error.message}`;
    setNetworkStatus(message);
    setLeaderboardStatus(message);
  }
  if (!error && state.remoteResultId && !data) {
    state.remoteResultId = null;
    state.dirty = true;
    await syncGameSnapshot({ final });
    return;
  }
  if (!error) {
    if (data?.id) state.remoteResultId = data.id;
    state.dirty = false;
    saveGameProgress();
    setLeaderboardStatus(`成绩已同步 ${syncTimeLabel()}，排行榜自动刷新中。`);
    if (!els.leaderboardPanel.classList.contains("hidden")) void loadLeaderboard(leaderboardMode, { silent: true });
  }
}

async function submitGameResult() {
  if (state.resultSubmitted) return;
  state.resultSubmitted = true;
  await syncGameSnapshot({ final: true });
}

function startRealtimeSync() {
  window.clearInterval(state.syncTimer);
  void syncGameSnapshot();
  state.syncTimer = window.setInterval(() => {
    void syncGameSnapshot();
  }, REMOTE_SYNC_INTERVAL);
}

function renderLeaderboardRows(rows) {
  if (!rows?.length) {
    els.leaderboardList.innerHTML = `<div class="empty-rank">暂无排行数据</div>`;
    return;
  }
  els.leaderboardList.innerHTML = rows
    .map((row, index) => {
      const player = row.player?.display_name || row.starlight_players?.display_name || row.players?.display_name || "游客";
      const main = leaderboardMode === "score" ? row.score : `Lv.${row.best_cup_level} ${row.best_cup_name}`;
      const sub = leaderboardMode === "score" ? `最高酒杯 Lv.${row.best_cup_level}` : `单局积分 ${row.score}`;
      return `<div class="rank-row">
        <strong>${index + 1}</strong>
        <span>${player}</span>
        <em>${main}</em>
        <small>${sub}</small>
      </div>`;
    })
    .join("");
}

async function loadLeaderboard(mode = leaderboardMode, { silent = false } = {}) {
  leaderboardMode = mode;
  els.scoreRankTab.classList.toggle("active", mode === "score");
  els.cupRankTab.classList.toggle("active", mode === "cup");
  if (!silent) els.leaderboardList.innerHTML = `<div class="empty-rank">加载中...</div>`;
  if (!supabaseClient) {
    setLeaderboardStatus("Supabase SDK 未加载，排行榜暂不可用。");
    renderLeaderboardRows([]);
    return;
  }
  let query = supabaseClient
    .from(RESULTS_TABLE)
    .select("score,best_cup_level,best_cup_name,created_at,player:starlight_players(display_name)")
    .limit(20);
  query = mode === "score"
    ? query.order("score", { ascending: false }).order("best_cup_level", { ascending: false })
    : query.order("best_cup_level", { ascending: false }).order("score", { ascending: false });
  let { data, error } = await query;
  if (error && error.message?.includes("display_name")) {
    let fallbackQuery = supabaseClient
      .from(RESULTS_TABLE)
      .select("score,best_cup_level,best_cup_name,created_at")
      .limit(20);
    fallbackQuery = mode === "score"
      ? fallbackQuery.order("score", { ascending: false }).order("best_cup_level", { ascending: false })
      : fallbackQuery.order("best_cup_level", { ascending: false }).order("score", { ascending: false });
    const fallback = await fallbackQuery;
    data = fallback.data;
    error = fallback.error;
    if (!error) {
      setLeaderboardStatus(`排行榜已刷新 ${syncTimeLabel()}；数据库缺少昵称字段，当前先显示游客名。`);
      renderLeaderboardRows(data);
      return;
    }
  }
  if (error) {
    setLeaderboardStatus(`排行榜读取失败：${error.message}`);
    renderLeaderboardRows([]);
    return;
  }
  setLeaderboardStatus(mode === "score" ? `按单局酣畅值排序，已刷新 ${syncTimeLabel()}。` : `按最高酒杯等级排序，已刷新 ${syncTimeLabel()}。`);
  renderLeaderboardRows(data);
}

function openLeaderboardPanel() {
  els.leaderboardPanel.classList.remove("hidden");
  void loadLeaderboard(leaderboardMode);
  startLeaderboardAutoRefresh();
}

function startLeaderboardAutoRefresh() {
  stopLeaderboardAutoRefresh();
  leaderboardRefreshTimer = window.setInterval(() => {
    if (!els.leaderboardPanel.classList.contains("hidden")) void loadLeaderboard(leaderboardMode, { silent: true });
  }, 5000);
}

function stopLeaderboardAutoRefresh() {
  window.clearInterval(leaderboardRefreshTimer);
  leaderboardRefreshTimer = null;
}

function scoreRating(score) {
  if (score >= 12000) return "传奇调酒师";
  if (score >= 6400) return "星冠调酒师";
  if (score >= 3000) return "金牌调酒师";
  if (score >= 900) return "进阶调酒师";
  return "见习调酒师";
}

async function fetchScoreRank(score) {
  if (!supabaseClient) return null;
  const { count, error } = await supabaseClient
    .from(RESULTS_TABLE)
    .select("id", { count: "exact", head: true })
    .gt("score", score);
  if (error) return null;
  return (count || 0) + 1;
}

function startGame({ restore = false } = {}) {
  const restored = restore && loadGameProgress();
  if (restored) {
    els.overlay.classList.add("hidden");
    cleanupPointerDrag();
    setMessage("已恢复上次进度，继续调制吧。");
    render();
    startRealtimeSync();
    return;
  }
  clearGameProgress();
  state.board = Array.from({ length: ROWS * COLS }, () => null);
  state.queue = [];
  state.drag = null;
  state.hoverIndex = null;
  state.tool = null;
  state.score = 0;
  state.coin = 0;
  state.energy = START_ENERGY;
  state.level = 1;
  state.lastUnlockedLevel = 1;
  state.bestFullLevel = 0;
  state.combo = 0;
  state.bestCombo = 0;
  state.fullCount = 0;
  state.trash = 2;
  state.tongs = 2;
  state.challengeCards = 0;
  state.bestScore = Math.max(state.bestScore, state.score);
  state.ended = false;
  state.locked = false;
  state.queueFresh = true;
  state.resultSubmitted = false;
  state.remoteResultId = null;
  state.dirty = true;
  state.cue = "待机";
  els.overlay.classList.add("hidden");
  cleanupPointerDrag();
  spawnQueue();
  setMessage("拖动吧台托盘到桌面空格，绿色格子表示会触发合并。");
  render();
  scheduleGameSave();
  startRealtimeSync();
}

function availableDrinks() {
  return drinkTypes.filter((drink) => drink.unlock <= state.level);
}

function randomDrink() {
  const pool = availableDrinks();
  return pool[Math.floor(Math.random() * pool.length)];
}

function makeTray() {
  const cups = [];
  const drinkCount = 2 + Math.floor(Math.random() * 4);
  const primary = randomDrink();
  for (let i = 0; i < drinkCount; i += 1) {
    cups.push(Math.random() < 0.68 ? primary.id : randomDrink().id);
  }
  return cups;
}

function spawnQueue() {
  state.queue = Array.from({ length: 3 }, () => makeTray());
  state.queueFresh = true;
}

function render() {
  renderStats();
  renderBoard();
  renderQueue();
  renderLegend();
}

function renderStats() {
  els.score.textContent = state.score;
  els.coin.textContent = state.coin;
  els.energy.textContent = state.energy;
  els.level.textContent = state.level;
  const target = levelThresholds[Math.min(state.level, levelThresholds.length - 1)] || levelThresholds[levelThresholds.length - 1];
  const previousTarget = levelThresholds[Math.max(0, state.level - 1)] || 0;
  const progress = target > previousTarget ? (state.score - previousTarget) / (target - previousTarget) : 1;
  els.scoreTarget.textContent = target;
  els.scoreFill.style.width = `${Math.max(0, Math.min(1, progress)) * 100}%`;
  els.challengeCount.textContent = state.challengeCards;
  state.bestScore = Math.max(state.bestScore, state.score);
  els.bestScore.textContent = state.bestScore;
  els.trashCount.textContent = state.trash;
  els.tongsCount.textContent = state.tongs;
  els.combo.textContent = `连击 x${state.combo}`;
  els.combo.classList.toggle("active", state.combo > 1);
  els.soundCue.textContent = `音效：${state.cue}`;
  els.soundCue.classList.toggle("active", state.cue !== "待机");
  els.trashBtn.classList.toggle("active", state.tool === "trash");
  els.tongsBtn.classList.toggle("active", state.tool === "tongs");
  els.trashBtn.disabled = state.trash <= 0 || state.ended || state.locked;
  els.tongsBtn.disabled = state.tongs <= 0 || state.ended || state.locked;
}

function renderBoard() {
  els.board.innerHTML = "";
  state.board.forEach((tray, index) => {
    const slot = document.createElement("button");
    slot.type = "button";
    slot.className = boardSlotClass(tray, index);
    slot.dataset.index = index;
    slot.addEventListener("dragover", (event) => onSlotDragOver(event, index));
    slot.addEventListener("dragleave", () => {
      if (state.hoverIndex === index) state.hoverIndex = null;
      refreshBoardClasses();
    });
    slot.addEventListener("drop", (event) => onSlotDrop(event, index));
    slot.addEventListener("click", () => onBoardClick(index));

    if (tray) {
      const trayEl = createTray(tray);
      trayEl.dataset.boardIndex = index;
      trayEl.draggable = false;
      trayEl.addEventListener("dragstart", (event) => onBoardDragStart(event, index));
      trayEl.addEventListener("dragend", onDragEnd);
      trayEl.addEventListener("pointerdown", (event) => onBoardPointerDown(event, index));
      slot.appendChild(trayEl);
    }
    els.board.appendChild(slot);
  });
}

function boardSlotClass(tray, index) {
  const classes = ["slot"];
  if (!tray) classes.push("empty");
  if (state.drag?.type === "queue" && !tray) {
    classes.push("potential-drop");
    if (willMergeAt(index, state.queue[state.drag.index])) classes.push("merge-place");
  }
  if (state.drag?.type === "board" && state.tool === "tongs") {
    classes.push(index === state.drag.index ? "invalid" : "potential-drop");
  }
  if (state.hoverIndex === index) classes.push(tray && state.drag?.type === "queue" ? "invalid" : "hovered");
  return classes.join(" ");
}

function renderQueue() {
  els.queue.innerHTML = "";
  state.queue.forEach((tray, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "queue-slot";
    if (tray) {
      const trayEl = createTray(tray);
      trayEl.dataset.queueIndex = index;
      trayEl.draggable = false;
      if (state.drag?.type === "queue" && state.drag.index === index) trayEl.classList.add("dragging");
      if (state.queueFresh) trayEl.classList.add("new");
      trayEl.addEventListener("dragstart", (event) => onQueueDragStart(event, index));
      trayEl.addEventListener("dragend", onDragEnd);
      trayEl.addEventListener("pointerdown", (event) => onQueuePointerDown(event, index));
      wrapper.appendChild(trayEl);
    }
    els.queue.appendChild(wrapper);
  });
  state.queueFresh = false;
}

function renderLegend() {
  const bestDrink = drinkTypes
    .filter((drink) => drink.unlock <= state.level)
    .sort((a, b) => drinkLevel(b) - drinkLevel(a))[0] || drinkTypes[0];
  els.drinkDexIcon.src = bestDrink.icon;
  els.drinkDexLevel.textContent = `Lv.${drinkLevel(bestDrink)} ${bestDrink.name}`;
  els.drinkDexGrid.innerHTML = "";
  drinkTypes.forEach((drink) => {
    const item = document.createElement("div");
    item.className = "drink-card";
    if (drink.unlock <= state.level) item.classList.add("unlocked");
    item.innerHTML = `<img src="${drink.icon}" alt=""><strong>Lv.${drinkLevel(drink)}</strong><span>${drink.name}</span><span>${drink.base}</span>`;
    els.drinkDexGrid.appendChild(item);
  });
}

function createTray(cups) {
  const tray = document.createElement("div");
  tray.className = "tray";
  const grid = document.createElement("div");
  grid.className = "cups";
  for (let i = 0; i < TRAY_CAPACITY; i += 1) {
    const cup = document.createElement("div");
    const drink = drinkTypes.find((item) => item.id === cups[i]);
    cup.className = `cup ${drink ? "" : "empty-cup"}`;
    cup.dataset.position = i + 1;
    if (drink) {
      const image = document.createElement("img");
      image.className = "cup-img";
      image.src = drink.icon;
      image.alt = "";
      cup.appendChild(image);
      cup.setAttribute("aria-label", drink.name);
    }
    grid.appendChild(cup);
  }
  tray.appendChild(grid);
  return tray;
}

function onQueuePointerDown(event, index) {
  if (state.locked || state.ended || state.tool === "trash" || !state.queue[index]) return;
  beginPointerDrag(event, { type: "queue", index }, state.queue[index]);
  setMessage("拖到桌面空格；绿色格子会产生合并。");
  playCue("拿起托盘");
}

function onBoardPointerDown(event, index) {
  if (state.locked || state.ended || state.tool !== "tongs" || !state.board[index]) {
    if (state.tool === "tongs") shakeSlot(index, "夹子模式下才能拖动桌面托盘。");
    return;
  }
  beginPointerDrag(event, { type: "board", index }, state.board[index]);
  setMessage("把托盘拖到空格或另一个托盘上，松手后移动/交换。");
  playCue("夹起托盘");
}

function beginPointerDrag(event, drag, cups) {
  event.preventDefault();
  cleanupPointerDrag();
  state.drag = drag;
  state.pointerDrag = {
    startX: event.clientX,
    startY: event.clientY,
    active: false,
    ghost: null,
    cups: [...cups],
  };
  event.currentTarget.classList.add("dragging");
  refreshBoardClasses();
  document.addEventListener("pointermove", onPointerMove);
  document.addEventListener("pointerup", onPointerUp);
}

function onPointerMove(event) {
  if (!state.pointerDrag || !state.drag) return;
  const moved = Math.hypot(event.clientX - state.pointerDrag.startX, event.clientY - state.pointerDrag.startY);
  if (!state.pointerDrag.active && moved > 4) {
    state.pointerDrag.active = true;
    state.pointerDrag.ghost = createTray(state.pointerDrag.cups);
    state.pointerDrag.ghost.classList.add("floating-drag");
    els.effects.appendChild(state.pointerDrag.ghost);
  }
  if (state.pointerDrag.ghost) {
    state.pointerDrag.ghost.style.left = `${event.clientX}px`;
    state.pointerDrag.ghost.style.top = `${event.clientY}px`;
  }
  const slot = findSlotFromPoint(event.clientX, event.clientY);
  state.hoverIndex = slot ? Number(slot.dataset.index) : null;
  refreshBoardClasses();
}

function onPointerUp() {
  if (!state.pointerDrag || !state.drag) return;
  const drag = { ...state.drag };
  const targetIndex = state.hoverIndex;
  const wasActive = state.pointerDrag.active;
  cleanupPointerDrag();
  if (!wasActive || targetIndex === null || targetIndex === undefined) {
    setMessage("拖动托盘到桌面格子后松手。");
    render();
    return;
  }
  if (drag.type === "queue") {
    void placeQueueTray(drag.index, targetIndex);
    return;
  }
  if (drag.type === "board") {
    void moveBoardTray(drag.index, targetIndex);
  }
}

function cleanupPointerDrag() {
  document.removeEventListener?.("pointermove", onPointerMove);
  document.removeEventListener?.("pointerup", onPointerUp);
  state.pointerDrag?.ghost?.remove();
  state.pointerDrag = null;
  state.drag = null;
  state.hoverIndex = null;
}

function findSlotFromPoint(x, y) {
  let node = document.elementFromPoint?.(x, y);
  while (node) {
    if (node.dataset?.index !== undefined) return node;
    node = node.parentElement;
  }
  return null;
}

function onQueueDragStart(event, index) {
  if (state.locked || state.ended || !state.queue[index]) {
    event.preventDefault();
    return;
  }
  state.tool = null;
  state.drag = { type: "queue", index };
  setDragData(event, "queue", index);
  event.currentTarget.classList.add("dragging");
  setMessage("拖到桌面空格；绿色格子会产生合并。");
  playCue("拿起托盘");
  refreshBoardClasses();
}

function onBoardDragStart(event, index) {
  if (state.locked || state.ended || state.tool !== "tongs" || !state.board[index]) {
    event.preventDefault();
    shakeSlot(index, "夹子模式下才能拖动桌面托盘。");
    return;
  }
  state.drag = { type: "board", index };
  setDragData(event, "board", index);
  event.currentTarget.classList.add("dragging");
  setMessage("把托盘拖到空格或另一个托盘上，松手后移动/交换。");
  playCue("夹起托盘");
  refreshBoardClasses();
}

function setDragData(event, type, index) {
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", `${type}:${index}`);
  if (event.currentTarget) {
    event.dataTransfer.setDragImage(event.currentTarget, event.currentTarget.offsetWidth / 2, event.currentTarget.offsetHeight / 2);
  }
}

function onSlotDragOver(event, index) {
  if (!state.drag || state.locked || state.ended) return;
  event.preventDefault();
  state.hoverIndex = index;
  event.dataTransfer.dropEffect = canDropAt(index) ? "move" : "none";
  refreshBoardClasses();
}

async function onSlotDrop(event, index) {
  event.preventDefault();
  if (!state.drag || state.locked || state.ended) return;
  const drag = { ...state.drag };
  state.drag = null;
  state.hoverIndex = null;
  render();

  if (drag.type === "queue") {
    await placeQueueTray(drag.index, index);
    return;
  }
  if (drag.type === "board") {
    await moveBoardTray(drag.index, index);
  }
}

function onDragEnd() {
  state.drag = null;
  state.hoverIndex = null;
  render();
}

function refreshBoardClasses() {
  state.board.forEach((tray, index) => {
    const slot = slotEl(index);
    if (slot) slot.className = boardSlotClass(tray, index);
  });
}

function canDropAt(index) {
  if (!state.drag) return false;
  if (state.drag.type === "queue") return !state.board[index];
  return state.drag.type === "board" && index !== state.drag.index && state.tool === "tongs";
}

async function placeQueueTray(queueIndex, boardIndex) {
  if (!state.queue[queueIndex]) return;
  if (state.board[boardIndex]) {
    shakeSlot(boardIndex, "这里已经有托盘了，请拖到空桌位。");
    playCue("无效操作");
    return;
  }
  lockInput();
  state.board[boardIndex] = [...state.queue[queueIndex]];
  state.queue[queueIndex] = null;
  spendEnergy(1);
  markProgressChanged();
  playCue("放置");
  render();
  await animateSlot(boardIndex, "landed");
  await resolveBoard(boardIndex);
  await afterMove();
  scheduleGameSave();
  void syncGameSnapshot();
  unlockInput();
}

async function moveBoardTray(fromIndex, toIndex) {
  if (!state.board[fromIndex]) return;
  if (fromIndex === toIndex) {
    shakeSlot(toIndex, "不能放回原位。");
    return;
  }
  lockInput();
  const movingTray = state.board[fromIndex];
  state.board[fromIndex] = state.board[toIndex];
  state.board[toIndex] = movingTray;
  state.tongs -= 1;
  state.tool = null;
  markProgressChanged();
  playCue("夹子");
  render();
  await animateSlot(toIndex, "landed");
  await resolveBoard(toIndex);
  if (state.board[fromIndex]) await resolveBoard(fromIndex);
  await afterMove(false);
  scheduleGameSave();
  void syncGameSnapshot();
  unlockInput();
}

function onBoardClick(index) {
  if (state.ended || state.locked) return;
  if (state.tool !== "trash") {
    shakeSlot(index, "请拖动托盘进行放置。");
    playCue("无效操作");
    return;
  }
  useTrash(index);
}

async function useTrash(index) {
  if (!state.board[index]) {
    shakeSlot(index, "垃圾桶只能移除桌面上的托盘。");
    playCue("无效操作");
    return;
  }
  lockInput();
  await animateSlot(index, "removing");
  state.board[index] = null;
  state.trash -= 1;
  state.tool = null;
  markProgressChanged();
  playCue("垃圾桶");
  setMessage("已移除一个托盘。");
  await afterMove(false);
  scheduleGameSave();
  void syncGameSnapshot();
  unlockInput();
}

async function resolveBoard(centerIndex) {
  let changed = true;
  let guard = 0;
  while (changed && guard < 14) {
    changed = false;
    guard += 1;
    for (const index of mergeOrder(centerIndex)) {
      if (!state.board[index]) continue;
      const action = findMergeAround(index);
      if (!action) continue;
      await playMerge(action);
      applyMerge(action);
      changed = true;
      clearEmptyTrays();
      render();
      await wait(160);
      await collectFullTrays();
    }
  }
}

function mergeOrder(index) {
  const row = Math.floor(index / COLS);
  const col = index % COLS;
  return [
    [row, col],
    [row - 1, col],
    [row + 1, col],
    [row, col - 1],
    [row, col + 1],
  ]
    .filter(([r, c]) => r >= 0 && r < ROWS && c >= 0 && c < COLS)
    .map(([r, c]) => r * COLS + c);
}

function findMergeAround(index) {
  for (const neighbor of mergeOrder(index).slice(1)) {
    const action = makeMergeAction(index, neighbor);
    if (action && action.amount > 0) return action;
  }
  return null;
}

function makeMergeAction(firstIndex, secondIndex) {
  const first = state.board[firstIndex];
  const second = state.board[secondIndex];
  if (!first || !second) return null;
  const shared = [...new Set(first)].filter((drinkId) => second.includes(drinkId));
  if (shared.length === 0) return null;

  let receiverIndex = firstIndex;
  let donorIndex = secondIndex;
  const firstKinds = new Set(first).size;
  const secondKinds = new Set(second).size;
  if (firstKinds > secondKinds) {
    receiverIndex = secondIndex;
    donorIndex = firstIndex;
  } else if (firstKinds === secondKinds) {
    const drinkId = shared[0];
    if (countDrink(first, drinkId) < countDrink(second, drinkId)) {
      receiverIndex = secondIndex;
      donorIndex = firstIndex;
    }
  }

  const receiver = state.board[receiverIndex];
  const donor = state.board[donorIndex];
  const drinkId = shared.find((id) => receiver.includes(id) && donor.includes(id));
  if (!drinkId) return null;
  const amount = Math.min(TRAY_CAPACITY - receiver.length, countDrink(donor, drinkId));
  return amount > 0 ? { receiverIndex, donorIndex, drinkId, amount } : null;
}

async function playMerge(action) {
  const drink = findDrink(action.drinkId);
  flashSlots([action.receiverIndex, action.donorIndex]);
  setMessage(`${drink.name}合并 x${action.amount}`);
  playCue("合并");
  for (let i = 0; i < action.amount; i += 1) {
    flyCup(action.donorIndex, action.receiverIndex, drink, i * 90);
  }
  await wait(620 + action.amount * 90);
}

function applyMerge(action) {
  const receiver = state.board[action.receiverIndex];
  const donor = state.board[action.donorIndex];
  for (let i = 0; i < action.amount; i += 1) {
    receiver.push(action.drinkId);
    donor.splice(donor.indexOf(action.drinkId), 1);
  }
}

async function collectFullTrays() {
  let collected = false;
  for (let index = 0; index < state.board.length; index += 1) {
    const tray = state.board[index];
    if (!tray || tray.length !== TRAY_CAPACITY || !tray.every((id) => id === tray[0])) continue;
    const drink = findDrink(tray[0]);
    const gained = Math.round(drink.base * (1 + state.combo * 0.18));
    state.combo += 1;
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    state.fullCount += 1;
    state.score += gained;
    state.coin += Math.ceil(gained / 10);
    state.challengeCards += Math.max(1, drinkLevel(drink));
    state.bestFullLevel = Math.max(state.bestFullLevel, drinkLevel(drink));
    setMessage(`${drink.name}满盘！接待完成，酣畅值 +${gained}。`);
    playCue(state.combo > 1 ? `连击 x${state.combo}` : "满盘");
    markProgressChanged();
    render();
    burstAtSlot(index);
    floatTextAtSlot(index, `+${gained}`);
    await animateSlot(index, "full");
    state.board[index] = null;
    collected = true;
    render();
    await checkLevelUp();
    scheduleGameSave();
    void syncGameSnapshot();
  }
  return collected;
}

async function checkLevelUp() {
  const nextLevel = Math.min(14, state.level + 1);
  if (nextLevel === state.level || state.score < levelThresholds[nextLevel - 1]) return;
  state.level = nextLevel;
  state.lastUnlockedLevel = nextLevel;
  playCue("升级");
  setMessage(`解锁 Lv.${state.level} 美酒，新的酒杯会进入后续托盘。`);
  render();
  floatTextNearHeader(`解锁 Lv.${state.level}`);
  await wait(720);
}

function removeLowestDrink() {
  const boardIds = state.board.flatMap((tray) => tray || []);
  const lowestDrink = drinkTypes
    .filter((drink) => boardIds.includes(drink.id))
    .sort((a, b) => a.unlock - b.unlock)[0];
  const lowest = lowestDrink?.id;
  let removed = 0;
  if (!lowest) return 0;
  state.board = state.board.map((tray) => {
    if (!tray) return null;
    const kept = tray.filter((id) => {
      if (id === lowest) {
        removed += 1;
        return false;
      }
      return true;
    });
    return kept.length ? kept : null;
  });
  if (removed > 0) state.score += removed * 20;
  return removed;
}

async function afterMove(shouldSpawn = true) {
  clearEmptyTrays();
  if (shouldSpawn && state.queue.every((tray) => !tray)) {
    state.combo = 0;
    spawnQueue();
    playCue("刷新托盘");
    setMessage("吧台刷新了 3 个新托盘。");
    render();
    await wait(380);
  }
  if (!hasLegalMove()) {
    endGame();
    return;
  }
  render();
}

function hasLegalMove() {
  const hasQueueTray = state.queue.some(Boolean);
  const hasEmptySlot = state.board.some((tray) => !tray);
  return (hasQueueTray && hasEmptySlot) || state.trash > 0 || state.tongs > 0;
}

function willMergeAt(index, tray) {
  if (!tray || state.board[index]) return false;
  return mergeOrder(index).slice(1).some((neighbor) => {
    const other = state.board[neighbor];
    return other && tray.some((id) => other.includes(id));
  });
}

function spendEnergy(amount) {
  state.energy = Math.max(0, state.energy - amount);
}

function clearEmptyTrays() {
  state.board = state.board.map((tray) => (tray && tray.length > 0 ? tray : null));
}

function countDrink(tray, drinkId) {
  return tray.filter((id) => id === drinkId).length;
}

function findDrink(drinkId) {
  return drinkTypes.find((drink) => drink.id === drinkId);
}

function drinkLevel(drink) {
  return Number(drink.id.replace("level", "")) || drink.unlock;
}

function lockInput() {
  state.locked = true;
  render();
}

function unlockInput() {
  state.locked = false;
  state.drag = null;
  state.hoverIndex = null;
  render();
}

function setMessage(text) {
  els.message.textContent = text;
}

function playCue(name) {
  state.cue = name;
  playTone(name);
  renderStats();
  window.clearTimeout(playCue.timer);
  playCue.timer = window.setTimeout(() => {
    state.cue = "待机";
    renderStats();
  }, 900);
}

function playTone(name) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  try {
    state.audio ||= new AudioContext();
    const context = state.audio;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const toneMap = {
      放置: 420,
      合并: 620,
      满盘: 860,
      升级: 980,
      失败: 180,
      垃圾桶: 260,
      夹子: 520,
      刷新托盘: 700,
      无效操作: 150,
    };
    oscillator.frequency.value = toneMap[name] || (name.startsWith("连击") ? 920 : 360);
    oscillator.type = name === "失败" || name === "无效操作" ? "sawtooth" : "sine";
    gain.gain.setValueAtTime(0.001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.045, context.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.14);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.16);
  } catch {
    // The visible cue above is the fallback when browser audio is blocked.
  }
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function animateSlot(index, className) {
  const slot = slotEl(index);
  const tray = slot?.querySelector(".tray");
  const target = tray || slot;
  target?.classList.add(className);
  await wait(className === "full" ? 620 : 320);
  target?.classList.remove(className);
}

function flashSlots(indexes) {
  indexes.forEach((index) => {
    const slot = slotEl(index);
    slot?.classList.add("flash");
    window.setTimeout(() => slot?.classList.remove("flash"), 520);
  });
}

function shakeSlot(index, message) {
  const slot = slotEl(index);
  slot?.classList.add("shake");
  window.setTimeout(() => slot?.classList.remove("shake"), 320);
  setMessage(message);
}

function flyCup(fromIndex, toIndex, drink, delay) {
  const from = centerOf(slotEl(fromIndex));
  const to = centerOf(slotEl(toIndex));
  if (!from || !to) return;
  const el = document.createElement("div");
  el.className = "fly-cup";
  el.style.backgroundImage = `url("${drink.icon}")`;
  el.setAttribute("aria-label", drink.name);
  el.style.left = `${from.x - 19}px`;
  el.style.top = `${from.y - 19}px`;
  els.effects.appendChild(el);
  window.setTimeout(() => {
    el.style.transform = `translate(${to.x - from.x}px, ${to.y - from.y}px) scale(0.78)`;
    el.style.opacity = "0.15";
  }, delay);
  window.setTimeout(() => el.remove(), delay + 430);
}

function burstAtSlot(index) {
  const center = centerOf(slotEl(index));
  if (!center) return;
  const el = document.createElement("div");
  el.className = "burst";
  el.style.left = `${center.x - 6}px`;
  el.style.top = `${center.y - 6}px`;
  els.effects.appendChild(el);
  window.setTimeout(() => el.remove(), 620);
}

function floatTextAtSlot(index, text) {
  const center = centerOf(slotEl(index));
  if (!center) return;
  createFloatText(text, center.x - 28, center.y - 28);
}

function floatTextNearHeader(text) {
  const rect = els.level.getBoundingClientRect();
  createFloatText(text, rect.left - 28, rect.top + 8);
}

function createFloatText(text, left, top) {
  const el = document.createElement("div");
  el.className = "float-text";
  el.textContent = text;
  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
  els.effects.appendChild(el);
  window.setTimeout(() => el.remove(), 900);
}

function centerOf(el) {
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function slotEl(index) {
  return els.board.querySelector(`[data-index="${index}"]`);
}

async function endGame() {
  state.ended = true;
  playCue("失败");
  render();
  clearGameProgress();
  els.modalTitle.textContent = "本局结算";
  els.modalText.innerHTML = [
    ["本局评价", scoreRating(state.score)],
    ["最终酣畅值", state.score],
    ["特调币", state.coin],
    ["最高美酒等级", `Lv.${state.bestFullLevel || 1}`],
    ["满盘次数", state.fullCount],
    ["最佳连击", `x${state.bestCombo}`],
    ["当前排名", "计算中..."],
  ]
    .map(([label, value]) => `<div><span>${label}</span><strong${label === "当前排名" ? ' id="finalRank"' : ""}>${value}</strong></div>`)
    .join("");
  els.overlay.classList.remove("hidden");
  await submitGameResult();
  const rank = await fetchScoreRank(state.score);
  const rankEl = document.querySelector("#finalRank");
  if (rankEl) rankEl.textContent = rank ? `第 ${rank} 名` : "暂未获取";
}

function restartGame() {
  void submitGameResult();
  startGame();
}

els.guestLoginBtn.addEventListener("click", async () => {
  const name = els.loginNameInput.value.trim();
  if (name) profile.displayName = name.slice(0, 16);
  profile.hasEntered = true;
  saveLocalProfile();
  renderProfile();
  els.loginStatus.textContent = "正在校验昵称...";
  const synced = await syncProfile();
  if (!synced) {
    profile.hasEntered = false;
    saveLocalProfile();
    return;
  }
  els.loginScreen.classList.add("hidden");
});

els.loginHelpBtn.addEventListener("click", () => {
  els.loginStatus.textContent = "直接游客进入即可开玩；昵称和手机号之后都能在头像按钮里改。";
});

els.profileBtn.addEventListener("click", openProfilePanel);
els.profileClose.addEventListener("click", () => closePanel(els.profilePanel));
els.profilePanel.addEventListener("click", (event) => {
  if (event.target === els.profilePanel) closePanel(els.profilePanel);
});
els.saveProfileBtn.addEventListener("click", async () => {
  const name = els.profileNameInput.value.trim();
  profile.displayName = name ? name.slice(0, 16) : makeGuestName();
  profile.phone = els.profilePhoneInput.value.trim();
  profile.hasEntered = true;
  els.profileStatus.textContent = "正在校验昵称...";
  await syncProfile();
});

els.leaderboardBtn.addEventListener("click", openLeaderboardPanel);
els.leaderboardClose.addEventListener("click", () => closePanel(els.leaderboardPanel));
els.leaderboardPanel.addEventListener("click", (event) => {
  if (event.target === els.leaderboardPanel) closePanel(els.leaderboardPanel);
});
els.scoreRankTab.addEventListener("click", () => loadLeaderboard("score"));
els.cupRankTab.addEventListener("click", () => loadLeaderboard("cup"));

els.trashBtn.addEventListener("click", () => {
  if (state.trash <= 0 || state.ended || state.locked) return;
  state.tool = state.tool === "trash" ? null : "trash";
  state.drag = null;
  setMessage(state.tool ? "选择桌面上的托盘移除。" : "已取消垃圾桶。");
  render();
});

els.tongsBtn.addEventListener("click", () => {
  if (state.tongs <= 0 || state.ended || state.locked) return;
  state.tool = state.tool === "tongs" ? null : "tongs";
  state.drag = null;
  setMessage(state.tool ? "夹子已启用，拖动桌面托盘来移动或交换。" : "已取消夹子。");
  render();
});

els.newGameBtn.addEventListener("click", restartGame);
els.modalBtn.addEventListener("click", startGame);
els.drinkDexBtn.addEventListener("click", () => {
  els.drinkDexPanel.classList.remove("hidden");
});
els.drinkDexClose.addEventListener("click", () => {
  els.drinkDexPanel.classList.add("hidden");
});
els.drinkDexPanel.addEventListener("click", (event) => {
  if (event.target === els.drinkDexPanel) els.drinkDexPanel.classList.add("hidden");
});
window.addEventListener("beforeunload", flushGameProgress);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") flushGameProgress();
});

renderProfile();
showLoginIfNeeded();
if (profile.hasEntered) void syncProfile();
startGame({ restore: true });
