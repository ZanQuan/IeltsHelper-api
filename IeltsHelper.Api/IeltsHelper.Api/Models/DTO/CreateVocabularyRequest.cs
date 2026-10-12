using System.ComponentModel.DataAnnotations;

namespace IeltsHelper.Api.Models.DTO;

public class CreateVocabularyRequest
{
    public Guid? LessonLogId { get; set; }

    [Required(ErrorMessage = "Vui lòng nhập từ vựng.")]
    [StringLength(100, ErrorMessage = "Từ vựng tối đa 100 ký tự.")]
    public string Word { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng nhập nghĩa.")]
    [StringLength(500, ErrorMessage = "Nghĩa tối đa 500 ký tự.")]
    public string Meaning { get; set; } = string.Empty;
}