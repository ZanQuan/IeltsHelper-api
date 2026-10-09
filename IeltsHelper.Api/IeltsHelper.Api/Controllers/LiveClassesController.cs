using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IeltsHelper.Api.Data;
using IeltsHelper.Api.Models;

namespace IeltsHelper.Api.Controllers;

public class CreateLiveClassRequest
{
    public Guid CourseId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime ScheduledAt { get; set; }
    public int DurationMinutes { get; set; } = 60;
}

[Route("api/[controller]")]
public class LiveClassesController : BaseApiController
{
    private const int EarlyJoinMinutes = 10;
    private const int LateJoinMinutes = 60;
    private readonly AppDbContext _context;

    public LiveClassesController(AppDbContext context) { _context = context; }

    private static DateTime Utc(DateTime d) => DateTime.SpecifyKind(d, DateTimeKind.Utc);

    [HttpGet("my-courses")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<ActionResult> MyCourses()
    {
        var isAdmin = User.IsInRole("Admin");
        var courses = await _context.Courses
            .Where(c => isAdmin || c.TeacherId == CurrentUserId)
            .OrderBy(c => c.Title)
            .Select(c => new { c.Id, c.Title })
            .ToListAsync();
        return Ok(courses);
    }

    [HttpPost]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<ActionResult> Create(CreateLiveClassRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Title))
            return BadRequest(new { error = "Vui lòng nhập tên lớp học." });
        if (req.DurationMinutes < 15 || req.DurationMinutes > 240)
            return BadRequest(new { error = "Thời lượng phải từ 15 đến 240 phút." });

        var scheduled = req.ScheduledAt.ToUniversalTime();
        if (scheduled < DateTime.UtcNow.AddMinutes(-1))
            return BadRequest(new { error = "Thời gian bắt đầu phải ở tương lai." });

        var course = await _context.Courses.FindAsync(req.CourseId);
        if (course == null) return NotFound(new { error = "Không tìm thấy khóa học." });
        if (course.TeacherId != CurrentUserId && !User.IsInRole("Admin")) return Forbid();

        var liveClass = new LiveClass
        {
            Id = Guid.NewGuid(),
            CourseId = course.Id,
            TeacherId = course.TeacherId,
            Title = req.Title.Trim(),
            Description = string.IsNullOrWhiteSpace(req.Description) ? null : req.Description.Trim(),
            ScheduledAt = scheduled,
            DurationMinutes = req.DurationMinutes,
            RoomName = "whale-" + Guid.NewGuid().ToString("N"),
            CreatedAt = DateTime.UtcNow
        };
        _context.LiveClasses.Add(liveClass);
        await _context.SaveChangesAsync();
        return Ok(new { liveClass.Id });
    }

    [HttpGet("mine")]
    public async Task<ActionResult> Mine()
    {
        var since = DateTime.UtcNow.AddDays(-1);
        var query = _context.LiveClasses.Where(l => l.ScheduledAt >= since);

        if (User.IsInRole("Admin")) { }
        else if (User.IsInRole("Teacher"))
            query = query.Where(l => l.TeacherId == CurrentUserId);
        else
            query = query.Where(l => _context.Enrollments
                .Any(e => e.StudentId == CurrentUserId && e.CourseId == l.CourseId));

        var rows = await query
            .OrderBy(l => l.ScheduledAt)
            .Select(l => new
            {
                l.Id,
                l.Title,
                l.Description,
                l.ScheduledAt,
                l.DurationMinutes,
                CourseId = l.CourseId,
                CourseTitle = l.Course!.Title,
                TeacherId = l.TeacherId,
                TeacherName = l.Teacher!.Name
            })
            .ToListAsync();

        var items = rows.Select(r => new
        {
            r.Id,
            r.Title,
            r.Description,
            ScheduledAt = Utc(r.ScheduledAt),
            r.DurationMinutes,
            r.CourseId,
            r.CourseTitle,
            r.TeacherId,
            r.TeacherName,
            CanManage = User.IsInRole("Admin") || r.TeacherId == CurrentUserId
        });

        return Ok(new { serverNow = DateTime.UtcNow, items });
    }

    [HttpGet("{id}/join")]
    public async Task<ActionResult> Join(Guid id)
    {
        var l = await _context.LiveClasses.Include(x => x.Teacher).FirstOrDefaultAsync(x => x.Id == id);
        if (l == null) return NotFound(new { error = "Không tìm thấy lớp học." });

        var isModerator = User.IsInRole("Admin") || l.TeacherId == CurrentUserId;
        if (!isModerator)
        {
            var enrolled = await _context.Enrollments
                .AnyAsync(e => e.StudentId == CurrentUserId && e.CourseId == l.CourseId);
            if (!enrolled) return StatusCode(403, new { error = "Bạn không thuộc lớp học này." });

            var now = DateTime.UtcNow;
            var start = Utc(l.ScheduledAt);
            if (now < start.AddMinutes(-EarlyJoinMinutes))
                return BadRequest(new { error = "Lớp học chưa đến giờ, bạn có thể vào trước 10 phút." });
            if (now > start.AddMinutes(l.DurationMinutes + LateJoinMinutes))
                return BadRequest(new { error = "Lớp học này đã kết thúc." });
        }

        return Ok(new { l.Id, l.Title, l.RoomName, TeacherName = l.Teacher!.Name, IsModerator = isModerator });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var l = await _context.LiveClasses.FindAsync(id);
        if (l == null) return NotFound();
        if (l.TeacherId != CurrentUserId && !User.IsInRole("Admin")) return Forbid();
        _context.LiveClasses.Remove(l);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}