// B5.5-T4: tạo link tải tự động từ blob nhận từ API — dùng chung cho việc tải file
// (báo cáo CSV, ...). Tạo object URL tạm, gắn vào thẻ <a> ẩn rồi click để trình duyệt
// tải file về, sau đó thu hồi object URL để tránh rò rỉ bộ nhớ.
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}