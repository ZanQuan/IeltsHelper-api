namespace IeltsHelper.Api.Models;

public class TeacherStudentLink
{
    public Guid Id { get; set; }
    public Guid TeacherId { get; set; }
    public Guid StudentId { get; set; }
    public DateTime CreatedAt { get; set; }

    public User? Teacher { get; set; }
    public User? Student { get; set; }
}