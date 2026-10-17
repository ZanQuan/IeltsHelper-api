using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IeltsHelper.Api.Controllers;

[Route("api/[controller]")]
[Authorize(Roles = "Teacher,Admin")]
public class AudiosController : BaseApiController
{
    // Giới hạn dung lượng một file audio. Phải nhỏ hơn maxAllowedContentLength trong web.config.
    private const long MaxAudioBytes = 100L * 1024 * 1024;

    private readonly IWebHostEnvironment _env;
    private readonly ILogger<AudiosController> _logger;

    public AudiosController(IWebHostEnvironment env, ILogger<AudiosController> logger)
    {
        _env = env;
        _logger = logger;
    }

    // POST: /api/Audios/upload  (multipart/form-data, trường "file")
    [HttpPost("upload")]
    [RequestSizeLimit(MaxAudioBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxAudioBytes)]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "Chưa chọn file audio." });

        if (file.Length > MaxAudioBytes)
            return BadRequest(new { error = $"File quá lớn, tối đa {MaxAudioBytes / 1024 / 1024} MB." });

        var extension = DetectAudioExtension(file);
        if (extension == null)
        {
            _logger.LogWarning("Audio upload rejected for user {UserId}: nội dung không phải MP3/WAV/OGG/M4A", CurrentUserId);
            return BadRequest(new { error = "Chỉ chấp nhận file audio MP3, WAV, OGG hoặc M4A hợp lệ." });
        }

        var folder = Path.Combine(_env.ContentRootPath, "Audios");
        Directory.CreateDirectory(folder);

        // Tên file trên đĩa do server tự sinh: không ghi đè được file khác, không chui ra ngoài thư mục
        var storedName = $"{Guid.NewGuid():N}{extension}";
        var path = Path.Combine(folder, storedName);

        await using (var stream = new FileStream(path, FileMode.CreateNew, FileAccess.Write, FileShare.None, 81920, useAsync: true))
        {
            await file.CopyToAsync(stream);
        }

        var url = $"{Request.Scheme}://{Request.Host}{Request.PathBase}/Audios/{storedName}";
        _logger.LogInformation("User {UserId} uploaded audio {File} ({Size} bytes)", CurrentUserId, storedName, file.Length);

        return Ok(new { url, fileName = file.FileName, sizeBytes = file.Length });
    }

    // Đọc vài byte đầu để xác định loại audio thật, trả về đuôi file hoặc null
    private static string? DetectAudioExtension(IFormFile file)
    {
        Span<byte> h = stackalloc byte[12];
        using var stream = file.OpenReadStream();
        var read = stream.Read(h);

        // MP3: thẻ ID3 ("ID3") hoặc khung đồng bộ MPEG (11 bit đầu bằng 1)
        if (read >= 3 && h[0] == (byte)'I' && h[1] == (byte)'D' && h[2] == (byte)'3')
            return ".mp3";
        if (read >= 2 && h[0] == 0xFF && (h[1] & 0xE0) == 0xE0)
            return ".mp3";

        // WAV: "RIFF" .... "WAVE"
        if (read >= 12 && h[0] == (byte)'R' && h[1] == (byte)'I' && h[2] == (byte)'F' && h[3] == (byte)'F'
            && h[8] == (byte)'W' && h[9] == (byte)'A' && h[10] == (byte)'V' && h[11] == (byte)'E')
            return ".wav";

        // OGG: "OggS"
        if (read >= 4 && h[0] == (byte)'O' && h[1] == (byte)'g' && h[2] == (byte)'g' && h[3] == (byte)'S')
            return ".ogg";

        // M4A: "ftyp" với brand "M4A "
        if (read >= 12 && h[4] == (byte)'f' && h[5] == (byte)'t' && h[6] == (byte)'y' && h[7] == (byte)'p'
            && h[8] == (byte)'M' && h[9] == (byte)'4' && h[10] == (byte)'A')
            return ".m4a";

        return null;
    }
}
