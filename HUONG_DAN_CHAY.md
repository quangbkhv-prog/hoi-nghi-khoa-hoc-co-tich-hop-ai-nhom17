# Conference AI - Hướng dẫn chạy

## 1. Backend
Cách dễ nhất trên Windows: chạy `start_backend.bat`.

Hoặc VS Code Terminal:
```cmd
cd backend
.venv\Scripts\activate
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Kiểm tra:
http://127.0.0.1:8000/health

## 2. Frontend
Terminal thứ hai:
```cmd
cd frontend
npm install
npm run dev
```

Mở:
http://localhost:5173

Frontend dùng Vite proxy `/api` -> `http://127.0.0.1:8000`, nên không còn lỗi CORS giữa frontend và backend.

## 3. Tài khoản demo
- ADMIN: admin@example.com / Admin@123
- ORGANIZER: organizer@example.com / Admin@123
- AUTHOR: author@example.com / Admin@123
- REVIEWER: reviewer@example.com / Admin@123

Nếu database cũ đã tồn tại, tài khoản demo vẫn phải tồn tại nếu database đã được seed từ project ban đầu. Nếu không, xóa `backend/conference.db` rồi khởi động backend một lần để seed lại dữ liệu mẫu.
