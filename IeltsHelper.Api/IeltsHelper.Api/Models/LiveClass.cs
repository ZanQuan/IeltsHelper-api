namespace IeltsHelper.Api.Models;

public class LiveClass
{
    public Guid Id { get; set; }
    public Guid CourseId { get; set; }
    public Guid TeacherId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime ScheduledAt { get; set; }          // UTC
    public int DurationMinutes { get; set; } = 60;
    public string RoomName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Course? Course { get; set; }
    public User? Teacher { get; set; }
}