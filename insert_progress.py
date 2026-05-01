import os, re

EXCLUDE = {'index.html', 'admin.html', 'article.html', 'about.html',
           'contact.html', 'privacy.html', 'share_component.html',
           'misik_index.html', 'insert_share.py', 'insert_favicon.py',
           'insert_progress.py'}

CSS = """
<style id="reading-progress-style">
.reading-progress{position:fixed;top:0;left:0;width:0%;height:2px;background:#c8963e;z-index:9999;transition:width .1s linear;}
</style>"""

HTML = '\n<div class="reading-progress" id="readingProgress"></div>'

JS = """
<script id="reading-progress-script">
window.addEventListener('scroll',function(){
  var doc=document.documentElement;
  var scrolled=doc.scrollTop||document.body.scrollTop;
  var total=doc.scrollHeight-doc.clientHeight;
  var pct=total>0?(scrolled/total)*100:0;
  document.getElementById('readingProgress').style.width=pct+'%';
});
</script>"""

count = 0
for fname in sorted(os.listdir('.')):
    if not fname.endswith('.html') or fname in EXCLUDE:
        continue
    content = open(fname, encoding='utf-8').read()
    if 'readingProgress' in content:
        print(f'  skip: {fname}')
        continue

    # CSS → </head> 앞
    content = content.replace('</head>', CSS + '\n</head>', 1)
    # HTML → <body> 바로 뒤
    content = content.replace('<body>', '<body>' + HTML, 1)
    # JS → </body> 앞
    content = content.replace('</body>', JS + '\n</body>')

    open(fname, 'w', encoding='utf-8').write(content)
    print(f'  ✓ {fname}')
    count += 1

print(f'\n완료: {count}개 파일에 읽기 진행 바 추가됨')
