using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IeltsHelper.Api.Data;
using IeltsHelper.Api.Models;

namespace IeltsHelper.Api.Controllers;

public class AddTeacherRequest
{
    public string TeacherEmail { get; set; } = string.Empty;
}

[Route("api/[controller]")]
public class TeacherLinksController : BaseApiController
{
    private readonly AppDbContext _context;

    public TeacherLinksController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost("add-teacher")]
    public async Task<ActionResult> AddTeacher(AddTeacherRequest request)
    {
        var teacher = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.TeacherEmail);
        if (teacher == null || teacher.Role != "Teacher")
            return BadRequest(new { error = "Không tìm thấy giáo viên với email này." });

        var alreadyLinked = await _context.TeacherStudentLinks
            .AnyAsync(l => l.TeacherId == teacher.Id && l.StudentId == CurrentUserId);
        if (alreadyLinked)
            return BadRequest(new { error = "Đã liên kết với giáo viên này rồi." });

        var link = new TeacherStudentLink
        {
            Id = Guid.NewGuid(),
            TeacherId = teacher.Id,
            StudentId = CurrentUserId,
            CreatedAt = DateTime.UtcNow
        };

        _context.TeacherStudentLinks.Add(link);
        await _context.SaveChangesAsync();

        return Ok(new { message = $"Đã liên kết với giáo viên {teacher.Name}." });
    }

    [HttpGet("my-students")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<ActionResult> GetMyStudents()
    {
        var students = await _context.TeacherStudentLinks
            .Where(l => l.TeacherId == CurrentUserId)
            .Select(l => new { l.Student!.Id, l.Student.Name, l.Student.Email })
            .ToListAsync();

        return Ok(students);
    }

    [HttpGet("teachers")]
    public async Task<ActionResult> GetTeachers()
    {
        var linkedIds = await _context.TeacherStudentLinks
            .Where(l => l.StudentId == CurrentUserId)
            .Select(l => l.TeacherId)
            .ToListAsync();

        var teachers = await _context.Users
            .Where(u => u.Role == "Teacher")
            .Select(u => new
            {
                u.Id,
                u.Name,
                u.Bio,
                CourseCount = _context.Courses.Count(c => c.TeacherId == u.Id)
            })
            .ToListAsync();

        return Ok(teachers.Select(t => new
        {
            t.Id,
            t.Name,
            t.Bio,
            t.CourseCount,
            IsLinked = linkedIds.Contains(t.Id)
        }));
    }
}