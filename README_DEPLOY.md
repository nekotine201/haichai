# Haichai Script Studio - Firebase + Gemini

## 1) Chạy trên StackBlitz / local

```bash
npm install
npm run dev
```

Trong StackBlitz: tạo project React/Vite, copy toàn bộ file này vào, hoặc import repo GitHub sau khi push.

## 2) Firebase cần bật

Vào Firebase Console của project `haichai-script-studio`:

1. Authentication → Sign-in method → bật Google.
2. Authentication → Settings → Authorized domains:
   - thêm domain preview StackBlitz nếu dùng
   - thêm domain Cloudflare Pages dạng `ten-project.pages.dev`
   - thêm domain thật nếu có
3. Firestore Database → tạo database.
4. Firestore → Rules → dán nội dung trong `firestore.rules` rồi Publish.

## 3) Cloudflare Pages

Build command:

```bash
npm run build
```

Build output directory:

```bash
dist
```

## 4) Lưu ý Gemini API Key

Gemini API key được nhập trong tab `Cài đặt & Dữ liệu`.
App chỉ lưu key ở localStorage của trình duyệt hiện tại, không lưu lên Firestore.

Nếu muốn bảo mật hơn cho production, nên làm thêm Cloudflare Worker proxy để giấu Gemini key ở server-side.
