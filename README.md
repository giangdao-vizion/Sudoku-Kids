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

- Màn hình Home chọn bảng: **1×4**, **1×9**, **4×4**, **9×9**
  - **1×4**: lưới **2 hàng × 2 ô** (số 1–2)
  - **1×9**: một dòng 9 ô (số 1–9)
  - **4×4** / **9×9**: Sudoku chuẩn, các khối 2×2 / 3×3 tô màu xen kẽ
- **4×4** và **9×9** có chế độ **Easy / Medium / Hard**
- Nút **Gợi ý** khi đang chơi
- Chạm vào ô trống → hiện các số có thể chọn (không cần nhập bàn phím)
- Giao diện mobile-first, nút to, màu sắc vui nhộn, phù hợp trẻ nhỏ

## Cấu trúc

```
├── index.html      # Giao diện Home + màn chơi
├── css/style.css   # Style mobile-first
└── js/game.js      # Logic Sudoku & tương tác
```
