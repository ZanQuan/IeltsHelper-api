namespace IeltsHelper.Api.Models;

public class WritingSubmission
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid? LessonLogId { get; set; }
    public string TaskType { get; set; } = string.Empty; // "Task 1" hoặc "Task 2"
    public string Prompt { get; set; } = string.Empty;
    public string EssayText { get; set; } = string.Empty;
    public DateTime SubmittedAt { get; set; }
    public decimal? EstimatedBand { get; set; }
    public string? Feedback { get; set; }
    public DateTime? GradedAt { get; set; }

    public User? User { get; set; }
    public LessonLog? LessonLog { get; set; }
}