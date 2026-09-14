using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IeltsHelper.Api.Data;
using IeltsHelper.Api.Models;

namespace IeltsHelper.Api.Controllers;

public class CreateCourseRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string TargetBand { get; set; } = string.Empty;
    public decimal Price { get; set; }
}

public class AddLessonRequest
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? VideoUrl { get; set; }
}

[Route("api/[controller]")]
public class CoursesController : BaseApiController
{
    private readonly AppDbContext _context;

    public CoursesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult> GetAll()
    {
        var courses = await _context.Courses
            .Select(c => new
            {
                c.Id,
                c.Title,
                c.Description,
                c.TargetBand,
                c.Price,
                TeacherName = c.Teacher!.Name,
                LessonCount = c.Lessons.Count
            })
            .ToListAsync();
        return Ok(courses);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult> GetById(Guid id)
    {
        var course = await _context.Courses
            .Include(c => c.Lessons)
            .Include(c => c.Teacher)
            .FirstOrDefaultAsync(c => c.Id == id);
        if (course == null) return NotFound();

        var isEnrolled = await _context.Enrollments
            .AnyAsync(e => e.CourseId == id && e.StudentId == CurrentUserId);
        var isOwner = course.TeacherId == CurrentUserId;
        var canSeeContent = isEnrolled || isOwner;

        return Ok(new
        {
            course.Id,
            course.Title,
            course.Description,
            course.TargetBand,
            course.Price,
            TeacherName = course.Teacher!.Name,
            IsEnrolled = canSeeContent,
            Lessons = course.Lessons
                .OrderBy(l => l.OrderIndex)
                .Select(l => new
                {
                    l.Id,
                    l.Title,
                    l.OrderIndex,
                    Content = canSeeContent ? l.Content : null,
                    VideoUrl = canSeeContent ? l.VideoUrl : null
                })
        });
    }

    [HttpPost]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<ActionResult<Course>> Create(CreateCourseRequest input)
    {
        var course = new Course
        {
            Id = Guid.NewGuid(),
            TeacherId = CurrentUserId,
            Title = input.Title,
            Description = input.Description,
            TargetBand = input.TargetBand,
            Price = input.Price,
            CreatedAt = DateTime.UtcNow
        };

        _context.Courses.Add(course);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = course.Id }, course);
    }

    [HttpPost("{id}/lessons")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<ActionResult> AddLesson(Guid id, AddLessonRequest input)
    {
        var course = await _context.Courses.FindAsync(id);
        if (course == null) return NotFound();
        if (course.TeacherId != CurrentUserId && !User.IsInRole("Admin"))
            return Forbid();

        var lessonCount = await _context.CourseLessons.CountAsync(l => l.CourseId == id);

        var lesson = new CourseLesson
        {
            Id = Guid.NewGuid(),
            CourseId = id,
            Title = input.Title,
            Content = input.Content,
            VideoUrl = input.VideoUrl,
            OrderIndex = lessonCount + 1
        };

        _context.CourseLessons.Add(lesson);
        await _context.SaveChangesAsync();

        return Ok(lesson);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var course = await _context.Courses.FindAsync(id);
        if (course == null) return NotFound();
        if (course.TeacherId != CurrentUserId && !User.IsInRole("Admin"))
            return Forbid();

        _context.Courses.Remove(course);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}