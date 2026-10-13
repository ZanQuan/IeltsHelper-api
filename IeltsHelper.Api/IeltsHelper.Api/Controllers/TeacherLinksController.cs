using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IeltsHelper.Api.Data;
using IeltsHelper.Api.Models.DTO;

namespace IeltsHelper.Api.Controllers;

[Route("api/[controller]")]
public class TeacherLinksController : BaseApiController
{
    private readonly AppDbContext _context;

    public TeacherLinksController(AppDbContext context)
    {
        _context = context;
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

    // Danh bạ giáo viên: chỉ giáo viên đã có khóa học, có tìm kiếm theo tên và phân trang
    [HttpGet("teachers")]
    public async Task<ActionResult<PagedResult<TeacherListItemDTO>>> GetTeachers(
        [FromQuery] string? search,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10)
    {
        pageNumber = Math.Max(pageNumber, 1);
        pageSize = Math.Clamp(pageSize, 1, 50);
        var currentUserId = CurrentUserId;

        var query = _context.Users
            .AsNoTracking()
            .Where(u => u.Role == "Teacher" && _context.Courses.Any(c => c.TeacherId == u.Id));

        if (!string.IsNullOrWhiteSpace(search))
        {
            var keyword = search.Trim();
            query = query.Where(u => u.Name.Contains(keyword));
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderBy(u => u.Name)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new TeacherListItemDTO
            {
                Id = u.Id,
                Name = u.Name,
                Bio = u.Bio,
                AvatarUrl = u.AvatarUrl,
                CourseCount = _context.Courses.Count(c => c.TeacherId == u.Id),
                Bands = _context.Courses
                    .Where(c => c.TeacherId == u.Id)
                    .Select(c => c.TargetBand)
                    .Distinct()
                    .ToList(),
                IsLinked = _context.TeacherStudentLinks
                    .Any(l => l.TeacherId == u.Id && l.StudentId == currentUserId)
            })
            .ToListAsync();

        return Ok(new PagedResult<TeacherListItemDTO>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        });
    }

    // Học viên hoặc giáo viên đều có thể hủy liên kết với đối phương
    [HttpDelete("{otherUserId:guid}")]
    public async Task<IActionResult> Unlink(Guid otherUserId)
    {
        var currentUserId = CurrentUserId;
        var link = await _context.TeacherStudentLinks.FirstOrDefaultAsync(l =>
            (l.TeacherId == otherUserId && l.StudentId == currentUserId) ||
            (l.StudentId == otherUserId && l.TeacherId == currentUserId));
        if (link == null) return NotFound();

        _context.TeacherStudentLinks.Remove(link);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}