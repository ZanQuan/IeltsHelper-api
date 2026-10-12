using Microsoft.EntityFrameworkCore;
using IeltsHelper.Api.Data;
using IeltsHelper.Api.Models;

namespace IeltsHelper.Api.Repositories;

public class LocalImageRepository : IImageRepository
{
    private readonly IWebHostEnvironment _webHostEnvironment;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly AppDbContext _dbContext;
    private readonly ILogger<LocalImageRepository> _logger;

    public LocalImageRepository(
        IWebHostEnvironment webHostEnvironment,
        IHttpContextAccessor httpContextAccessor,
        AppDbContext dbContext,
        ILogger<LocalImageRepository> logger)
    {
        _webHostEnvironment = webHostEnvironment;
        _httpContextAccessor = httpContextAccessor;
        _dbContext = dbContext;
        _logger = logger;
    }

    private string ImagesFolder => Path.Combine(_webHostEnvironment.ContentRootPath, "Images");

    public async Task<Image> UploadAsync(Image image, Guid userId)
    {
        Directory.CreateDirectory(ImagesFolder);

        // Tên file trên đĩa do server tự sinh -> không ghi đè được file khác, không chui ra ngoài thư mục
        image.StoredFileName = $"{Guid.NewGuid():N}{image.FileExtension}";
        var localFilePath = Path.Combine(ImagesFolder, image.StoredFileName);

        await using (var stream = new FileStream(localFilePath, FileMode.Create))
        {
            await image.File.CopyToAsync(stream);
        }

        var request = _httpContextAccessor.HttpContext!.Request;
        image.FilePath = $"{request.Scheme}://{request.Host}{request.PathBase}/Images/{image.StoredFileName}";
        image.UploadedByUserId = userId;
        image.UploadedAt = DateTime.UtcNow;

        _dbContext.Images.Add(image);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("User {UserId} uploaded image {ImageId} ({Size} bytes)", userId, image.Id, image.FileSizeInBytes);
        return image;
    }

    public async Task<List<Image>> GetAllInfoImagesAsync(Guid? userId)
    {
        var query = _dbContext.Images.AsQueryable();
        if (userId != null) query = query.Where(i => i.UploadedByUserId == userId);
        return await query.OrderByDescending(i => i.UploadedAt).ToListAsync();
    }

    public async Task<(byte[] Bytes, string ContentType, string FileName)?> DownloadFileAsync(int id)
    {
        var image = await _dbContext.Images.FirstOrDefaultAsync(i => i.Id == id);
        if (image == null) return null;

        var path = Path.Combine(ImagesFolder, image.StoredFileName);
        if (!File.Exists(path))
        {
            _logger.LogWarning("Image {ImageId} exists in DB but file is missing on disk", id);
            return null;
        }

        var bytes = await File.ReadAllBytesAsync(path);
        var contentType = image.FileExtension.Equals(".png", StringComparison.OrdinalIgnoreCase)
            ? "image/png"
            : "image/jpeg";
        return (bytes, contentType, image.FileName + image.FileExtension);
    }
    public Task<int> CountByUserAsync(Guid userId) =>
    _dbContext.Images.CountAsync(i => i.UploadedByUserId == userId);

    public async Task DeleteByFilePathAsync(string filePath, Guid userId)
    {
        var image = await _dbContext.Images
            .FirstOrDefaultAsync(i => i.FilePath == filePath && i.UploadedByUserId == userId);
        if (image == null) return; 

        var path = Path.Combine(ImagesFolder, image.StoredFileName);
        _dbContext.Images.Remove(image);
        await _dbContext.SaveChangesAsync();

        try
        {
            if (File.Exists(path)) File.Delete(path);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Không xóa được file ảnh {ImageId} trên đĩa", image.Id);
        }
    }
}
