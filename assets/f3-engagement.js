(function () {
  'use strict';
  const script = document.currentScript;
  const API = '/api/article-engagement';
  const SLUG = /^[\p{L}\p{N}][\p{L}\p{N}_-]{0,159}$/u;
  let started = false;

  function node(tag, text, attrs) {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = text;
    for (const [key, value] of Object.entries(attrs || {})) el.setAttribute(key, value);
    return el;
  }
  async function call(params, payload) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9000);
    try {
      const response = await fetch(API + (params ? '?' + new URLSearchParams(params) : ''), {
        method: payload ? 'POST' : 'GET', credentials: 'omit', cache: 'no-store',
        headers: payload ? {'Content-Type': 'application/json'} : {},
        ...(payload ? {body: JSON.stringify(payload)} : {}), signal: controller.signal,
      });
      const data = await response.json();
      if (!response.ok) {
        const error = new Error(response.status === 403 && data.error === 'invalid_credentials' ? '댓글과 비밀번호를 확인해 주세요.' : response.status === 503 && data.error === 'author_delete_disabled' ? '지금은 직접 삭제 기능을 사용할 수 없습니다.' : response.status === 429 ? '잠시 후 다시 시도해 주세요.' : '지금은 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.');
        error.status = response.status;
        throw error;
      }
      if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('응답을 읽을 수 없습니다.');
      return data;
    } catch (error) {
      if (error.name === 'AbortError' || typeof error.status === 'number') throw error;
      throw new Error('지금은 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.');
    } finally { clearTimeout(timer); }
  }
  function number(value) {
    const n = Number(value);
    return Number.isSafeInteger(n) && n >= 0 ? n.toLocaleString('ko-KR') : '—';
  }
  function date(value) {
    const d = new Date(value);
    return Number.isNaN(d.valueOf()) ? '' : d.toLocaleDateString('ko-KR');
  }
  function start(slug) {
    if (started || document.querySelector('[data-f3-engagement]') || typeof slug !== 'string' || !SLUG.test(slug)) return;
    if (!['https:', 'http:'].includes(location.protocol)) return;
    started = true;
    const host = node('aside', undefined, {'data-f3-engagement': '', 'aria-label': '조회수와 댓글'});
    const root = host.attachShadow({mode: 'open'});
    const style = node('style', `
      :host{display:block!important;box-sizing:border-box!important;width:100%!important;max-width:800px!important;margin:56px auto!important;padding:0 24px!important;color:#292925;font-family:system-ui,-apple-system,sans-serif;line-height:1.8;cursor:auto;--ink:#292925;--muted:#666;--line:#c9c5be;--accent:var(--f3-engagement-accent,#2c5aa0)}
      *,*::before,*::after{box-sizing:border-box}section{overflow-wrap:anywhere;background:#f2ede6;border:1px solid var(--line);padding:30px}h2{font-size:22px;line-height:1.5;margin:0 0 10px;word-break:keep-all}h3{font-size:18px;margin:28px 0 14px}p{margin:10px 0}small,.hint{font-size:13px;color:var(--muted)}.stats{font-size:14px;border-bottom:1px solid var(--line);padding-bottom:20px}label{display:block;font-size:14px;font-weight:600;margin:16px 0 6px}input,textarea{display:block;width:100%;font:16px/1.7 system-ui,sans-serif;color:var(--ink);background:#fffefa;border:1px solid #aaa79f;border-radius:3px;padding:10px 12px}textarea{resize:vertical;min-height:140px}button{font:600 14px/1.6 system-ui,sans-serif;min-height:44px;cursor:pointer;border:1px solid var(--accent);border-radius:3px;padding:10px 18px;color:white;background:var(--accent)}button:disabled{opacity:.5;cursor:default}button.secondary{color:var(--accent);background:transparent}button:focus-visible,input:focus-visible,textarea:focus-visible{outline:3px solid #c8963e;outline-offset:3px}.status{font-size:14px;white-space:pre-wrap}.list{padding:0;list-style:none}.comment{border-top:1px solid var(--line);padding:20px 0;overflow-wrap:anywhere}.comment strong{font-size:14px}.comment time{font-size:12px;color:var(--muted);margin-left:10px}.comment p{font-size:15px;white-space:pre-wrap;margin-bottom:0}.trap{position:absolute;left:-10000px;opacity:0;pointer-events:none}.actions{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:18px}[hidden]{display:none!important}@media(max-width:480px){:host{padding:0 16px!important;margin:36px auto!important}section{padding:22px 18px}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto}}
    `);
    root.append(style);
    const section = node('section');
    const heading = node('h2', '이 글의 기록');
    const stats = node('div', '조회수 연결 중…', {class: 'stats', 'aria-live': 'polite'});
    const count = node('h3', '댓글');
    const empty = node('p', '댓글을 불러오는 중입니다.', {class: 'hint'});
    const list = node('ol', undefined, {class: 'list', 'aria-label': '공개 댓글'});
    const more = node('button', '댓글 더 보기', {class: 'secondary', type: 'button', hidden: ''});
    const form = node('form', undefined, {hidden: ''});
    const mode = node('p', '', {class: 'hint'});
    const nicknameLabel = node('label', '닉네임', {for: 'eg-nickname'});
    const nickname = node('input', undefined, {id: 'eg-nickname', name: 'nickname', maxlength: '24', required: '', autocomplete: 'off'});
    const bodyLabel = node('label', '댓글', {for: 'eg-body'});
    const body = node('textarea', undefined, {id: 'eg-body', name: 'comment', maxlength: '2000', required: '', 'aria-describedby': 'eg-privacy'});
    const privacy = node('p', '이메일·전화번호 등 개인정보는 남기지 마세요. 2,000자까지 쓸 수 있습니다.', {class: 'hint', id: 'eg-privacy'});
    const passwordArea = node('div', undefined, {hidden: ''});
    const password = node('input', undefined, {id: 'eg-password', type: 'password', name: 'delete-password', autocomplete: 'new-password', minlength: '8', maxlength: '128', 'aria-describedby': 'eg-password-hint'});
    passwordArea.append(node('label', '삭제 비밀번호 (선택)', {for: 'eg-password'}), password,
      node('p', '8자 이상으로 정해 주세요. 비밀번호를 입력한 댓글만 직접 삭제할 수 있습니다. 수정은 지원하지 않습니다. 다른 곳에서 쓰는 비밀번호는 피해주세요.', {class: 'hint', id: 'eg-password-hint'}));
    const receipt = node('div');
    const receiptTools = node('div',undefined,{hidden:''});
    const trap = node('input', undefined, {class: 'trap', name: 'website', tabindex: '-1', 'aria-hidden': 'true', autocomplete: 'off'});
    const submit = node('button', '댓글 보내기', {type: 'submit'});
    const retry = node('button', '다시 연결', {type: 'button', class: 'secondary', hidden: ''});
    const status = node('p', '', {class: 'status', role: 'status', 'aria-live': 'polite'});
    const actions = node('div', undefined, {class: 'actions'});
    actions.append(submit);
    form.append(mode, nicknameLabel, nickname, bodyLabel, body, privacy, passwordArea, trap, actions);
    section.append(heading, stats, count, empty, list, more, form, receipt, receiptTools, retry, status);
    root.append(section);
    const main = document.querySelector('main');
    if (main) main.insertAdjacentElement('afterend', host);
    else {
      const footer = document.querySelector('footer');
      if (footer) footer.before(host); else document.body.append(host);
    }
    let cursor = null, busy = false, requestId = null, previousPayload = null, viewStarted = false;
    let ownerDeleteEnabled = false;
    const seen = new Set();
    function deleteControl(id, container, onDeleted) {
      const toggle=node('button',id?'댓글 삭제':'접수번호로 댓글 삭제',{type:'button',class:'secondary'});
      const panel=node('form',undefined,{hidden:''});
      const fieldId='eg-delete-'+(id||crypto.randomUUID());
      const commentId=id?null:node('input',undefined,{id:fieldId+'-id',required:'',autocomplete:'off',placeholder:'댓글 접수번호 (UUID)'});
      const secret=node('input',undefined,{id:fieldId,type:'password',autocomplete:'current-password',required:'',minlength:'8',maxlength:'128'});
      const confirm=node('button','삭제 확인',{type:'submit'});
      const cancel=node('button','취소',{type:'button',class:'secondary'});
      const message=node('p','',{class:'status',role:'status'});
      const buttons=node('div',undefined,{class:'actions'});buttons.append(confirm,cancel);
      if(commentId)panel.append(node('label','댓글 접수번호',{for:fieldId+'-id'}),commentId);
      panel.append(node('p','삭제하면 공개 본문이 사라지고 삭제 표시가 남습니다. 원문은 관리자에게 보관됩니다.',{class:'hint'}),node('label','작성할 때 정한 비밀번호',{for:fieldId}),secret,buttons,message);
      toggle.addEventListener('click',()=>{panel.hidden=!panel.hidden;if(!panel.hidden)secret.focus();else secret.value='';});
      cancel.addEventListener('click',()=>{secret.value='';panel.hidden=true;toggle.focus();});
      panel.addEventListener('submit',async event=>{
        event.preventDefault();if(confirm.disabled)return;
        confirm.disabled=true;cancel.disabled=true;toggle.disabled=true;
        try {
          await call(null,{action:'comment_delete',slug,comment_id:id||(commentId.value||'').trim(),password:secret.value});
          secret.value='';if(id){panel.remove();toggle.remove();}else{commentId.value='';panel.hidden=true;}onDeleted();
          await load(false);status.textContent='댓글을 삭제했습니다. 공개됐던 댓글에는 삭제 표시가 남습니다.';
        } catch(error) {
          secret.value='';message.textContent=error.name==='AbortError'?'응답을 받지 못했습니다. 같은 비밀번호로 다시 확인해 주세요.':error.message;
        } finally {confirm.disabled=false;cancel.disabled=false;toggle.disabled=false;}
      });
      container.append(toggle,panel);
    }
    deleteControl(null,receiptTools,()=>{});
    function comments(items, replace) {
      if (replace) { list.replaceChildren(); seen.clear(); }
      for (const item of items) {
        if (!item || typeof item.id !== 'string' || typeof item.body !== 'string' || typeof item.nickname !== 'string' || seen.has(item.id)) continue;
        seen.add(item.id);
        const li = node('li', undefined, {class: 'comment'});
        li.append(node('strong', item.nickname), node('time', date(item.created_at)), node('p', item.body));
        if(ownerDeleteEnabled && item.author_delete_available===true && item.deleted!==true)deleteControl(item.id,li,()=>{});
        list.append(li);
      }
      empty.hidden = list.children.length > 0;
      empty.textContent = '아직 공개된 댓글이 없습니다.';
    }
    function recordView() {
      if (viewStarted || document.visibilityState !== 'visible') return;
      viewStarted = true;
      // Counting failure does not hide approved comments or erase their draft.
      call(null, {action: 'view', slug}).then(data => { stats.textContent = '조회 ' + number(data.views) + ' · 집계 시작 이후'; }).catch(() => {});
    }
    async function load(append) {
      if (busy) return;
      busy = true; more.disabled = true; retry.disabled = true;
      try {
        const data = await call({slug, ...(append && cursor ? {before: cursor} : {})});
        if (!Array.isArray(data.comments)) throw new Error('댓글을 읽을 수 없습니다.');
        stats.textContent = '조회 ' + number(data.views) + (data.started_at ? ' · ' + date(data.started_at) + '부터 집계' : ' · 집계 시작 이후');
        stats.title = '과거 조회수는 포함되지 않으며, 같은 환경에서 짧은 시간 안에 다시 여는 경우 중복을 제외합니다.';
        count.textContent = '댓글 ' + number(data.comment_count);
        form.hidden = data.comments_enabled !== true;
        mode.textContent = data.comment_mode === 'open' ? '댓글은 등록 후 공개됩니다.' : '댓글은 관리자가 확인한 뒤 공개됩니다.';
        ownerDeleteEnabled=data.author_delete_enabled===true;
        passwordArea.hidden=!ownerDeleteEnabled;receiptTools.hidden=!ownerDeleteEnabled;
        if(!ownerDeleteEnabled)password.value='';
        comments(data.comments, !append);
        if (!data.comments_enabled) empty.textContent = '지금은 댓글 작성을 받지 않습니다.';
        cursor = typeof data.next_cursor === 'string' ? data.next_cursor : null;
        more.hidden = !cursor;
        retry.hidden = true;
        status.textContent = '';
        recordView();
      } catch (error) {
        status.textContent = error.name === 'AbortError' ? '연결 시간이 길어지고 있습니다. 다시 시도해 주세요.' : error.message;
        retry.hidden = false;
        if (!append) { empty.textContent = '댓글에 연결하지 못했습니다.'; stats.textContent = '조회 —'; }
      } finally { busy = false; more.disabled = false; retry.disabled = false; }
    }
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (submit.disabled) return;
      const nick = nickname.value.normalize('NFC').trim(), content = body.value.normalize('NFC').trim();
      if (!nick || [...nick].length > 24 || !content || [...content].length > 2000) { status.textContent = '닉네임과 댓글 길이를 확인해 주세요.'; return; }
      const chosenPassword=ownerDeleteEnabled?password.value:'';
      if(chosenPassword && ([...chosenPassword].length<8 || new TextEncoder().encode(chosenPassword).length>256 || /[\u0000-\u001f\u007f]/u.test(chosenPassword))) {status.textContent='삭제 비밀번호는 8자 이상, 256바이트 이내로 입력해 주세요.';return;}
      // Retain only a digest for retry identity; never persist the password.
      const fingerprint = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify([nick,content,chosenPassword])))),x=>x.toString(16).padStart(2,'0')).join('');
      if (!requestId || previousPayload !== fingerprint) { requestId = crypto.randomUUID(); previousPayload = fingerprint; }
      submit.disabled = true;
      try {
        const result = await call(null, {action: 'comment', slug, nickname: nick, body: content, website: trap.value, request_id: requestId,...(chosenPassword?{password:chosenPassword}:{})});
        body.value = ''; password.value = ''; requestId = null; previousPayload = null;
        receipt.replaceChildren();
        if(result.status!=='approved' && result.author_delete_available===true) {
          receipt.append(node('p','접수번호: '+result.id,{class:'hint'}),node('p','접수번호를 보관하면 새로 접속한 뒤에도 아래 ‘접수번호로 댓글 삭제’에서 삭제할 수 있습니다.',{class:'hint'}));
          deleteControl(result.id,receipt,()=>receipt.replaceChildren());
        }
        if (result.status === 'approved') { await load(false); status.textContent = '댓글을 등록했습니다.'; }
        else status.textContent = '댓글을 접수했습니다. 관리자가 확인한 뒤 공개됩니다.';
      } catch (error) { status.textContent = error.name === 'AbortError' ? '응답을 받지 못했습니다. 같은 내용으로 다시 보내면 중복 접수를 방지합니다.' : error.message; }
      finally { submit.disabled = false; }
    });
    more.addEventListener('click', () => load(true));
    retry.addEventListener('click', () => load(false));
    document.addEventListener('visibilitychange', recordView);
    load(false);
  }
  function boot() { start(script && script.dataset.f3Article || document.documentElement.dataset.f3ArticleSlug); }
  document.addEventListener('f3:article-ready', boot);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once: true}); else boot();
})();
