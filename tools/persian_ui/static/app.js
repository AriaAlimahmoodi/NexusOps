"use strict";

const get = (id) => document.getElementById(id);
let draftId = null;
let reviewId = null;
let revision = 0;

async function request(path, body, type = "application/json") {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": type },
    body: type === "application/json" ? JSON.stringify(body) : body,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(typeof data.detail === "string" ? data.detail : "ورودی را بررسی و دوباره تلاش کنید.");
  }
  return data;
}

function show(panel) {
  for (const name of ["chat", "intake"]) {
    const active = panel === name;
    get(name + "-panel").hidden = !active;
    if (active) get(name + "-tab").setAttribute("aria-current", "page");
    else get(name + "-tab").removeAttribute("aria-current");
  }
}

function submit(formId, handler, errorTarget) {
  const form = get(formId);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    if (button.disabled) return;
    button.disabled = true;
    try {
      await handler();
    } catch (error) {
      errorTarget(error.message);
    } finally {
      button.disabled = false;
    }
  });
}

function addMessage(text, kind, evidence) {
  get("empty").hidden = true;
  const message = document.createElement("article");
  message.className = "message " + kind;
  const paragraph = document.createElement("p");
  if (kind === "user") {
    paragraph.textContent = text;
  } else {
    const links = /\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g;
    let cursor = 0;
    for (const match of text.matchAll(links)) {
      paragraph.append(text.slice(cursor, match.index).replaceAll("**", ""));
      const link = document.createElement("a");
      link.href = match[2];
      link.textContent = match[1].replaceAll("**", "");
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      paragraph.append(link);
      cursor = match.index + match[0].length;
    }
    paragraph.append(text.slice(cursor).replaceAll("**", ""));
  }
  message.append(paragraph);
  if (evidence) {
    const details = document.createElement("details");
    const summary = document.createElement("summary");
    summary.textContent = "شواهد پاسخ";
    const pre = document.createElement("pre");
    pre.dir = "ltr";
    pre.textContent = JSON.stringify(evidence, null, 2);
    details.append(summary, pre);
    message.append(details);
  }
  const log = get("messages");
  log.append(message);
  log.scrollTop = log.scrollHeight;
}

get("chat-tab").onclick = () => show("chat");
get("intake-tab").onclick = () => show("intake");
get("source-form").onsubmit = (event) => event.preventDefault();
get("example").onclick = () => {
  get("dataset").value = "";
  get("question").value = "با شواهد منتشرشده FPGA مهارت پرتقاضا، درس مرتبط و پیشنهاد بازنگری را نشان بده";
  get("chat-form").requestSubmit();
};

submit("chat-form", async () => {
  const question = get("question").value.trim();
  if (!question) return;
  const dataset_id = get("dataset").value.trim();
  addMessage(question, "user");
  get("question").value = "";
  const result = await request("/api/chat", { question, dataset_id });
  addMessage(result.answer, "assistant", result.evidence);
}, (text) => addMessage(text, "assistant"));

get("kind").onchange = () => {
  const kind = get("kind").value;
  get("file-label").hidden = kind === "api";
  get("file").required = kind !== "api";
  get("file").accept = kind === "json" ? ".json" : ".csv";
  get("url-label").hidden = kind !== "api";
  get("url").required = kind === "api";
  get("path-label").hidden = kind === "csv";
};

function invalidateReview() {
  revision++;
  reviewId = null;
  get("approved").checked = false;
  get("publish-form").hidden = true;
}

function status(text) {
  get("intake-status").textContent = text;
}

submit("intake-form", async () => {
  invalidateReview();
  draftId = null;
  get("mapping-form").hidden = true;
  get("raw-preview").hidden = true;
  status("در حال دریافت داده…");
  const kind = get("kind").value;
  const records_path = kind === "csv" ? "" : get("records-path").value.trim();
  let result;
  if (kind === "api") {
    result = await request("/api/intake/source", { url: get("url").value.trim(), records_path });
  } else {
    const file = get("file").files[0];
    if (!file) throw new Error("یک فایل انتخاب کنید.");
    const query = new URLSearchParams({ kind, records_path, filename: file.name });
    result = await request("/api/intake/file?" + query, file, "application/octet-stream");
  }
  draftId = result.draft_id;
  get("skill").replaceChildren(new Option("ستون را انتخاب کنید", ""));
  get("course").replaceChildren(new Option("بدون ستون درس", ""));
  for (const column of result.columns) {
    get("skill").append(new Option(column, column));
    get("course").append(new Option(column, column));
  }
  get("raw-json").textContent = JSON.stringify(result.sample, null, 2);
  get("raw-preview").hidden = false;
  get("mapping-form").hidden = false;
  status(result.row_count + " ردیف دریافت شد. ستون‌های تحلیل را انتخاب کنید.");
}, status);

get("mapping-form").addEventListener("input", invalidateReview);
submit("mapping-form", async () => {
  invalidateReview();
  const current = revision;
  const result = await request("/api/review", {
    draft_id: draftId,
    dataset_id: get("new-id").value.trim(),
    title: get("title").value,
    skill_field: get("skill").value,
    course_field: get("course").value,
  });
  if (current !== revision) return;
  reviewId = result.review_id;
  get("mapped-json").textContent = JSON.stringify({ mapping: result.mapping, sample: result.sample }, null, 2);
  get("publish-form").hidden = false;
  status("نگاشت برای " + result.row_count + " ردیف اعتبارسنجی شد. پیش‌نمایش را تأیید کنید.");
}, status);

submit("publish-form", async () => {
  if (!reviewId || !get("approved").checked) return;
  status("در حال انتشار…");
  const result = await request("/api/publish", { review_id: reviewId, approved: true });
  invalidateReview();
  get("dataset").value = result.shared_search ? "" : result.dataset_id;
  get("question").placeholder = result.shared_search
    ? "مثلاً کدام درس‌ها VHDL آموزش می‌دهند؟"
    : "مثلاً پرتکرارترین مهارت این دیتاست چیست؟";
  status(result.row_count + " ردیف با شناسهٔ " + result.dataset_id + " منتشر شد.");
  show("chat");
  const message = result.shared_search
    ? "شواهد تأییدشدهٔ این دیتاست در جست‌وجوی مشترک در دسترس است."
    : "دیتاست «" + result.dataset_id + "» منتشر شد و برای سؤال بعدی انتخاب شده است.";
  addMessage(message, "assistant");
  get("question").focus();
}, status);
