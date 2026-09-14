namespace IeltsHelper.Api.Models;

public class Vocabulary
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid? LessonLogId { get; set; }
    public string Word { get; set; } = string.Empty;
    public string Meaning { get; set; } = string.Empty;
    public int SrsLevel { get; set; } = 0;
    public int IntervalDays { get; set; } = 0;
    public DateTime? NextReviewDate { get; set; }

    public User? User { get; set; }
    public LessonLog? LessonLog { get; set; }
}