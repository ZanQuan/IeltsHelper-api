namespace IeltsHelper.Api.Models;

public class Test
{
    public Guid Id { get; set; }
    public string Skill { get; set; } = string.Empty; // "Listening" hoặc "Reading"
    public string Title { get; set; } = string.Empty;
    public string PassageOrTranscript { get; set; } = string.Empty;
    public int TimeLimitMinutes { get; set; }

    public ICollection<Question> Questions { get; set; } = new List<Question>();
}