namespace IeltsHelper.Api.Models;

public class CourseLesson
{
    public Guid Id { get; set; }
    public Guid CourseId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? VideoUrl { get; set; }
    public int OrderIndex { get; set; }

    public Course? Course { get; set; }
}