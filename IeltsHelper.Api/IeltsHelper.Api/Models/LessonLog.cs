namespace IeltsHelper.Api.Models;

public class LessonLog
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public DateTime LessonDate { get; set; }
    public string SkillFocus { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string? Homework { get; set; }
    public int SelfRating { get; set; }

    // Ghi chú chi tiết nội dung đã học
    public string? NewVocabulary { get; set; }
    public string? GrammarNotes { get; set; }
    public string? OtherNotes { get; set; }

    public User? User { get; set; }
    public ICollection<Vocabulary> Vocabularies { get; set; } = new List<Vocabulary>();
    public ICollection<ErrorLog> ErrorLogs { get; set; } = new List<ErrorLog>();
}