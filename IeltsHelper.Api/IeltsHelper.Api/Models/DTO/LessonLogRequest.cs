using System.ComponentModel.DataAnnotations;

namespace IeltsHelper.Api.Models.DTO;

public class LessonLogRequest
{
    public DateTime LessonDate { get; set; }

    [Required(ErrorMessage = "Vui lòng chọn kỹ năng.")]
    [StringLength(50)]
    public string SkillFocus { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng nhập tóm tắt buổi học.")]
    [StringLength(2000, ErrorMessage = "Tóm tắt tối đa 2000 ký tự.")]
    public string Summary { get; set; } = string.Empty;

    [StringLength(2000)] public string? Homework { get; set; }

    [Range(1, 5, ErrorMessage = "Tự đánh giá phải từ 1 đến 5.")]
    public int SelfRating { get; set; }

    [StringLength(5000)] public string? NewVocabulary { get; set; }
    [StringLength(5000)] public string? GrammarNotes { get; set; }
    [StringLength(5000)] public string? OtherNotes { get; set; }
}