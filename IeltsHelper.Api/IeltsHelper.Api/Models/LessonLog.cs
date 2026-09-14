namespace IeltsHelper.Api.Models;

public class LessonLog
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public DateTime LessonDate { get; set; }
    public string SkillFocus { get; set; } = string.Empty; // Writing, Speaking, Grammar, Vocab...
    public string Summary { get; set; } = string.Empty;
    public string? Homework { get; set; }
    public int SelfRating { get; set; } // 1-5

    public User? User { get; set; }
    public ICollection<Vocabulary> Vocabularies { get; set; } = new List<Vocabulary>();
    public ICollection<ErrorLog> ErrorLogs { get; set; } = new List<ErrorLog>();
}