import os

FAVICON = '<link rel="icon" type="image/svg+xml" href="favicon.svg">'

count = 0
for fname in sorted(os.listdir('.')):
    if not fname.endswith('.html'):
        continue
    content = open(fname, encoding='utf-8').read()
    if 'favicon' in content:
        print(f'  skip (already has favicon): {fname}')
        continue
    content = content.replace('</head>', f'  {FAVICON}\n</head>', 1)
    open(fname, 'w', encoding='utf-8').write(content)
    print(f'  ✓ {fname}')
    count += 1

print(f'\n완료: {count}개 파일에 파비콘 추가됨')
