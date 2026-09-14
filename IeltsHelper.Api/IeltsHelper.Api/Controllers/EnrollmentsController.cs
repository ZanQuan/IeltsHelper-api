using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using IeltsHelper.Api.Data;
using IeltsHelper.Api.Models;

namespace IeltsHelper.Api.Controllers;

public class EnrollRequest
{
    public Guid CourseId { get; set; }
}

[Route("api/[controller]")]
public class EnrollmentsController : BaseApiController
{
    private readonly AppDbContext _context;

    public EnrollmentsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<ActionResult> Enroll(EnrollRequest request)
    {
        var course = await _context.Courses.FindAsync(request.CourseId);
        if (course == null) return NotFound();

        var already = await _context.Enrollments
            .AnyAsync(e => e.CourseId == request.CourseId && e.StudentId == CurrentUserId);
        if (already) return BadRequest(new { error = "Bạn đã đăng ký khóa học này rồi." });

        var enrollment = new Enrollment
        {
            Id = Guid.NewGuid(),
            CourseId = request.CourseId,
            StudentId = CurrentUserId,
            EnrolledAt = DateTime.UtcNow,
            CompletedLessonIdsJson = "[]"
        };

        _context.Enrollments.Add(enrollment);
        await _context.SaveChangesAsync();

        return Ok(new { message = $"Đã đăng ký khóa học '{course.Title}'." });
    }

    [HttpGet("my-courses")]
    public async Task<ActionResult> GetMyCourses()
    {
        var enrollments = await _context.Enrollments
            .Where(e => e.StudentId == CurrentUserId)
            .Include(e => e.Course)
            .ToListAsync();

        var result = enrollments.Select(e => new
        {
            e.Id,
            CourseId = e.Course!.Id,
            CourseTitle = e.Course.Title,
            e.EnrolledAt,
            CompletedCount = JsonSerializer.Deserialize<List<Guid>>(e.CompletedLessonIdsJson)!.Count
        });

        return Ok(result);
    }

    [HttpPost("{enrollmentId}/lessons/{lessonId}/complete")]
    public async Task<ActionResult> CompleteLesson(Guid enrollmentId, Guid lessonId)
    {
        var enrollment = await _context.Enrollments
            .FirstOrDefaultAsync(e => e.Id == enrollmentId && e.StudentId == CurrentUserId);
        if (enrollment == null) return NotFound();

        var completed = JsonSerializer.Deserialize<List<Guid>>(enrollment.CompletedLessonIdsJson) ?? new List<Guid>();
        if (!completed.Contains(lessonId))
        {
            completed.Add(lessonId);
            enrollment.CompletedLessonIdsJson = JsonSerializer.Serialize(completed);
            await _context.SaveChangesAsync();
        }

        return Ok(new { completedCount = completed.Count });
    }
}