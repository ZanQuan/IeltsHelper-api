namespace IeltsHelper.Api.Models;

public class SpeakingSubmission
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid? LessonLogId { get; set; }
    public string PartType { get; set; } = string.Empty; // "Part 1", "Part 2", "Part 3"
    public string Prompt { get; set; } = string.Empty;
    public string? Transcript { get; set; }
    public decimal? EstimatedBand { get; set; }
    public string? Feedback { get; set; }
    public DateTime SubmittedAt { get; set; }
    public DateTime? GradedAt { get; set; }

    public User? User { get; set; }
    public LessonLog? LessonLog { get; set; }
}