#!/usr/bin/env python3
"""
F3YNM4N 공유버튼 컴포넌트 일괄 삽입 스크립트
실행: python3 inject_share.py
위치: ~/Downloads/f3ynm4n/ 에서 실행
"""

import os
import re

# 공유버튼 컴포넌트 전체
SHARE_COMPONENT = """
<!-- =============================================
  F3YNM4N 공유 버튼 컴포넌트
============================================= -->

<style>
.f3-share-btn{
  position:fixed;bottom:36px;right:36px;z-index:1000;
  display:flex;flex-direction:column;align-items:flex-end;gap:10px;
}
.f3-share-toggle{
  width:44px;height:44px;border-radius:50%;
  background:#c8963e;border:none;cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  transition:transform .2s,background .2s;
  box-shadow:0 2px 12px rgba(200,150,62,.35);
}
.f3-share-toggle:hover{background:#d4a44a;transform:scale(1.08);}
.f3-share-toggle svg{width:18px;height:18px;fill:none;stroke:#0d0d0b;stroke-width:2;stroke-linecap:round;}
.f3-share-panel{
  display:flex;flex-direction:column;gap:6px;
  opacity:0;transform:translateY(8px) scale(.96);
  pointer-events:none;
  transition:opacity .18s ease,transform .18s ease;
}
.f3-share-panel.open{
  opacity:1;transform:translateY(0) scale(1);pointer-events:all;
}
.f3-share-item{
  display:flex;align-items:center;gap:10px;
  background:#0d0d0b;border:1px solid rgba(200,150,62,.3);
  padding:10px 16px;cursor:pointer;
  font-family:'Space Mono',monospace;font-size:10px;letter-spacing:1.5px;
  color:#c8963e;text-transform:uppercase;white-space:nowrap;
  transition:background .15s,border-color .15s;
  text-decoration:none;
}
.f3-share-item:hover{background:#1a1814;border-color:rgba(200,150,62,.6);}
.f3-share-item .f3-share-icon{
  width:16px;height:16px;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;
}
.f3-share-toast{
  position:fixed;bottom:100px;right:36px;z-index:1001;
  background:#0d0d0b;border:1px solid rgba(200,150,62,.4);
  padding:10px 18px;
  font-family:'Space Mono',monospace;font-size:10px;letter-spacing:1.5px;color:#c8963e;
  opacity:0;transform:translateY(4px);
  transition:opacity .2s,transform .2s;pointer-events:none;
}
.f3-share-toast.show{opacity:1;transform:translateY(0);}

@media(max-width:640px){
  .f3-share-btn{bottom:24px;right:20px;}
  .f3-share-toast{right:20px;bottom:90px;}
}
</style>

<div class="f3-share-btn" id="f3ShareBtn">
  <div class="f3-share-panel" id="f3SharePanel">

    <!-- URL 복사 -->
    <button class="f3-share-item" onclick="f3CopyUrl()">
      <span class="f3-share-icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c8963e" stroke-width="2" stroke-linecap="round">
          <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
      </span>
      URL 복사
    </button>

    <!-- X (Twitter) -->
    <a class="f3-share-item" id="f3ShareX" href="#" target="_blank" rel="noopener">
      <span class="f3-share-icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="#c8963e">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      </span>
      X 공유
    </a>

    <!-- 카카오톡 -->
    <button class="f3-share-item" onclick="f3ShareKakao()">
      <span class="f3-share-icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="#c8963e">
          <path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.667 1.583 5.013 4 6.416V21l3.5-2.5c.823.166 1.666.25 2.5.25 5.523 0 10-3.477 10-7.5S17.523 3 12 3z"/>
        </svg>
      </span>
      카카오톡
    </button>

  </div>

  <!-- 토글 버튼 -->
  <button class="f3-share-toggle" id="f3ShareToggle" onclick="f3ToggleShare()" aria-label="공유">
    <svg viewBox="0 0 24 24">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  </button>
</div>

<div class="f3-share-toast" id="f3Toast">URL 복사됨</div>

<script>
(function(){
  var KAKAO_KEY = 'e0642d0a5c0ae01b8893422a148e9aba';

  function loadKakaoSDK(cb){
    if(window.Kakao){cb();return;}
    var s=document.createElement('script');
    s.src='https://developers.kakao.com/sdk/js/kakao.min.js';
    s.onload=function(){if(KAKAO_KEY&&!Kakao.isInitialized())Kakao.init(KAKAO_KEY);cb();};
    document.head.appendChild(s);
  }

  var panelOpen = false;

  window.f3ToggleShare = function(){
    panelOpen = !panelOpen;
    document.getElementById('f3SharePanel').classList.toggle('open', panelOpen);
  };

  window.f3CopyUrl = function(){
    var url = location.href;
    navigator.clipboard.writeText(url).then(function(){
      showToast('URL 복사됨');
    }).catch(function(){
      var ta = document.createElement('textarea');
      ta.value = url; document.body.appendChild(ta);
      ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
      showToast('URL 복사됨');
    });
    panelOpen = false;
    document.getElementById('f3SharePanel').classList.remove('open');
  };

  var xLink = document.getElementById('f3ShareX');
  if(xLink){
    var title = document.title || 'F3YNM4N';
    var url = location.href;
    xLink.href = 'https://twitter.com/intent/tweet?text=' +
      encodeURIComponent(title) + '&url=' + encodeURIComponent(url);
  }

  window.f3ShareKakao = function(){
    if(!KAKAO_KEY){ showToast('카카오 앱키 필요'); return; }
    loadKakaoSDK(function(){
    var title = document.title || 'F3YNM4N';
    var desc  = document.querySelector('meta[name="description"]');
    Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: title,
        description: desc ? desc.content : '',
        imageUrl: 'https://f3ynm4n.com/og_default.png',
        link: { mobileWebUrl: location.href, webUrl: location.href }
      },
      buttons: [{
        title: '읽기',
        link: { mobileWebUrl: location.href, webUrl: location.href }
      }]
    });
    });
  };

  function showToast(msg){
    var t = document.getElementById('f3Toast');
    t.textContent = msg; t.classList.add('show');
    setTimeout(function(){ t.classList.remove('show'); }, 2000);
  }

  document.addEventListener('click', function(e){
    if(!document.getElementById('f3ShareBtn').contains(e.target)){
      panelOpen = false;
      document.getElementById('f3SharePanel').classList.remove('open');
    }
  });
})();
</script>
"""

# 공유버튼 삽입 대상 파일 목록
TARGET_FILES = [
    'my-flag.html',
    'payment-evolution.html',
    'digital-trickle.html',
    'rainy-park.html',
    'about-feynman.html',
]

def inject_share(filepath):
    if not os.path.exists(filepath):
        print(f'  ❌ 파일 없음: {filepath}')
        return False

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 이미 삽입됐으면 스킵
    if 'f3-share-btn' in content:
        print(f'  ⏭  이미 있음: {filepath}')
        return False

    # </body> 바로 앞에 삽입
    if '</body>' not in content:
        print(f'  ⚠️  </body> 없음: {filepath}')
        return False

    new_content = content.replace('</body>', SHARE_COMPONENT + '\n</body>', 1)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

    print(f'  ✅ 삽입 완료: {filepath}')
    return True

if __name__ == '__main__':
    print('F3YNM4N 공유버튼 일괄 삽입 시작\n')
    success = 0
    for fname in TARGET_FILES:
        if inject_share(fname):
            success += 1
    print(f'\n완료: {success}/{len(TARGET_FILES)} 파일 처리됨')
