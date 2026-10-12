using System.ComponentModel.DataAnnotations;

namespace IeltsHelper.Api.Models.DTO;

public class ImageUploadRequestDTO
{
    [Required]
    public IFormFile File { get; set; } = null!;

    [Required]
    [StringLength(100)]
    public string FileName { get; set; } = string.Empty;

    [StringLength(255)]
    public string? FileDescription { get; set; }
}
