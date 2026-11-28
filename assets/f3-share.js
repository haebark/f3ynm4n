(() => {
  if (document.getElementById('f3ShareToggle') || document.getElementById('f3ShareBtn')) return;

  const canonical = document.querySelector('link[rel="canonical"]')?.href;
  const url = canonical || location.origin + location.pathname;
  const meta = (property) => document.querySelector('meta[property="' + property + '"]')?.content;
  const title = meta('og:title') || document.title;
  const description = meta('og:description') || 'F3YNM4N MAGAZINE';
  const imageUrl = meta('og:image') || 'https://f3ynm4n.com/og_default.png';
  const kakaoKey = 'e0642d0a5c0ae01b8893422a148e9aba';
  const kakaoSdk = 'https://t1.kakaocdn.net/kakao_js_sdk/2.8.4/kakao.min.js';

  document.body.insertAdjacentHTML('beforeend', `
    <div class="f3-share-btn">
      <div class="f3-share-panel" id="f3SharePanel" aria-label="공유 방법" hidden>
        <button type="button" class="f3-share-item" id="f3ShareCopy"><span aria-hidden="true">↗</span>URL 복사</button>
        <a class="f3-share-item" id="f3ShareX" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">𝕏</span>X에 공유</a>
        <button type="button" class="f3-share-item kakao" id="f3ShareKakao"><span aria-hidden="true">●</span>카카오톡 공유</button>
        <button type="button" class="f3-share-item" id="f3ShareNative" hidden><span aria-hidden="true">＋</span>다른 앱으로 공유</button>
      </div>
      <button type="button" class="f3-share-toggle" id="f3ShareToggle" aria-label="공유 메뉴 열기" aria-controls="f3SharePanel" aria-expanded="false">
        <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4m-6.8 7 6.8 4"/></svg>
      </button>
    </div>
    <div class="f3-share-toast" id="f3ShareStatus" role="status" aria-atomic="true"></div>
    <dialog class="f3-share-dialog" id="f3ShareManual" aria-labelledby="f3ShareManualTitle">
      <p id="f3ShareManualTitle">아래 주소를 복사해 주세요.</p>
      <input type="url" aria-label="공유 주소" readonly>
      <button type="button">닫기</button>
    </dialog>
  `);

  const get = (id) => document.getElementById(id);
  const toggle = get('f3ShareToggle');
  const panel = get('f3SharePanel');
  const copy = get('f3ShareCopy');
  const status = get('f3ShareStatus');
  const manual = get('f3ShareManual');
  const address = manual.querySelector('input');
  const shareX = get('f3ShareX');
  shareX.href = 'https://twitter.com/intent/tweet?' + new URLSearchParams({ text: title, url });
  address.value = url;

  let toastTimer;
  let sdkLoading = false;
  let sdkFailed = false;

  function notify(message) {
    clearTimeout(toastTimer);
    status.textContent = message;
    toastTimer = setTimeout(() => { status.textContent = ''; }, 4000);
  }

  function loadKakao() {
    if (sdkLoading || window.Kakao?.Share) return;
    sdkLoading = true;
    sdkFailed = false;
    const script = document.createElement('script');
    script.src = kakaoSdk;
    script.integrity = 'sha384-BGX7Wb16GmRFagri4bLJV2DgipVZaU2AI812GZtHtHzzDQJnfHasDXN5houxv45w';
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      if (!window.Kakao?.isInitialized()) {
        try {
          window.Kakao.init(kakaoKey);
        } catch {
          script.onerror();
          return;
        }
      }
      sdkLoading = false;
    };
    script.onerror = () => {
      sdkFailed = true;
      sdkLoading = false;
      script.remove();
    };
    document.head.appendChild(script);
  }

  function close(focusToggle) {
    if (panel.hidden) return;
    panel.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', '공유 메뉴 열기');
    if (focusToggle) toggle.focus();
  }

  toggle.addEventListener('click', () => {
    if (!panel.hidden) {
      close(true);
      return;
    }
    panel.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', '공유 메뉴 닫기');
    copy.focus();
    loadKakao();
  });

  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(url);
      close(true);
      notify('URL을 복사했습니다.');
    } catch {
      close(true);
      manual.showModal();
      address.select();
    }
  });
  manual.querySelector('button').addEventListener('click', () => manual.close());
  shareX.addEventListener('click', () => close(true));

  get('f3ShareKakao').addEventListener('click', () => {
    const kakao = window.Kakao;
    if (!kakao?.Share) {
      notify(sdkFailed
        ? '카카오톡에 연결하지 못했습니다. URL 복사를 이용해 주세요.'
        : '카카오톡을 불러오는 중입니다. 잠시 후 다시 눌러 주세요.');
      loadKakao();
      return;
    }
    try {
      const link = { mobileWebUrl: url, webUrl: url };
      const result = kakao.Share.sendDefault({
        objectType: 'feed',
        content: { title, description, imageUrl, link },
        buttons: [{ title: '읽기', link }],
      });
      result?.catch?.(() => notify('카카오톡 공유창을 열지 못했습니다. URL 복사를 이용해 주세요.'));
      close(true);
    } catch {
      notify('카카오톡 공유창을 열지 못했습니다. URL 복사를 이용해 주세요.');
    }
  });

  const native = get('f3ShareNative');
  if (typeof navigator.share === 'function') {
    native.hidden = false;
    native.addEventListener('click', async () => {
      try {
        await navigator.share({ title, url });
        close(true);
      } catch (error) {
        if (error.name !== 'AbortError') notify('공유창을 열지 못했습니다. URL 복사를 이용해 주세요.');
      }
    });
  }

  document.addEventListener('click', (event) => {
    if (!toggle.parentElement.contains(event.target)) close(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !manual.open) close(true);
  });
})();
