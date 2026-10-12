namespace IeltsHelper.Api.Models.DTO;

public class CourseSummaryDTO
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string TargetBand { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string TeacherName { get; set; } = string.Empty;
    public int LessonCount { get; set; }
    public Guid TeacherId { get; set; }
}