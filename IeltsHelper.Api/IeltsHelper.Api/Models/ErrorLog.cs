namespace IeltsHelper.Api.Models;

public class ErrorLog
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid? LessonLogId { get; set; }
    public string ErrorType { get; set; } = string.Empty; // Tense, Article, Collocation...
    public string Description { get; set; } = string.Empty;

    public User? User { get; set; }
    public LessonLog? LessonLog { get; set; }
}