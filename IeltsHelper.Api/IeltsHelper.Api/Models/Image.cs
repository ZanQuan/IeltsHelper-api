using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace IeltsHelper.Api.Models;

public class Image
{
    public int Id { get; set; }

    // Chỉ tồn tại trong bộ nhớ lúc upload, không lưu vào DB và không trả về cho client
    [NotMapped]
    [JsonIgnore]
    public IFormFile File { get; set; } = null!;

    public string FileName { get; set; } = string.Empty;       // tên hiển thị do người dùng đặt
    public string? FileDescription { get; set; }
    public string FileExtension { get; set; } = string.Empty;
    public long FileSizeInBytes { get; set; }
    public string StoredFileName { get; set; } = string.Empty; // tên thật trên đĩa (Guid)
    public string FilePath { get; set; } = string.Empty;       // URL truy cập ảnh

    public Guid UploadedByUserId { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
}
