using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IeltsHelper.Api.Controllers;

[Route("api/[controller]")]
[Authorize(Roles = "Teacher,Admin")]
public class VideosController : BaseApiController
{
    // Giới hạn dung lượng một video. Nếu đổi số này, đổi luôn maxAllowedContentLength trong web.config.
    private const long MaxVideoBytes = 200L * 1024 * 1024;

    private readonly IWebHostEnvironment _env;
    private readonly ILogger<VideosController> _logger;

    public VideosController(IWebHostEnvironment env, ILogger<VideosController> logger)
    {
        _env = env;
        _logger = logger;
    }

    // POST: /api/Videos/upload  (multipart/form-data, trường "file")
    [HttpPost("upload")]
    [RequestSizeLimit(MaxVideoBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxVideoBytes)]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "Chưa chọn file video." });

        if (file.Length > MaxVideoBytes)
            return BadRequest(new { error = $"Video quá lớn, tối đa {MaxVideoBytes / 1024 / 1024} MB." });

        var extension = DetectVideoExtension(file);
        if (extension == null)
        {
            _logger.LogWarning("Video upload rejected for user {UserId}: nội dung không phải MP4/WebM", CurrentUserId);
            return BadRequest(new { error = "Chỉ chấp nhận video MP4 hoặc WebM hợp lệ." });
        }

        var folder = Path.Combine(_env.ContentRootPath, "Videos");
        Directory.CreateDirectory(folder);

        // Tên file trên đĩa do server tự sinh: không ghi đè được file khác, không chui ra ngoài thư mục
        var storedName = $"{Guid.NewGuid():N}{extension}";
        var path = Path.Combine(folder, storedName);

        await using (var stream = new FileStream(path, FileMode.CreateNew, FileAccess.Write, FileShare.None, 81920, useAsync: true))
        {
            await file.CopyToAsync(stream);
        }

        var url = $"{Request.Scheme}://{Request.Host}{Request.PathBase}/Videos/{storedName}";
        _logger.LogInformation("User {UserId} uploaded video {File} ({Size} bytes)", CurrentUserId, storedName, file.Length);

        return Ok(new { url, fileName = file.FileName, sizeBytes = file.Length });
    }

    // Đọc vài byte đầu để xác định loại video thật: MP4 (có "ftyp") hoặc WebM (EBML), trả về đuôi file hoặc null
    private static string? DetectVideoExtension(IFormFile file)
    {
        Span<byte> h = stackalloc byte[12];
        using var stream = file.OpenReadStream();
        var read = stream.Read(h);

        // MP4: 4 byte kích thước, rồi "ftyp". Loại bỏ QuickTime (.mov) vì nhiều trình duyệt không phát được
        if (read >= 12 && h[4] == (byte)'f' && h[5] == (byte)'t' && h[6] == (byte)'y' && h[7] == (byte)'p'
            && !(h[8] == (byte)'q' && h[9] == (byte)'t'))
            return ".mp4";

        // WebM / Matroska: 1A 45 DF A3
        if (read >= 4 && h[0] == 0x1A && h[1] == 0x45 && h[2] == 0xDF && h[3] == 0xA3)
            return ".webm";

        return null;
    }
}
