import os, re

EXCLUDE = {'index.html', 'admin.html', 'article.html', 'about.html',
           'contact.html', 'privacy.html', 'share_component.html',
           'insert_share.py', 'insert_favicon.py', 'insert_progress.py',
           'fix_kakao_lazy.py'}

# 제거할 kakao SDK 스크립트 태그
OLD_SDK = '<script src="https://developers.kakao.com/sdk/js/kakao.min.js"></script>'

# 기존 Kakao.init 블록 교체 - lazy load 방식으로
OLD_INIT = """  if(KAKAO_KEY && window.Kakao && !Kakao.isInitialized()){
    Kakao.init(KAKAO_KEY);
  }"""

NEW_INIT = """  function loadKakaoSDK(cb){
    if(window.Kakao){cb();return;}
    var s=document.createElement('script');
    s.src='https://developers.kakao.com/sdk/js/kakao.min.js';
    s.onload=function(){if(KAKAO_KEY&&!Kakao.isInitialized())Kakao.init(KAKAO_KEY);cb();};
    document.head.appendChild(s);
  }"""

OLD_SHARE = """  window.f3ShareKakao = function(){
    if(!window.Kakao || !KAKAO_KEY){
      showToast('카카오 앱키 필요');
      return;
    }
    var title = document.title || 'F3YNM4N';
    var desc  = document.querySelector('meta[name="description"]');
    Kakao.Share.sendDefault({"""

NEW_SHARE = """  window.f3ShareKakao = function(){
    if(!KAKAO_KEY){ showToast('카카오 앱키 필요'); return; }
    loadKakaoSDK(function(){
    var title = document.title || 'F3YNM4N';
    var desc  = document.querySelector('meta[name="description"]');
    Kakao.Share.sendDefault({"""

OLD_SHARE_END = """    });
  };"""

NEW_SHARE_END = """    });
    });
  };"""

count = 0
for fname in sorted(os.listdir('.')):
    if not fname.endswith('.html') or fname in EXCLUDE:
        continue
    content = open(fname, encoding='utf-8').read()
    if OLD_SDK not in content:
        continue

    content = content.replace(OLD_SDK, '')
    content = content.replace(OLD_INIT, NEW_INIT)
    content = content.replace(OLD_SHARE, NEW_SHARE)
    # sendDefault 닫는 부분 교체 (첫 번째 것만)
    content = content.replace(OLD_SHARE_END, NEW_SHARE_END, 1)

    open(fname, 'w', encoding='utf-8').write(content)
    print(f'  ✓ {fname}')
    count += 1

print(f'\n완료: {count}개 파일 카카오 SDK lazy load 전환')
