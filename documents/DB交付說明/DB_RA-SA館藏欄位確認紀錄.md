# DB RA/SA 館藏欄位確認紀錄

本文件記錄 DB 角色針對 RA / SA 與系統規格書所做的館藏匯入欄位確認。依使用者確認，正式欄位以 `documents/系統規格書.md` 第 3 點「資料庫 Schema 設計」中的 `catalog_books` 欄位為準。

## 1. 已檢查文件

| 來源 | 檔案 | 檢查結果 |
| --- | --- | --- |
| RA | `documents/系統規格書/RA需求規劃表單彙整(高雄市總圖).xlsx` | 未另外列出正式館藏 Excel / CSV 欄位名稱 |
| SA | `documents/系統規格書/SA系統規劃表單(高雄市總圖).xlsx` | 未另外列出正式館藏 Excel / CSV 欄位名稱 |
| 系統規格書 | `documents/系統規格書.md` 第 3 點資料庫 Schema | 已確認 `catalog_books` 欄位，作為正式館藏匯入欄位依據 |

## 2. 掃描關鍵字

已用下列關鍵字檢查 RA / SA xlsx 工作表內容：

```text
館藏
ISBN
書名
分類號
匯入
catalog
import
圖書
```

掃描結果：

```text
RA需求規劃表單彙整(高雄市總圖).xlsx: 未找到符合關鍵字的正式館藏欄位列
SA系統規劃表單(高雄市總圖).xlsx: 未找到符合關鍵字的正式館藏欄位列
系統規格書.md 第 3 點: 已找到 catalog_books 欄位定義
```

因此正式館藏欄位以系統規格書第 3 點的 `catalog_books` 欄位為準。DB 端現有匯入功能已支援這些欄位。

## 3. 已確認正式館藏欄位

依 `documents/系統規格書.md` 第 3 點資料庫 Schema，正式館藏資料表為 `catalog_books`，欄位如下：

| CSV / Excel 欄位 | DB 欄位 | 必填 | 說明 |
| --- | --- | --- | --- |
| `title` | `catalog_books.title` | 是 | 書名 |
| `isbn` | `catalog_books.isbn` | 是 | ISBN |
| `classification_no` | `catalog_books.classification_no` | 是 | 圖書分類號，例如 `540` 或 `540.123` |
| `author` | `catalog_books.author` | 否 | 作者 |
| `publisher` | `catalog_books.publisher` | 否 | 出版社 |
| `publication_year` | `catalog_books.publication_year` | 否 | 出版年份 |
| `summary` | `catalog_books.summary` | 否 | 書籍簡介 |

匯入時會自動記錄：

| DB 欄位 | 說明 |
| --- | --- |
| `source_file` | 匯入來源檔名 |
| `imported_at` | 匯入時間 |

## 4. 目前欄位驗證規則

- `title`、`isbn`、`classification_no` 不可空白。
- CSV / Excel 必須包含必要欄位。
- `publication_year` 若有填寫，必須是整數。
- `classification_no` 必須符合 `000` 或 `000.000` 類型格式。
- 額外欄位目前可保留在來源檔案中，但不會寫入 `catalog_books`。

## 5. 需要向 RA / SA 補確認的問題

已確認正式 DB 欄位依系統規格書第 3 點。若 RA / SA 後續提供實際 Excel / CSV 檔案，仍建議確認檔案表頭是否與 DB 欄位完全一致：

| DB 需要欄位 | 建議正式欄位名稱 | RA / SA 待確認 |
| --- | --- | --- |
| 書名 | `title` | 已依系統規格書確認 |
| ISBN | `isbn` | 已依系統規格書確認 |
| 分類號 | `classification_no` | 已依系統規格書確認 |
| 作者 | `author` | 已依系統規格書確認 |
| 出版社 | `publisher` | 已依系統規格書確認 |
| 出版年份 | `publication_year` | 已依系統規格書確認 |
| 書籍簡介 | `summary` | 已依系統規格書確認 |

額外需要確認：

- 正式檔案格式是 CSV、XLSX，還是兩者都會提供。
- ISBN 是否可能有 `-` 或空白，例如 `978-986-000-001-6`。
- 分類號是否一定是中文圖書分類法格式。
- 是否會提供館藏狀態、館藏地、條碼號、索書號、語言、主題詞等額外欄位。
- 是否允許同一本書重複 ISBN。

## 6. DB 端建議處理方式

DB 端維持目前正式欄位：

```text
title,isbn,classification_no,author,publisher,publication_year,summary
```

若 RA / SA 後續提供的實際 Excel / CSV 使用中文欄位名稱，建議在 `CatalogService` 補上欄位別名對照，例如：

| 中文欄位 | 轉換後 DB 欄位 |
| --- | --- |
| `書名` | `title` |
| `ISBN` | `isbn` |
| `分類號` | `classification_no` |
| `作者` | `author` |
| `出版社` | `publisher` |
| `出版年` | `publication_year` |
| `簡介` | `summary` |

## 7. 結論

目前已依 `documents/系統規格書.md` 第 3 點確認正式館藏 DB 欄位名稱。DB 端現有匯入欄位、驗證規則與 `catalog_books` schema 一致。若 RA / SA 後續提供的實際 Excel / CSV 表頭與 DB 欄位不同，再補中文欄位別名或調整驗證規則。
