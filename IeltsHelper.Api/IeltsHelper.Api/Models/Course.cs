namespace IeltsHelper.Api.Models;

public class Course
{
    public Guid Id { get; set; }
    public Guid TeacherId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string TargetBand { get; set; } = string.Empty; 
    public decimal Price { get; set; }
    public DateTime CreatedAt { get; set; }

    public User? Teacher { get; set; }
    public ICollection<CourseLesson> Lessons { get; set; } = new List<CourseLesson>();
}