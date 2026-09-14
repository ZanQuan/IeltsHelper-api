namespace IeltsHelper.Api.Models;

public class Attempt
{
    public Guid Id { get; set; }
    public Guid TestId { get; set; }
    public Guid UserId { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public string? AnswersJson { get; set; }
    public int? Score { get; set; }
    public int TotalQuestions { get; set; }

    public Test? Test { get; set; }
    public User? User { get; set; }
}