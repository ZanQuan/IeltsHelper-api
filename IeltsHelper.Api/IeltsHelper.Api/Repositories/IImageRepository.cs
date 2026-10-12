using IeltsHelper.Api.Models;

namespace IeltsHelper.Api.Repositories;

public interface IImageRepository
{
    Task<Image> UploadAsync(Image image, Guid userId);

    // userId = null: lấy tất cả (dùng cho Admin)
    Task<List<Image>> GetAllInfoImagesAsync(Guid? userId);

    Task<(byte[] Bytes, string ContentType, string FileName)?> DownloadFileAsync(int id);
    Task<int> CountByUserAsync(Guid userId);
    Task DeleteByFilePathAsync(string filePath, Guid userId);
}
