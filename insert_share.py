import os

EXCLUDE = {'index.html', 'admin.html', 'article.html', 'about.html',
           'contact.html', 'privacy.html', 'share_component.html',
           'misik_index.html'}

SHARE = open('share_component.html', encoding='utf-8').read()

count = 0
for fname in sorted(os.listdir('.')):
    if not fname.endswith('.html') or fname in EXCLUDE:
        continue
    content = open(fname, encoding='utf-8').read()
    if 'f3ShareBtn' in content:
        print(f'  skip (already has share): {fname}')
        continue
    content = content.replace('</body>', SHARE + '\n</body>')
    open(fname, 'w', encoding='utf-8').write(content)
    print(f'  ✓ {fname}')
    count += 1

print(f'\n완료: {count}개 파일에 공유 버튼 삽입됨')
