# Minh chứng tích hợp AI vào hệ thống

## 1. Các chức năng AI
- Tóm tắt bài báo từ tiêu đề, abstract và từ khóa.
- Gợi ý tối đa 3 phản biện dựa trên dữ liệu bài báo và chuyên môn phản biện.
- Sinh email nháp từ bài báo và kết quả phản biện.
- Trang `🤖 Trợ lý AI` tích hợp trực tiếp trong frontend.

## 2. Kiến trúc
Frontend React → `/api/ai/*` → FastAPI → AI provider → kết quả hiển thị trên web.
API key chỉ nằm ở backend, không đưa vào frontend.

## 3. Provider
- `AI_PROVIDER=openai`: dùng OpenAI Responses API.
- `AI_PROVIDER=ollama`: dùng Ollama chạy cục bộ.

## 4. Prompt
System prompt yêu cầu AI chỉ hỗ trợ, không quyết định Accept/Reject và không bịa dữ liệu.
Prompt template nằm tại `backend/prompts/`.

## 5. Kiểm soát đạo đức học thuật
Kết quả AI luôn có cảnh báo cần người dùng kiểm tra. AI không được dùng để tự động quyết định chấp nhận/từ chối bài báo.

## 6. Ba vòng tối ưu prompt
1. Prompt cơ bản: yêu cầu tóm tắt.
2. Prompt có vai trò + cấu trúc đầu ra.
3. Prompt có ràng buộc không suy diễn, dữ liệu thiếu và cảnh báo quyết định học thuật.
