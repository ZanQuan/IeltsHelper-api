using Microsoft.AspNetCore.Mvc;
using IeltsHelper.Api.Models;
using IeltsHelper.Api.Models.DTO;
using IeltsHelper.Api.Repositories;

namespace IeltsHelper.Api.Controllers;

[Route("api/[controller]")]
public class ImagesController : BaseApiController
{
    private readonly IImageRepository _imageRepository;
    private readonly ILogger<ImagesController> _logger;

    public ImagesController(IImageRepository imageRepository, ILogger<ImagesController> logger)
    {
        _imageRepository = imageRepository;
        _logger = logger;
    }

    // POST: /api/Images/Upload
    [HttpPost("Upload")]
    public async Task<IActionResult> Upload([FromForm] ImageUploadRequestDTO request)
    {
        var error = ValidateFileUpload(request);
        if (error != null)
        {
            _logger.LogWarning("Upload rejected for user {UserId}: {Reason}", CurrentUserId, error);
            return BadRequest(new { error });
        }

        // Chỉ giữ tên hiển thị an toàn, bỏ mọi ký tự không hợp lệ trong tên file
        var safeName = Path.GetFileNameWithoutExtension(request.FileName);
        safeName = string.Concat(safeName.Where(c => !Path.GetInvalidFileNameChars().Contains(c)));
        if (string.IsNullOrWhiteSpace(safeName)) safeName = "image";

        // Chuyển DTO sang domain model
        var imageDomainModel = new Image
        {
            File = request.File,
            FileExtension = Path.GetExtension(request.File.FileName).ToLowerInvariant(),
            FileSizeInBytes = request.File.Length,
            FileName = safeName,
            FileDescription = request.FileDescription
        };

        await _imageRepository.UploadAsync(imageDomainModel, CurrentUserId);
        return Ok(imageDomainModel);
    }

    // GET: /api/Images  (học viên thấy ảnh của mình, Admin thấy tất cả)
    [HttpGet]
    public async Task<IActionResult> GetAllInfoImages()
    {
        var allImages = await _imageRepository.GetAllInfoImagesAsync(User.IsInRole("Admin") ? null : CurrentUserId);
        return Ok(allImages);
    }

    // GET: /api/Images/Download?id=1
    [HttpGet("Download")]
    public async Task<IActionResult> DownloadImage(int id)
    {
        var result = await _imageRepository.DownloadFileAsync(id);
        if (result == null) return NotFound(new { error = "Không tìm thấy ảnh." });
        return File(result.Value.Bytes, result.Value.ContentType, result.Value.FileName);
    }

    // Trả về thông báo lỗi, hoặc null nếu hợp lệ
    private static string? ValidateFileUpload(ImageUploadRequestDTO request)
    {
        var allowExtensions = new[] { ".jpg", ".jpeg", ".png" };
        var allowContentTypes = new[] { "image/jpeg", "image/png" };

        if (!allowExtensions.Contains(Path.GetExtension(request.File.FileName).ToLowerInvariant()) ||
            !allowContentTypes.Contains(request.File.ContentType))
            return "Chỉ chấp nhận ảnh .jpg, .jpeg hoặc .png.";

        if (request.File.Length == 0)
            return "File ảnh rỗng.";

        if (request.File.Length > 5 * 1024 * 1024)
            return "Ảnh quá lớn, vui lòng chọn ảnh dưới 5MB.";

        return null;
    }
}
