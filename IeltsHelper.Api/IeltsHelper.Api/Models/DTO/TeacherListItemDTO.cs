namespace IeltsHelper.Api.Models.DTO;

public class TeacherListItemDTO
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Bio { get; set; }
    public string? AvatarUrl { get; set; }
    public int CourseCount { get; set; }
    public List<string> Bands { get; set; } = new();
    public bool IsLinked { get; set; }
}