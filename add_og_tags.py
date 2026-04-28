"""
F3YNM4N — OG 태그 일괄 삽입 스크립트
사용법: 이 파일을 홈피만들기 찐 폴더에 넣고 실행
  python add_og_tags.py
"""

import os

og_data = {
    "index.html": {
        "title": "F3YNM4N — 독립 매거진",
        "description": "팝사이언스, 영화 비평, 경제 칼럼, 대체역사, 잡생각. 직관을 먼저 던지고 구조로 증명하는 독립 매거진.",
        "url": "https://f3ynm4n.com"
    },
    "about.html": {
        "title": "About · F3YNM4N",
        "description": "낮에는 공장, 밤에는 매거진. 제조업 종사자이자 독립 창작자·웹소설 작가가 운영하는 독립 매거진 F3YNM4N.",
        "url": "https://f3ynm4n.com/about.html"
    },
    "pbgc.html": {
        "title": "PBGC — 평행 경계 기하학 우주론 · F3YNM4N",
        "description": "중력을 배경으로 보는 관점에서 출발한 독립 우주론 프레임워크. DESI 관측 데이터와의 연관성까지.",
        "url": "https://f3ynm4n.com/pbgc.html"
    },
    "tenet.html": {
        "title": "테넷 — 시간의 도구화와 그 한계 · F3YNM4N",
        "description": "놀란의 테넷이 시간을 다루는 방식에 대한 비평. 도구의 오남용이라는 프레임으로 읽는 테넷.",
        "url": "https://f3ynm4n.com/tenet.html"
    },
    "alienoid.html": {
        "title": "외계+인 — 한국 SF가 놓친 것들 · F3YNM4N",
        "description": "외계+인 시리즈 비평. 소재의 가능성과 연출의 간극 사이에서.",
        "url": "https://f3ynm4n.com/alienoid.html"
    },
    "spyfamily.html": {
        "title": "저 두 사람, 진짜 같이 사는 거 맞나요? · F3YNM4N",
        "description": "위장의 본질은 서류가 아니라 공기다. 로이드와 요르 사이에 흐르는 것은 수년의 생활이 아니라 — 여전히 첫 만남의 긴장이다.",
        "url": "https://f3ynm4n.com/spyfamily.html"
    },
    "evolution.html": {
        "title": "강한 놈은 다 먹혔다, 맛없는 놈이 살아남았다 · F3YNM4N",
        "description": "진화를 '강한 자가 살아남는다'고 하는데, 인류가 등장한 이후부터는 그 공식이 좀 달라진다.",
        "url": "https://f3ynm4n.com/evolution.html"
    },
    "threebody.html": {
        "title": "현실판 지자 공작인가 — 美 핵심 과학자 11명 실종과 삼체 · F3YNM4N",
        "description": "뉴스 보다가 소름 돋아서 쓰는 글. feat. 삼체. UAP 연구자가 리스트에 있다는 대목에서 분위기가 달라진다.",
        "url": "https://f3ynm4n.com/threebody.html"
    },
    "wage_gap.html": {
        "title": "임금 격차는 왜 좁혀지지 않는가 · F3YNM4N",
        "description": "임금 격차 문제를 구조적으로 들여다보는 칼럼.",
        "url": "https://f3ynm4n.com/wage_gap.html"
    },
    "civilization.html": {
        "title": "문명의 경계에서 · F3YNM4N",
        "description": "문명과 문화의 경계, 그리고 그 사이에서 사라지는 것들에 대하여.",
        "url": "https://f3ynm4n.com/civilization.html"
    },
    "sundaeland.html": {
        "title": "순다랜드 — 동남아시아의 잃어버린 문명 · F3YNM4N",
        "description": "빙하기가 끝나며 바다에 잠긴 대륙 순다랜드. 인류 문명의 또 다른 기원에 대한 탐구.",
        "url": "https://f3ynm4n.com/sundaeland.html"
    },
    "persia.html": {
        "title": "페르시아 — 역사가 지운 제국 · F3YNM4N",
        "description": "서구 중심 역사관이 지워버린 페르시아 제국의 실체를 다시 읽는다.",
        "url": "https://f3ynm4n.com/persia.html"
    },
    "korea_ai.html": {
        "title": "AI 시대, 한국이 100년 만에 맞이한 기회 · F3YNM4N",
        "description": "기술, 인구, 지정학이 동시에 흔들리는 전환기. 그 기회는 균등하게 나눠지지 않는다.",
        "url": "https://f3ynm4n.com/korea_ai.html"
    },
    "oil_refinery.html": {
        "title": "석유가 재생된다고? 지구가 사실 정유공장이라는 가설 · F3YNM4N",
        "description": "밥 먹다가 나온 생각치고는 꽤 연결이 됩니다. 지구 내부에서 수소가 올라와 석유가 만들어진다면?",
        "url": "https://f3ynm4n.com/oil_refinery.html"
    },
    "dilution.html": {
        "title": "희석하면 덜 취한다 — 바보 같은 말인데 과학적으로 맞습니다 · F3YNM4N",
        "description": "이유는 틀렸는데 결론은 맞았던 케이스. 온더락 vs 하이볼, 총량은 같은데 결과가 다른 이유.",
        "url": "https://f3ynm4n.com/dilution.html"
    },
    "income_growth.html": {
        "title": "소득주도성장이 과연 실패한 정책인가요 · F3YNM4N",
        "description": "진영이 정해지면 사실관계보다 결론이 먼저 나온다. 같은 기준으로 한 번만 다시 보자.",
        "url": "https://f3ynm4n.com/income_growth.html"
    },
    "misik_index.html": {
        "title": "미식의 나라 · F3YNM4N",
        "description": "음식을 통해 문화와 역사를 읽는 미식 시리즈.",
        "url": "https://f3ynm4n.com/misik_index.html"
    },
    "misik_1.html": {
        "title": "미식의 나라 1편 · F3YNM4N",
        "description": "미식 시리즈 1편.",
        "url": "https://f3ynm4n.com/misik_1.html"
    },
    "misik_2.html": {
        "title": "미식의 나라 2편 · F3YNM4N",
        "description": "미식 시리즈 2편.",
        "url": "https://f3ynm4n.com/misik_2.html"
    },
    "misik_3.html": {
        "title": "미식의 나라 3편 · F3YNM4N",
        "description": "미식 시리즈 3편.",
        "url": "https://f3ynm4n.com/misik_3.html"
    },
    "misik_4.html": {
        "title": "미식의 나라 4편 · F3YNM4N",
        "description": "미식 시리즈 4편.",
        "url": "https://f3ynm4n.com/misik_4.html"
    },
    "misik_5.html": {
        "title": "미식의 나라 5편 · F3YNM4N",
        "description": "미식 시리즈 5편.",
        "url": "https://f3ynm4n.com/misik_5.html"
    },
}

def make_og_tags(data):
    return f"""  <!-- OG / SEO -->
  <meta name="description" content="{data['description']}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="F3YNM4N">
  <meta property="og:title" content="{data['title']}">
  <meta property="og:description" content="{data['description']}">
  <meta property="og:url" content="{data['url']}">
  <meta property="og:image" content="https://f3ynm4n.com/og_default.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{data['title']}">
  <meta name="twitter:description" content="{data['description']}">
  <meta name="twitter:image" content="https://f3ynm4n.com/og_default.png">"""

html_files = [f for f in os.listdir('.') if f.endswith('.html')]
done, skipped, no_data = [], [], []

for fname in sorted(html_files):
    if fname not in og_data:
        no_data.append(fname)
        continue

    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'og:title' in content:
        skipped.append(fname)
        continue

    og_tags = make_og_tags(og_data[fname])
    content = content.replace(
        '<meta name="viewport"',
        f'{og_tags}\n  <meta name="viewport"',
        1
    )

    with open(fname, 'w', encoding='utf-8') as f:
        f.write(content)
    done.append(fname)

print(f"\n✅ 완료 ({len(done)}개):")
for f in done: print(f"   {f}")
print(f"\n⏭  이미 있음 ({len(skipped)}개):")
for f in skipped: print(f"   {f}")
if no_data:
    print(f"\n⚠️  데이터 없음 ({len(no_data)}개):")
    for f in no_data: print(f"   {f}")
print("\n🎉 완료! git add . && git commit -m 'OG 태그 추가' && git push")
