namespace IeltsHelper.Api.Models;

public class Enrollment
{
    public Guid Id { get; set; }
    public Guid CourseId { get; set; }
    public Guid StudentId { get; set; }
    public DateTime EnrolledAt { get; set; }
    public string CompletedLessonIdsJson { get; set; } = "[]";

    public Course? Course { get; set; }
    public User? Student { get; set; }
}