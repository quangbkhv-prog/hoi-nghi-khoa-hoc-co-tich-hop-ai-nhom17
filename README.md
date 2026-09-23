# Hệ thống quản lý hội nghị khoa học có tích hợp AI

## 1. Công nghệ
- Frontend: React + Vite
- Backend: FastAPI
- Database: SQLite + SQLAlchemy
- Authentication: JWT + phân quyền theo vai trò
- AI: endpoint demo tóm tắt bài báo và gợi ý phản biện; có thể thay bằng API AI thật sau khi cấu hình.

## 2. Đáp ứng Bài kiểm tra thường xuyên 2
1. Cấu trúc rõ ràng: `frontend/`, `backend/`, `README.md`, `.env.example`.
2. Đăng nhập, đăng ký tài khoản trực tiếp trên web và phân quyền: ADMIN, ORGANIZER, AUTHOR, REVIEWER.
3. CRUD nghiệp vụ: hội nghị, bài báo, phản biện; thêm phân công và kết quả.
4. Tìm kiếm/lọc: tìm hội nghị, bài báo, phản biện.
5. Dashboard: số hội nghị, bài báo, bài đang/đã phản biện, accepted, đăng ký, phản biện.
6. UI rõ ràng: sidebar, dashboard, bảng dữ liệu, trạng thái, thông báo lỗi.
7. CSDL: các bảng USERS, ROLES (role trong USERS cho bản demo), CONFERENCES, PAPERS, REVIEWERS, REVIEW_ASSIGNMENTS, REVIEWS, REGISTRATIONS, NOTIFICATIONS.
8. Xử lý lỗi: HTTP 400/401/403/404; kiểm tra quyền và dữ liệu tồn tại.
9. Minh chứng AI: phần `AI` trong giao diện và tài liệu prompt ở `docs/AI_EVIDENCE.md`.
10. README: hướng dẫn cài đặt/chạy, tài khoản demo, biến môi trường.

## 3. Chạy Backend
```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
API: http://localhost:8000/docs

## 4. Chạy Frontend
```bash
cd frontend
npm install
npm run dev
```
Mở http://localhost:5173

## 5. Đăng ký tài khoản trực tiếp trên web

Tại màn hình đăng nhập, bấm **Tạo tài khoản mới**. Người dùng có thể nhập **họ tên, email, mật khẩu, xác nhận mật khẩu** và chọn vai trò **Tác giả** hoặc **Phản biện**. Sau khi đăng ký thành công, hệ thống tự động đăng nhập bằng tài khoản vừa tạo.

API sử dụng: `POST /auth/register`. Backend chỉ cho phép đăng ký hai vai trò công khai là `AUTHOR` và `REVIEWER`; không cho phép tự đăng ký tài khoản `ADMIN` hoặc `ORGANIZER`.

## 6. Tài khoản demo
- Admin: admin@example.com / Admin@123
- Ban tổ chức: organizer@example.com / Admin@123
- Tác giả: author@example.com / Admin@123
- Phản biện: reviewer@example.com / Admin@123

## 7. Luồng demo 5-7 phút
1. Đăng nhập Ban tổ chức -> Dashboard.
2. Xem/tìm hội nghị và bài báo.
3. Tạo hoặc sửa dữ liệu hội nghị/phản biện qua API Swagger.
4. Phân công phản biện.
5. Đăng nhập tài khoản REVIEWER và gửi kết quả.
6. Đăng nhập lại Ban tổ chức -> xem kết quả.
7. Chọn bài báo -> Tóm tắt AI.
8. Mở `/docs` để minh chứng API, authentication, CRUD và AI.


## Chức năng thêm hội nghị trực tiếp trên web
Đăng nhập bằng tài khoản ADMIN/ORGANIZER, chọn **Hội nghị** → **+ Thêm hội nghị**. Điền tên, địa điểm, thời gian, hạn nộp bài, hạn phản biện, trạng thái và mô tả rồi bấm **Lưu hội nghị**. Dữ liệu được gửi tới `POST /conferences` và lưu vào SQLite.


## 8. Cấu hình AI thật

Sau khi giải nén project, vào `backend` và sao chép `.env.example` thành `.env`.

### Dùng OpenAI
Đặt:
```env
AI_PROVIDER=openai
OPENAI_API_KEY=your-api-key-here
OPENAI_MODEL=gpt-5.6-luna
AI_TIMEOUT=60
```
Không đưa API key vào React/frontend hoặc commit lên Git.

### Dùng Ollama cục bộ
Đặt:
```env
AI_PROVIDER=ollama
OLLAMA_URL=http://127.0.0.1:11434/api/chat
OLLAMA_MODEL=llama3.1
```

Sau khi cấu hình, khởi động lại backend. Trong web chọn **🤖 Trợ lý AI** để dùng 3 chức năng: **Tóm tắt bài báo**, **Gợi ý phản biện**, **Sinh email nháp**.

API AI:
- `GET /ai/status`
- `POST /ai/summarize/{paper_id}`
- `GET /ai/recommend-reviewers/{paper_id}`
- `POST /ai/email/{paper_id}`

AI chỉ hỗ trợ tham khảo; quyết định học thuật cuối cùng thuộc con người.
