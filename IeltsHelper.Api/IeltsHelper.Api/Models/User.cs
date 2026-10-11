namespace IeltsHelper.Api.Models;

public class User
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "Student"; // Student, Teacher, Admin
    public string? PasswordResetTokenHash { get; set; }
    public DateTime? PasswordResetTokenExpiresAt { get; set; }
    public string? GoogleId { get; set; }
    public string? PhoneNumber { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public string? TargetBand { get; set; }
    public string? Bio { get; set; }
    public string? AvatarUrl { get; set; } 
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<LessonLog> LessonLogs { get; set; } = new List<LessonLog>();
    public ICollection<Vocabulary> Vocabularies { get; set; } = new List<Vocabulary>();
    public ICollection<ErrorLog> ErrorLogs { get; set; } = new List<ErrorLog>();
}