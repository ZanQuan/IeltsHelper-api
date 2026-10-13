using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IeltsHelper.Api.Data;

namespace IeltsHelper.Api.Controllers;

public class UpdateRoleRequest
{
    public string Role { get; set; } = string.Empty; // Student, Teacher, Admin
}

[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminController : BaseApiController
{
    private readonly AppDbContext _context;

    public AdminController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("stats")]
    public async Task<ActionResult> GetStats()
    {
        var revenue = await _context.Orders
            .Where(o => o.Status == "Paid")
            .SumAsync(o => (decimal?)o.Amount) ?? 0;

        var pendingGrading = await _context.Assignments
            .CountAsync(a => a.SubmittedAt != null && a.GradedAt == null);

        return Ok(new
        {
            totalStudents = await _context.Users.CountAsync(u => u.Role == "Student"),
            totalTeachers = await _context.Users.CountAsync(u => u.Role == "Teacher"),
            totalAdmins = await _context.Users.CountAsync(u => u.Role == "Admin"),
            totalCourses = await _context.Courses.CountAsync(),
            totalEnrollments = await _context.Enrollments.CountAsync(),
            revenue,
            pendingGrading
        });
    }

    [HttpGet("users")]
    public async Task<ActionResult> GetUsers([FromQuery] string? role)
    {
        var query = _context.Users.AsQueryable();
        if (!string.IsNullOrEmpty(role))
            query = query.Where(u => u.Role == role);

        var users = await query
            .OrderBy(u => u.Name)
            .Select(u => new { u.Id, u.Name, u.Email, u.Role })
            .ToListAsync();

        return Ok(users);
    }

    [HttpPut("users/{id}/role")]
    public async Task<IActionResult> UpdateRole(Guid id, UpdateRoleRequest input)
    {
        if (id == CurrentUserId)
            return BadRequest(new { error = "Không thể tự đổi vai trò của chính mình." });

        var validRoles = new[] { "Student", "Teacher", "Admin" };
        if (!validRoles.Contains(input.Role))
            return BadRequest(new { error = "Vai trò không hợp lệ." });

        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound();

        user.Role = input.Role;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    private async Task<bool> HasRelatedDataAsync(Guid userId) =>
    await _context.Courses.AnyAsync(c => c.TeacherId == userId)
    || await _context.Enrollments.AnyAsync(e => e.StudentId == userId)
    || await _context.Orders.AnyAsync(o => o.StudentId == userId)
    || await _context.Assignments.AnyAsync(a => a.TeacherId == userId || a.StudentId == userId)
    || await _context.TeacherStudentLinks.AnyAsync(l => l.TeacherId == userId || l.StudentId == userId)
    || await _context.LiveClasses.AnyAsync(l => l.TeacherId == userId);

    [HttpDelete("users/{id}")]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        if (id == CurrentUserId)
            return BadRequest(new { error = "Không thể tự xoá tài khoản của chính mình." });

        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound();

        if (await HasRelatedDataAsync(id))
            return Conflict(new { error = "Người dùng còn dữ liệu liên quan (khóa học, bài tập, lớp, liên kết...). Hãy gỡ dữ liệu trước khi xóa." });

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}