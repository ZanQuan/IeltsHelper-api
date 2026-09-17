namespace IeltsHelper.Api.Models;

public class Assignment
{
    public Guid Id { get; set; }
    public Guid TeacherId { get; set; }
    public Guid StudentId { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Instructions { get; set; } = string.Empty;
    public string Skill { get; set; } = "General"; // Writing, Speaking, Reading, Listening, Vocabulary, General...
    public DateTime? DueDate { get; set; }
    public DateTime CreatedAt { get; set; }

    // Học viên nộp bài
    public string? AnswerText { get; set; }
    public DateTime? SubmittedAt { get; set; }

    // Giáo viên chấm bài
    public decimal? Score { get; set; }
    public string? Feedback { get; set; }
    public DateTime? GradedAt { get; set; }

    public User? Teacher { get; set; }
    public User? Student { get; set; }
}
