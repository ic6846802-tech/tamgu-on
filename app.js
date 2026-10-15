import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

const $ = (id) => document.getElementById(id);
const authPanel = $("auth-panel");
const appPanel = $("app-panel");
const authMessage = $("auth-message");
const taskMessage = $("task-message");
let supabase = null;
let currentUser = null;

function say(el, text, kind = "") {
  el.textContent = text;
  el.className = `message ${kind}`.trim();
}
function setStatus(text, good = false) {
  $("connection-status").textContent = text;
  $("connection-status").classList.toggle("good", good);
}
function configured() {
  return SUPABASE_URL.startsWith("https://") &&
    !SUPABASE_URL.includes("PASTE_") &&
    SUPABASE_ANON_KEY.length > 20 &&
    !SUPABASE_ANON_KEY.includes("PASTE_");
}
function showAuth() {
  authPanel.classList.remove("hidden");
  appPanel.classList.add("hidden");
}
function showApp(user) {
  authPanel.classList.add("hidden");
  appPanel.classList.remove("hidden");
  $("signed-in-as").textContent = user.email || "로그인됨";
}
function formatError(error) {
  if (!error) return "알 수 없는 오류가 발생했어요.";
  const message = error.message || String(error);
  if (/Invalid login credentials/i.test(message)) return "이메일 또는 비밀번호가 맞지 않아요.";
  if (/Email not confirmed/i.test(message)) return "이메일 인증이 필요해요. 받은편지함과 스팸함을 확인해 주세요.";
  if (/already registered/i.test(message)) return "이미 가입된 이메일이에요. 로그인해 보세요.";
  return message;
}
async function refreshTasks() {
  if (!supabase || !currentUser) return;
  const list = $("task-list");
  list.innerHTML = '<p class="muted">불러오는 중…</p>';
  const { data, error } = await supabase
    .from("assignments")
    .select("id,subject,title,due_date,notes,created_at")
    .order("due_date", { ascending: true });
  if (error) {
    list.innerHTML = "";
    say(taskMessage, `과제를 불러오지 못했어요: ${formatError(error)}`, "error");
    return;
  }
  say(taskMessage, "");
  if (!data?.length) {
    list.innerHTML = '<p class="muted">아직 등록한 과제가 없어. 왼쪽에서 첫 과제를 추가해 봐!</p>';
    return;
  }
  list.innerHTML = "";
  for (const task of data) {
    const card = document.createElement("article");
    card.className = "task-card";
    const details = document.createElement("div");
    const heading = document.createElement("h4");
    heading.textContent = task.title;
    const meta = document.createElement("p");
    meta.className = "muted";
    meta.textContent = `${task.due_date} · ${task.subject || "과목 미입력"}`;
    details.append(heading, meta);
    if (task.notes) {
      const note = document.createElement("p");
      note.textContent = task.notes;
      details.append(note);
    }
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "danger";
    remove.textContent = "삭제";
    remove.addEventListener("click", async () => {
      if (!confirm(`'${task.title}' 과제를 삭제할까?`)) return;
      const { error: deleteError } = await supabase.from("assignments").delete().eq("id", task.id);
      if (deleteError) say(taskMessage, `삭제 실패: ${formatError(deleteError)}`, "error");
      else await refreshTasks();
    });
    card.append(details, remove);
    list.append(card);
  }
}

async function init() {
  if (!configured()) {
    setStatus("설정 필요");
    say(authMessage, "config.js에 Supabase Project URL과 Publishable key를 먼저 입력해 주세요.", "error");
    return;
  }
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    setStatus("Supabase 연결 준비 완료", true);
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (data.session?.user) {
      currentUser = data.session.user;
      showApp(currentUser);
      await refreshTasks();
    } else {
      showAuth();
    }
    supabase.auth.onAuthStateChange(async (_event, session) => {
      currentUser = session?.user || null;
      if (currentUser) {
        showApp(currentUser);
        await refreshTasks();
      } else {
        showAuth();
      }
    });
  } catch (error) {
    setStatus("연결 오류");
    say(authMessage, `초기화 실패: ${formatError(error)}`, "error");
  }
}

$("signup").addEventListener("click", async () => {
  if (!supabase) return say(authMessage, "Supabase 설정을 먼저 확인해 주세요.", "error");
  const email = $("email").value.trim();
  const password = $("password").value;
  if (!email || password.length < 8) return say(authMessage, "이메일과 8자 이상의 비밀번호를 입력해 주세요.", "error");
  $("signup").disabled = true;
  say(authMessage, "회원가입 요청 중…");
  try {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: window.location.href.split("#")[0] }
    });
    if (error) throw error;
    say(authMessage, data.session
      ? "가입 및 로그인 완료!"
      : "가입 요청을 보냈어요. 이메일 인증이 켜져 있다면 받은편지함과 스팸함을 확인해 주세요.", "success");
  } catch (error) {
    say(authMessage, `가입 실패: ${formatError(error)}`, "error");
  } finally {
    $("signup").disabled = false;
  }
});

$("auth-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!supabase) return say(authMessage, "Supabase 설정을 먼저 확인해 주세요.", "error");
  const email = $("email").value.trim();
  const password = $("password").value;
  if (!email || !password) return say(authMessage, "이메일과 비밀번호를 입력해 주세요.", "error");
  $("login").disabled = true;
  say(authMessage, "로그인 요청 중…");
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    currentUser = data.user;
    showApp(currentUser);
    await refreshTasks();
    say(authMessage, "");
  } catch (error) {
    say(authMessage, `로그인 실패: ${formatError(error)}`, "error");
  } finally {
    $("login").disabled = false;
  }
});

$("logout").addEventListener("click", async () => {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) say(taskMessage, `로그아웃 실패: ${formatError(error)}`, "error");
});
$("refresh").addEventListener("click", refreshTasks);
$("task-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!supabase || !currentUser) return say(taskMessage, "먼저 로그인해 주세요.", "error");
  const payload = {
    user_id: currentUser.id,
    subject: $("subject").value.trim(),
    title: $("title").value.trim(),
    due_date: $("due").value,
    notes: $("notes").value.trim() || null
  };
  if (!payload.title || !payload.due_date) return say(taskMessage, "과제 이름과 제출일을 입력해 주세요.", "error");
  $("save-task").disabled = true;
  try {
    const { error } = await supabase.from("assignments").insert(payload);
    if (error) throw error;
    $("task-form").reset();
    say(taskMessage, "과제를 저장했어요!", "success");
    await refreshTasks();
  } catch (error) {
    say(taskMessage, `저장 실패: ${formatError(error)}`, "error");
  } finally {
    $("save-task").disabled = false;
  }
});

init();
