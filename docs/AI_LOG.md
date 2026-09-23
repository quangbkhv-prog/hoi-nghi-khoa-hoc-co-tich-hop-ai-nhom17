# NHẬT KÝ SỬ DỤNG AI TRONG PHÁT TRIỂN HỆ THỐNG (BKT2)

## Lần 1
**Ngày:** 01/09/2026  
**Mục đích:** Phân tích Actor và Use Case cho hệ thống Quản lý Hội nghị AI.  
**Prompt:** "Hãy liệt kê các Actor chính và Use Case cho hệ thống quản lý hội nghị khoa học tích hợp AI."  
**Kết quả AI:** Đề xuất 4 actor: Admin, Organizer, Reviewer, Author với đầy đủ chức năng CRUD.  
**Nhóm kiểm tra:** Rà soát lại yêu cầu đề bài, thấy phù hợp.  
**Phần đã sử dụng:** Cấu trúc danh sách các actor và luồng nghiệp vụ chính.  
**Phần đã chỉnh sửa:** Bổ sung thêm Use Case riêng cho chức năng Tóm tắt bài báo bằng AI (AI-01).

---

## Lần 2
**Ngày:** 02/09/2026  
**Mục đích:** Thiết kế cơ sở dữ liệu và các Entity (Paper, Assignment, Review, Registration).  
**Prompt:** "Tạo Schema cơ sở dữ liệu SQLAlchemy cho bài báo (Paper) và phân công phản biện (Assignment) có quan hệ ForeignKey."  
**Kết quả AI:** Sinh các class Python SQLAlchemy với đầy đủ thuộc tính `id`, `title`, `status`, `author_id`.  
**Nhóm kiểm tra:** Chạy thử migration, phát hiện thiếu trường lưu thông tin tóm tắt AI.  
**Phần đã chỉnh sửa:** Thêm trường `ai_summary = Column(String, default="")` vào model `Paper`.

---

## Lần 3
**Ngày:** 03/09/2026  
**Mục đích:** Viết API CRUD và tích hợp Middleware xác thực JWT.  
**Prompt:** "Viết hàm FastAPI kiểm tra Token JWT từ Header Authorization và trả về thông tin User."  
**Kết quả AI:** Sinh hàm `get_current_user` sử dụng `PyJWT`.  
**Nhóm kiểm tra:** Code chạy tốt nhưng chưa bắt trường hợp thiếu Token rõ ràng.  
**Phần đã chỉnh sửa:** Thêm tùy chỉnh ngoại lệ `HTTPException(status_code=401, detail="Thiếu token")` để trả về phản hồi lỗi chuẩn.