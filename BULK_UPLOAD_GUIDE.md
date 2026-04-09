# GreenBidz Bulk Upload — Complete User Guide
# GreenBidz 批量上傳 — 完整使用指南

---

## Table of Contents / 目錄

1. [What is Bulk Upload? / 什麼是批量上傳？](#1)
2. [Before You Start / 開始前的準備](#2)
3. [Step-by-Step Guide (English)](#3)
4. [逐步操作指南（繁體中文）](#4)
5. [Excel Column Reference / Excel 欄位說明](#5)
6. [Photo Naming Rules / 照片命名規則](#6)
7. [Category List / 類別清單](#7)
8. [Field Allowed Values / 欄位允許值](#8)
9. [Frequently Asked Questions / 常見問題](#9)

---

<a name="1"></a>
## 1. What is Bulk Upload? / 什麼是批量上傳？

### English
Bulk Upload lets you list **many machines at once** by filling in an Excel spreadsheet and uploading photos together. Instead of creating each listing one by one, you prepare all your data in Excel, add your product photos using a simple naming system, and upload everything in one go.

Each row in Excel becomes **one independent product + one auction batch** on GreenBidz.

### 繁體中文
批量上傳讓您透過填寫 Excel 試算表並一起上傳照片，**一次刊登多台機器**。不需要逐一建立刊登，您只需在 Excel 中準備好所有資料，用簡單的命名方式整理產品照片，然後一次上傳所有內容。

Excel 中的每一行都會在 GreenBidz 上建立**一個獨立的產品 + 一個競標批次**。

---

<a name="2"></a>
## 2. Before You Start / 開始前的準備

### English — Requirements
- You must be logged in as a **Seller**
- Prepare your product information (title, category, condition, price, etc.)
- Prepare your product photos (JPG, PNG, WEBP — max 10 photos per product)
- Go to: **Dashboard → Bulk Upload** (sidebar)

### 繁體中文 — 準備事項
- 您必須以**賣家**身份登入
- 準備您的產品資訊（標題、類別、狀態、價格等）
- 準備您的產品照片（JPG、PNG、WEBP — 每個產品最多 10 張）
- 前往：**儀表板 → 批量上傳**（側邊欄）

---

<a name="3"></a>
## 3. Step-by-Step Guide — English

---

### STEP 1 — Download the Excel Template

1. Open **Dashboard → Bulk Upload** in your seller dashboard sidebar.
2. Choose your **language** from the 4 options:
   - 🇺🇸 English
   - 🇹🇼 繁體中文 (Traditional Chinese)
   - 🇯🇵 日本語 (Japanese)
   - 🇹🇭 ภาษาไทย (Thai)
3. Click **"Download Template"**.
4. An Excel file named `bulk_upload_template_en.xlsx` (or `_zh`, `_ja`, `_th`) will download to your computer.

> **Important:** Always use the official template. Do not change column names or the order of columns.

---

### STEP 2 — Fill in the Excel File

Open the downloaded file. You will see two sheets:

| Sheet Name | Purpose |
|---|---|
| **Products** | Fill your product data here — one row per machine |
| **Categories** | Helper sheet — provides the category dropdown options |

#### Products Sheet Layout

| Row | Content |
|---|---|
| Row 1 | Info message — do not edit |
| Row 2 | Column headers — do not edit |
| Row 3 | Example row — you can delete or overwrite |
| Row 4 onwards | **Your products — fill here** |

#### Columns to Fill (A → M)

| Column | Field | Required | Notes |
|---|---|---|---|
| A | **title** | ✅ Yes | Product name, e.g. "Mazak CNC Milling Machine 2019" |
| B | **category** | ✅ Yes | Click the cell → **dropdown arrow appears** → select a category |
| C | **description** | ✅ Yes | Short description of the machine |
| D | **condition** | ✅ Yes | `working` / `non-working` / `good` / `fair` |
| E | **operationStatus** | ✅ Yes | `operational` / `needs-repair` / `for-parts` |
| F | **location** | ✅ Yes | City and country, e.g. "Taipei, Taiwan" |
| G | **country** | ✅ Yes | 2-letter code: `TW` / `JP` / `KR` / `TH` / `SG` / `US` |
| H | **quantity** | ✅ Yes | Number of units, e.g. `1` |
| I | **priceFormat** | ✅ Yes | `buyNow` (fixed price) or `offer` (price on request) |
| J | **pricePerUnit** | ⚠️ If buyNow | Numeric price, e.g. `15000`. Leave blank if `offer` |
| K | **priceCurrency** | ✅ Yes | `USD` / `TWD` / `JPY` / `THB` |
| L | **weightPerUnit** | Optional | Weight in kg, e.g. `500` |
| M | **replacementCost** | Optional | New replacement cost, e.g. `25000` |

> **Category Dropdown:** Column B has a built-in Excel dropdown. Click any cell in column B and a dropdown arrow will appear. Select from the list — do not type manually to avoid spelling errors.

> **priceFormat Dropdown:** Column I also has a dropdown — select `buyNow` or `offer`.

> **priceCurrency Dropdown:** Column K has a dropdown — select `USD`, `TWD`, `JPY`, or `THB`.

---

### STEP 3 — Prepare Your Photos

This is the most important part. Photos must be named with a **row number prefix** so the system knows which photos belong to which product row.

#### Method A — Flat Files (Recommended for small uploads)

Name your photos using this format:
```
{rowNumber}_{photoNumber}.jpg
```

**Examples for a 5-product upload:**

```
Product Row 1:   1_1.jpg   1_2.jpg   1_3.jpg
Product Row 2:   2_1.jpg   2_2.jpg
Product Row 3:   3_1.jpg   3_2.jpg   3_3.jpg   3_4.jpg
Product Row 4:   4_1.jpg
Product Row 5:   5_1.jpg   5_2.jpg   5_3.jpg
```

- The **first number** = Excel row number of that product (counting from 1, not from Excel row numbers — Row 1 = your first data row)
- The **second number** = photo sequence (1 = main/cover photo)
- Separator can be `_` (underscore) or `-` (dash): `1-1.jpg` also works
- Up to **10 photos per product**

**To upload:** Put all flat files in one folder → Click **"Upload Photos (Flat Files)"** → Select all the files

#### Method B — Folder Structure (Recommended for large uploads)

Create one folder per product, named with the row number:

```
my_machines_photos/
├── 1/
│   ├── front.jpg
│   ├── side.jpg
│   └── serial.jpg
├── 2/
│   ├── photo1.jpg
│   └── photo2.jpg
├── 3/
│   └── overview.jpg
└── 4/
    ├── img1.jpg
    └── img2.jpg
```

- Each subfolder number = the product row number in Excel
- Photo filenames inside the subfolder can be anything
- **To upload:** Click **"Upload Photos (Folder)"** → Select the **parent folder** (e.g. `my_machines_photos/`)

> **Note:** Folder upload uses the browser's native folder picker. It reads all subfolders automatically.

---

### STEP 4 — Upload to GreenBidz

1. On the Bulk Upload page, click **"Select Excel File"** and choose your filled Excel file.
2. The system reads your file and shows a **preview table** of all your products.
3. Check that category names are shown correctly.
4. Click either **"Upload Photos (Flat Files)"** or **"Upload Photos (Folder)"** and select your photos.
5. The photo count will show (e.g. "24 photos loaded").
6. Click **"Upload All Products"**.

---

### STEP 5 — Monitor Progress

The system uploads each product **one by one** and shows live status:

| Status | Meaning |
|---|---|
| ⏳ Pending | Waiting to be uploaded |
| 🔄 Uploading | Currently being sent to server |
| ✅ Success | Product created + batch created |
| ❌ Error | Failed — see error message |

Each row shows its result:
```
✅ Row 1: Product #1045 · Batch #502 — success
✅ Row 2: Product #1046 · Batch #503 — success
❌ Row 3: Missing required field — error
```

At the end:
```
✅ 49 products uploaded — 49 batches created
❌ 1 product failed
```

---

### STEP 6 — After Upload

- Each successfully uploaded product appears in **My Listings** (`/dashboard/submissions`)
- Each product has its own auction batch in **Bids & Winners** (`/dashboard/bids`)
- Failed rows can be corrected and re-uploaded by removing the successful rows from Excel

---

<a name="4"></a>
## 4. 逐步操作指南 — 繁體中文

---

### 第 1 步 — 下載 Excel 範本

1. 在賣家儀表板側邊欄開啟 **儀表板 → 批量上傳**。
2. 從 4 個選項中選擇您的**語言**：
   - 🇺🇸 English（英文）
   - 🇹🇼 繁體中文
   - 🇯🇵 日本語
   - 🇹🇭 ภาษาไทย
3. 點擊 **「下載範本」**。
4. 名為 `bulk_upload_template_zh.xlsx` 的 Excel 檔案將下載至您的電腦。

> **重要：** 請務必使用官方範本。請勿更改欄位名稱或欄位順序。

---

### 第 2 步 — 填寫 Excel 檔案

開啟下載的檔案，您會看到兩個工作表：

| 工作表名稱 | 用途 |
|---|---|
| **Products（產品）** | 在此填寫產品資料 — 每台機器一行 |
| **Categories（類別）** | 輔助工作表 — 提供類別下拉選單選項 |

#### Products 工作表版面

| 行 | 內容 |
|---|---|
| 第 1 行 | 說明訊息 — 請勿編輯 |
| 第 2 行 | 欄位標題 — 請勿編輯 |
| 第 3 行 | 範例行 — 可刪除或覆蓋 |
| 第 4 行起 | **您的產品 — 在此填寫** |

#### 需填寫的欄位（A → M）

| 欄位 | 說明 | 必填 | 備註 |
|---|---|---|---|
| A | **title（標題）** | ✅ 是 | 產品名稱，例如「Mazak CNC 銑床 2019」|
| B | **category（類別）** | ✅ 是 | 點擊儲存格 → **出現下拉箭頭** → 選擇類別 |
| C | **description（描述）** | ✅ 是 | 機器的簡短說明 |
| D | **condition（狀態）** | ✅ 是 | `working`（可運行）/ `non-working` / `good` / `fair` |
| E | **operationStatus（運作狀態）** | ✅ 是 | `operational`（正常）/ `needs-repair` / `for-parts` |
| F | **location（地點）** | ✅ 是 | 城市與國家，例如「Taipei, Taiwan」|
| G | **country（國家代碼）** | ✅ 是 | 2 字母代碼：`TW` / `JP` / `KR` / `TH` / `SG` / `US` |
| H | **quantity（數量）** | ✅ 是 | 單位數量，例如 `1` |
| I | **priceFormat（定價方式）** | ✅ 是 | `buyNow`（定價）或 `offer`（議價）|
| J | **pricePerUnit（單價）** | ⚠️ buyNow 時必填 | 數字金額，例如 `15000`。`offer` 時留空 |
| K | **priceCurrency（幣別）** | ✅ 是 | `USD` / `TWD` / `JPY` / `THB` |
| L | **weightPerUnit（重量）** | 選填 | 公斤數，例如 `500` |
| M | **replacementCost（替換成本）** | 選填 | 新品替換費用，例如 `25000` |

> **類別下拉選單：** B 欄內建 Excel 下拉選單。點擊 B 欄任一儲存格，會出現下拉箭頭。請從清單中選取 — 請勿手動輸入，以避免拼字錯誤。

> **priceFormat 下拉選單：** I 欄也有下拉選單 — 選擇 `buyNow` 或 `offer`。

> **priceCurrency 下拉選單：** K 欄有下拉選單 — 選擇 `USD`、`TWD`、`JPY` 或 `THB`。

---

### 第 3 步 — 準備您的照片

這是最重要的部分。照片必須以**行號前綴**命名，系統才能識別哪些照片屬於哪個產品行。

#### 方法 A — 平面檔案（適合小量上傳）

使用以下格式命名您的照片：
```
{行號}_{照片編號}.jpg
```

**5 個產品上傳的範例：**

```
產品第 1 行：  1_1.jpg   1_2.jpg   1_3.jpg
產品第 2 行：  2_1.jpg   2_2.jpg
產品第 3 行：  3_1.jpg   3_2.jpg   3_3.jpg   3_4.jpg
產品第 4 行：  4_1.jpg
產品第 5 行：  5_1.jpg   5_2.jpg   5_3.jpg
```

- **第一個數字** = 該產品在 Excel 中的行號（從 1 開始計算，即您的第一個資料行）
- **第二個數字** = 照片順序（1 = 主圖/封面照）
- 分隔符可用 `_`（底線）或 `-`（連字號）：`1-1.jpg` 也可以
- 每個產品最多 **10 張照片**

**上傳方式：** 將所有平面檔案放入一個資料夾 → 點擊 **「上傳照片（平面檔案）」** → 選取所有檔案

#### 方法 B — 資料夾結構（適合大量上傳）

為每個產品建立一個以行號命名的資料夾：

```
my_machines_photos/（主資料夾）
├── 1/
│   ├── 正面.jpg
│   ├── 側面.jpg
│   └── 銘牌.jpg
├── 2/
│   ├── photo1.jpg
│   └── photo2.jpg
├── 3/
│   └── overview.jpg
└── 4/
    ├── img1.jpg
    └── img2.jpg
```

- 每個子資料夾的編號 = Excel 中對應的產品行號
- 子資料夾內的照片檔名可以是任意名稱
- **上傳方式：** 點擊 **「上傳照片（資料夾）」** → 選取**主資料夾**（例如 `my_machines_photos/`）

> **注意：** 資料夾上傳使用瀏覽器原生資料夾選擇器，會自動讀取所有子資料夾。

---

### 第 4 步 — 上傳至 GreenBidz

1. 在批量上傳頁面，點擊 **「選取 Excel 檔案」** 並選擇您填寫好的 Excel 檔案。
2. 系統讀取您的檔案並顯示所有產品的**預覽表格**。
3. 確認類別名稱顯示正確。
4. 點擊 **「上傳照片（平面檔案）」** 或 **「上傳照片（資料夾）」** 並選取您的照片。
5. 照片數量將會顯示（例如「已載入 24 張照片」）。
6. 點擊 **「上傳所有產品」**。

---

### 第 5 步 — 監控上傳進度

系統**逐一**上傳每個產品並顯示即時狀態：

| 狀態 | 意義 |
|---|---|
| ⏳ 等待中 | 等待上傳 |
| 🔄 上傳中 | 正在傳送至伺服器 |
| ✅ 成功 | 產品已建立 + 批次已建立 |
| ❌ 錯誤 | 失敗 — 查看錯誤訊息 |

每一行會顯示結果：
```
✅ 第 1 行：產品 #1045 · 批次 #502 — 成功
✅ 第 2 行：產品 #1046 · 批次 #503 — 成功
❌ 第 3 行：缺少必填欄位 — 錯誤
```

完成後：
```
✅ 已上傳 49 個產品 — 已建立 49 個批次
❌ 1 個產品失敗
```

---

### 第 6 步 — 上傳後

- 每個成功上傳的產品都會出現在 **我的刊登**（`/dashboard/submissions`）
- 每個產品都有自己的競標批次，位於 **出價與得標**（`/dashboard/bids`）
- 失敗的行可以修正後重新上傳（從 Excel 中移除成功的行）

---

<a name="5"></a>
## 5. Excel Column Reference / Excel 欄位說明

| Column | Field | Valid Values | Example |
|---|---|---|---|
| A | title | Any text | `Mazak CNC Milling Machine 2019` |
| B | category | **Dropdown only** — see Category List | `Milling Machines` |
| C | description | Any text | `Good condition, 2018 model` |
| D | condition | `working` `non-working` `good` `fair` | `working` |
| E | operationStatus | `operational` `needs-repair` `for-parts` | `operational` |
| F | location | City, Country | `Taipei, Taiwan` |
| G | country | ISO 2-letter code | `TW` `JP` `KR` `TH` `SG` `US` |
| H | quantity | Number | `1` |
| I | priceFormat | **Dropdown:** `buyNow` or `offer` | `buyNow` |
| J | pricePerUnit | Number (only if buyNow) | `15000` |
| K | priceCurrency | **Dropdown:** `USD` `TWD` `JPY` `THB` | `USD` |
| L | weightPerUnit | Number in kg | `500` |
| M | replacementCost | Number | `25000` |

---

<a name="6"></a>
## 6. Photo Naming Rules / 照片命名規則

### Quick Reference / 快速參考

```
Format:   {rowNumber}_{photoNumber}.jpg
格式：     {行號}_{照片編號}.jpg

Examples / 範例:
  1_1.jpg  →  Row 1, Photo 1 (main/cover)
  1_2.jpg  →  Row 1, Photo 2
  2_1.jpg  →  Row 2, Photo 1 (main/cover)
  10_3.jpg →  Row 10, Photo 3

Folder method / 資料夾方式:
  photos/1/front.jpg   →  Row 1
  photos/2/machine.jpg →  Row 2
```

### Important Rules / 重要規則

| Rule | English | 繁體中文 |
|---|---|---|
| Row numbers | Must match Excel data row numbers (1 = first data row) | 必須與 Excel 資料行號相符（1 = 第一個資料行）|
| Max photos | 10 photos per product | 每個產品最多 10 張照片 |
| First photo | `x_1.jpg` becomes the cover/main photo | `x_1.jpg` 成為封面/主圖 |
| Separator | Use `_` or `-` between row and photo number | 行號與照片編號之間使用 `_` 或 `-` |
| Products without photos | Will still upload (no photos attached) | 仍會上傳（無附加照片）|
| File types | JPG, PNG, WEBP accepted | 支援 JPG、PNG、WEBP |

---

<a name="7"></a>
## 7. Category List / 類別清單

All available categories. Use exact names from your template language when typing manually.
所有可用類別。手動輸入時請使用您範本語言的確切名稱。

| # | English | 繁體中文 | 日本語 | ภาษาไทย |
|---|---|---|---|---|
| 1 | Machining Centers | 加工中心 | マシニングセンタ | ศูนย์กลางการกลึง |
| 2 | Lathes (CNC & Conventional) | 車床（CNC 及傳統） | 旋盤（CNC・汎用） | เครื่องกลึง (CNC และทั่วไป) |
| 3 | Milling Machines | 銑床 | フライス盤 | เครื่องกัด |
| 4 | Boring & Drilling Machines | 搪孔及鑽孔機 | 中ぐり・ドリル盤 | เครื่องคว้านและเจาะ |
| 5 | Grinding & Finishing | 磨削及精加工 | 研削・仕上げ | เครื่องเจียรและขัดผิว |
| 6 | Sawing Machines | 鋸床 | 鋸盤 | เครื่องเลื่อย |
| 7 | Press Brakes & Shears | 折彎機及剪板機 | プレスブレーキ・剪断機 | เครื่องพับและตัดแผ่นโลหะ |
| 8 | Punching & Forging | 沖壓及鍛造 | パンチング・鍛造 | เครื่องปั๊มและตีขึ้นรูป |
| 9 | Laser & Plasma Cutting | 雷射及電漿切割 | レーザー・プラズマ切断 | เครื่องตัดเลเซอร์และพลาสมา |
| 10 | Welding Equipment | 焊接設備 | 溶接機器 | อุปกรณ์เชื่อม |
| 11 | Scrap | 廢料 | スクラップ | เศษโลหะ |
| 12 | Material Handling | 物料搬運 | マテリアルハンドリング | การจัดการวัสดุ |

> **Tip / 提示:** Always use the Excel category dropdown instead of typing. It prevents errors automatically.
> **提示：** 請務必使用 Excel 類別下拉選單，而非手動輸入，這樣可以自動防止錯誤。

---

<a name="8"></a>
## 8. Field Allowed Values / 欄位允許值

### condition (D column / D 欄)

| Value | English Meaning | 中文意思 |
|---|---|---|
| `working` | Machine works normally | 機器正常運作 |
| `non-working` | Machine does not work | 機器無法運作 |
| `good` | Good condition, minor wear | 良好狀態，輕微磨損 |
| `fair` | Fair condition, visible wear | 一般狀態，明顯磨損 |

### operationStatus (E column / E 欄)

| Value | English Meaning | 中文意思 |
|---|---|---|
| `operational` | Fully operational | 完全可運作 |
| `needs-repair` | Needs repair before use | 使用前需要維修 |
| `for-parts` | Only good for spare parts | 僅適合用於零件 |

### priceFormat (I column / I 欄)

| Value | English Meaning | 中文意思 |
|---|---|---|
| `buyNow` | Fixed price — enter price in column J | 定價 — 在 J 欄填入價格 |
| `offer` | Price on request / negotiable | 議價 / 洽談 |

### country (G column / G 欄) — Common codes

| Code | Country |
|---|---|
| `TW` | Taiwan 台灣 |
| `JP` | Japan 日本 |
| `KR` | South Korea 韓國 |
| `TH` | Thailand 泰國 |
| `SG` | Singapore 新加坡 |
| `US` | United States 美國 |
| `DE` | Germany 德國 |
| `CN` | China 中國 |

---

<a name="9"></a>
## 9. Frequently Asked Questions / 常見問題

---

**Q: How many products can I upload at once?**
**問：我一次可以上傳多少個產品？**

A: There is no hard limit. The template has 50 blank rows by default but you can add more. Each product uploads one by one, so larger batches simply take longer.
答：沒有硬性限制。範本預設有 50 個空白行，但您可以新增更多。每個產品逐一上傳，因此較大的批次只是需要更多時間。

---

**Q: What happens if one product fails?**
**問：如果一個產品失敗會怎樣？**

A: The upload continues for the remaining rows. Failed rows show a red ❌ with an error message. Successfully uploaded products are already live. You can fix the failed rows in Excel and re-upload only those rows.
答：上傳會繼續處理剩餘的行。失敗的行會顯示紅色 ❌ 和錯誤訊息。已成功上傳的產品已經上線。您可以在 Excel 中修正失敗的行，然後只重新上傳那些行。

---

**Q: Does each product get its own auction batch?**
**問：每個產品都有自己的競標批次嗎？**

A: Yes. Each row creates one product AND one auction batch independently. They appear separately in My Listings and Bids & Winners.
答：是的。每一行都會獨立建立一個產品和一個競標批次。它們會分別出現在「我的刊登」和「出價與得標」中。

---

**Q: What if I don't have photos for some products?**
**問：如果某些產品沒有照片怎麼辦？**

A: Products without photos will still upload successfully — they just won't have any images. You can add photos later by editing the listing.
答：沒有照片的產品仍會成功上傳 — 只是不會有任何圖片。您可以稍後透過編輯刊登來新增照片。

---

**Q: Can I use the Chinese template and upload it?**
**問：我可以使用中文範本並上傳嗎？**

A: Yes! Download the `zh` template. Category names in column B will be in Chinese (e.g. 加工中心). The system automatically converts them to the correct IDs. All 4 language templates produce the same result on the backend.
答：可以！下載 `zh` 範本。B 欄的類別名稱將以中文顯示（例如：加工中心）。系統會自動將其轉換為正確的 ID。所有 4 種語言範本在後端產生相同的結果。

---

**Q: My photos are not appearing — what went wrong?**
**問：我的照片沒有出現 — 哪裡出錯了？**

A: Check:
1. File names start with the correct row number: `1_1.jpg` (not `machine1.jpg`)
2. Row numbers match your Excel data rows (Row 1 = your first product)
3. You selected the photos BEFORE clicking Upload
4. Photos are JPG, PNG, or WEBP format

答：請檢查：
1. 檔案名稱以正確的行號開頭：`1_1.jpg`（不是 `machine1.jpg`）
2. 行號與您的 Excel 資料行相符（第 1 行 = 您的第一個產品）
3. 您在點擊上傳前已選取照片
4. 照片為 JPG、PNG 或 WEBP 格式

---

**Q: Can I add more rows than the template has?**
**問：我可以新增比範本更多的行嗎？**

A: Yes. Just add more rows below the existing ones in the Products sheet. Keep the same column order.
答：可以。只需在 Products 工作表中現有行的下方新增更多行。保持相同的欄位順序。

---

**Q: What is the "replacementCost" field?**
**問：「replacementCost」欄位是什麼？**

A: This is the cost to buy the same machine brand new today. It helps buyers understand the value of the used machine compared to new. It is optional.
答：這是今天購買同款全新機器的費用。它幫助買家了解二手機器相對於新機的價值。這是選填欄位。

---

## Full System Flow Diagram / 完整系統流程圖

```
SELLER / 賣家
     │
     ▼
[1] Download Template (.xlsx)
    Choose language: EN / ZH / JA / TH
    下載範本，選擇語言
     │
     ▼
[2] Fill Excel — One row per product
    填寫 Excel — 每台機器一行
    ├── Column B: Category dropdown ✓
    ├── Column I: priceFormat dropdown ✓
    └── Column K: priceCurrency dropdown ✓
     │
     ▼
[3] Prepare Photos
    準備照片
    ├── Method A: Flat files → 1_1.jpg, 1_2.jpg, 2_1.jpg ...
    └── Method B: Folders  → 1/ , 2/ , 3/ ...
     │
     ▼
[4] Upload Page
    批量上傳頁面
    ├── Select Excel file
    ├── Select photos (flat or folder)
    └── Click "Upload All Products"
     │
     ▼
[5] For each row (sequential) / 逐行處理
    ├── Resolve category → term_id (API)
    ├── POST /wp/create-product (with photos)
    │   └── Returns: product_id
    └── POST /batch/create { productIds: [product_id] }
        └── Returns: batch_id
     │
     ▼
[6] Result per row / 每行結果
    ✅ Product #1045 · Batch #502
    ✅ Product #1046 · Batch #503
    ❌ Row 3: error message
     │
     ▼
[7] Products live in / 產品出現在
    ├── My Listings (/dashboard/submissions)
    └── Bids & Winners (/dashboard/bids)
```

---

*GreenBidz Bulk Upload Guide — Version 1.0*
*批量上傳指南 — 版本 1.0*
