import argparse
import csv
import random
from pathlib import Path


CATEGORIES = [
    {
        "category": "總類與參考",
        "prefix": "000",
        "weight": 5,
        "subcategories": ["百科全書", "圖書館學", "資訊檢索", "年鑑", "研究方法"],
        "topics": ["知識整理", "資料查找", "公共圖書館", "學術寫作", "數位典藏"],
    },
    {
        "category": "哲學與心理",
        "prefix": "100",
        "weight": 6,
        "subcategories": ["哲學", "倫理學", "心理學", "思考訓練", "人生哲學"],
        "topics": ["自我理解", "情緒管理", "批判思考", "幸福感", "心理韌性"],
    },
    {
        "category": "宗教與信仰",
        "prefix": "200",
        "weight": 4,
        "subcategories": ["宗教概論", "佛教", "基督宗教", "民間信仰", "神話"],
        "topics": ["信仰文化", "生命教育", "宗教藝術", "神話故事", "地方廟宇"],
    },
    {
        "category": "自然科學",
        "prefix": "300",
        "weight": 8,
        "subcategories": ["數學", "物理", "化學", "生物", "地球科學", "天文"],
        "topics": ["宇宙探索", "氣候變遷", "動植物觀察", "科學實驗", "數學思維"],
    },
    {
        "category": "應用科學與科技",
        "prefix": "400",
        "weight": 10,
        "subcategories": ["工程", "醫學保健", "農業", "家政", "食品", "建築"],
        "topics": ["健康照護", "智慧城市", "永續農業", "居家修繕", "飲食安全"],
    },
    {
        "category": "社會科學",
        "prefix": "500",
        "weight": 10,
        "subcategories": ["政治", "法律", "經濟", "社會學", "公共政策", "性別研究"],
        "topics": ["城市治理", "人口變遷", "勞動權益", "社會福利", "民主參與"],
    },
    {
        "category": "商業管理",
        "prefix": "494",
        "weight": 7,
        "subcategories": ["管理學", "行銷", "創業", "財務管理", "職場溝通"],
        "topics": ["品牌經營", "數位行銷", "職涯規劃", "領導力", "專案管理"],
    },
    {
        "category": "教育與學習",
        "prefix": "520",
        "weight": 8,
        "subcategories": ["教育理論", "教學法", "親職教育", "特殊教育", "終身學習"],
        "topics": ["自主學習", "閱讀素養", "親子共讀", "班級經營", "學習動機"],
    },
    {
        "category": "資訊與電腦",
        "prefix": "540",
        "weight": 9,
        "subcategories": ["程式設計", "資料科學", "人工智慧", "網路安全", "軟體工程"],
        "topics": ["Python", "資料視覺化", "機器學習", "生成式 AI", "雲端服務"],
    },
    {
        "category": "考試與證照",
        "prefix": "550",
        "weight": 5,
        "subcategories": ["公職考試", "語言檢定", "證照考試", "升學考試", "題庫解析"],
        "topics": ["國考準備", "英文檢定", "面試技巧", "讀書計畫", "考古題解析"],
    },
    {
        "category": "生活休閒",
        "prefix": "420",
        "weight": 7,
        "subcategories": ["烹飪", "園藝", "手作", "運動", "寵物", "居家生活"],
        "topics": ["健康料理", "陽台園藝", "手作設計", "體能訓練", "收納整理"],
    },
    {
        "category": "期刊與報紙",
        "prefix": "050",
        "weight": 4,
        "subcategories": ["新聞時事", "商業雜誌", "科普雜誌", "藝文期刊", "地方刊物"],
        "topics": ["年度時事", "產業趨勢", "科學新知", "文化評論", "地方生活"],
    },
    {
        "category": "語言",
        "prefix": "800",
        "weight": 7,
        "subcategories": ["中文", "英文", "日文", "韓文", "語言學", "寫作"],
        "topics": ["商用英文", "日語會話", "中文寫作", "語言文化", "翻譯技巧"],
    },
    {
        "category": "文學",
        "prefix": "850",
        "weight": 14,
        "subcategories": ["台灣文學", "華文小說", "日本文學", "歐美文學", "詩", "散文"],
        "topics": ["家族記憶", "城市故事", "青春成長", "懸疑推理", "歷史小說"],
    },
    {
        "category": "藝術與設計",
        "prefix": "900",
        "weight": 8,
        "subcategories": ["美術", "音樂", "電影", "攝影", "設計", "表演藝術"],
        "topics": ["影像敘事", "美感教育", "地方工藝", "音樂欣賞", "展覽策劃"],
    },
    {
        "category": "歷史地理與旅遊",
        "prefix": "700",
        "weight": 9,
        "subcategories": ["台灣史", "世界史", "傳記", "地理", "旅遊", "地方誌"],
        "topics": ["高雄地方史", "港都文化", "世界文明", "城市散步", "文化資產"],
    },
    {
        "category": "兒童與青少年",
        "prefix": "870",
        "weight": 10,
        "subcategories": ["繪本", "橋梁書", "少年小說", "科普讀物", "品格教育"],
        "topics": ["友誼", "情緒教育", "自然觀察", "校園生活", "家庭關係"],
    },
    {
        "category": "漫畫與輕小說",
        "prefix": "947",
        "weight": 5,
        "subcategories": ["漫畫", "圖像小說", "輕小說", "動畫研究", "角色設定"],
        "topics": ["冒險", "校園", "奇幻世界", "科幻未來", "職人故事"],
    },
]

PUBLISHERS = [
    "遠流出版",
    "天下文化",
    "商周出版",
    "時報文化",
    "聯經出版",
    "三民書局",
    "小天下",
    "親子天下",
    "大塊文化",
    "麥田出版",
    "晨星出版",
    "木馬文化",
    "城邦文化",
    "國立公共資訊圖書館",
    "高雄市立圖書館",
]

FAMILY_NAMES = ["陳", "林", "黃", "張", "李", "王", "吳", "劉", "蔡", "楊", "許", "鄭", "謝", "郭"]
GIVEN_NAMES = ["怡君", "冠宇", "雅婷", "志明", "欣怡", "柏翰", "佳穎", "建宏", "子涵", "品妤", "俊傑", "家豪"]
TITLE_PATTERNS = [
    "{topic}入門",
    "{topic}完全指南",
    "圖解{topic}",
    "{topic}的日常實踐",
    "給初學者的{topic}",
    "{topic}與現代生活",
    "從零開始學{topic}",
    "{topic}案例研究",
    "城市裡的{topic}",
    "{topic}：理論與實務",
]


def weighted_category():
    return random.choices(CATEGORIES, weights=[item["weight"] for item in CATEGORIES], k=1)[0]


def make_author():
    if random.random() < 0.08:
        return "高雄市立圖書館編輯小組"
    return random.choice(FAMILY_NAMES) + random.choice(GIVEN_NAMES)


def make_classification_no(prefix):
    minor = random.randint(0, 99)
    decimal = random.randint(0, 9)
    return f"{prefix}.{minor:02d}{decimal}"


def make_isbn13(index):
    body = f"978986{index:06d}"
    total = sum((1 if i % 2 == 0 else 3) * int(digit) for i, digit in enumerate(body))
    check_digit = (10 - total % 10) % 10
    return f"{body}{check_digit}"


def make_book(index):
    category = weighted_category()
    topic = random.choice(category["topics"])
    subcategory = random.choice(category["subcategories"])
    title = random.choice(TITLE_PATTERNS).format(topic=topic)
    year = random.randint(2005, 2026)

    return {
        "title": title,
        "isbn": make_isbn13(index),
        "author": make_author(),
        "publisher": random.choice(PUBLISHERS),
        "publication_year": year,
        "classification_no": make_classification_no(category["prefix"]),
        "category": category["category"],
        "subcategory": subcategory,
        "summary": (
            f"本書以{subcategory}為主軸，介紹{topic}的核心概念、案例與實際應用，"
            f"適合作為圖書館主題策展、閱讀推廣與讀者延伸學習之館藏資料。"
        ),
    }


def write_catalog(output, count, seed):
    random.seed(seed)
    output.parent.mkdir(parents=True, exist_ok=True)
    rows = [make_book(index) for index in range(1, count + 1)]

    with output.open("w", newline="", encoding="utf-8-sig") as file:
        writer = csv.DictWriter(file, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)

    return rows


def parse_args():
    parser = argparse.ArgumentParser(description="Generate fake library catalog CSV data.")
    parser.add_argument("--count", type=int, default=1000, help="Number of books to generate.")
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("data/fake_catalog.csv"),
        help="Output CSV path.",
    )
    parser.add_argument("--seed", type=int, default=20260615, help="Random seed.")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    generated_rows = write_catalog(args.output, args.count, args.seed)
    print(f"Generated {len(generated_rows)} books: {args.output}")
