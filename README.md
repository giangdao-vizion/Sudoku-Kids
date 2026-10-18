# Sudoku Kids

Game Sudoku dành cho trẻ em **3–7 tuổi**, xây dựng bằng HTML, CSS và JavaScript thuần (không framework).

## Chơi online

Truy cập bản deploy GitHub Pages:

**https://giangdao-vizion.github.io/Sudoku-Kids/**

## Chạy local

Mở `index.html` trong trình duyệt, hoặc chạy server tĩnh:

```bash
python3 -m http.server 8080
```

Rồi vào `http://localhost:8080`.

## Tính năng

- Màn hình Home chọn bảng: **2×2**, **3×3**, **4×4**, **9×9**
  - **2×2**: **1 khu**, số 1–2
  - **3×3**: **1 khu**, số 1–3
  - **4×4**: khối 2×2, số 1–4
  - **9×9**: khối 3×3, số 1–9
- **4×4** và **9×9** có chế độ **Easy / Medium / Hard**
- Màn chơi: highlight hàng/cột/khu, numpad cố định, Undo / Xóa / Gợi ý, đồng hồ, lỗi 0/3
- **Điểm** lưu bằng `localStorage` (không cần backend)
- Giao diện mobile-first, phù hợp trẻ nhỏ

## Cấu trúc

```
├── index.html      # Giao diện Home + màn chơi
├── css/style.css   # Style mobile-first
└── js/game.js      # Logic Sudoku & tương tác
```
