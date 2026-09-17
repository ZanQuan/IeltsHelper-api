using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IeltsHelper.Api.Data;
using IeltsHelper.Api.Models;

namespace IeltsHelper.Api.Controllers;

public class CreateAssignmentRequest
{
    public Guid StudentId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Instructions { get; set; } = string.Empty;
    public string Skill { get; set; } = "General";
    public DateTime? DueDate { get; set; }
}

public class SubmitAssignmentRequest
{
    public string AnswerText { get; set; } = string.Empty;
}

public class GradeAssignmentRequest
{
    public decimal Score { get; set; }
    public string? Feedback { get; set; }
}

[Route("api/[controller]")]
public class AssignmentsController : BaseApiController
{
    private readonly AppDbContext _context;

    public AssignmentsController(AppDbContext context)
    {
        _context = context;
    }

    // Giáo viên giao bài tập cho 1 học viên đã liên kết với mình
    [HttpPost]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<ActionResult<Assignment>> Create(CreateAssignmentRequest request)
    {
        var linked = await _context.TeacherStudentLinks
            .AnyAsync(l => l.TeacherId == CurrentUserId && l.StudentId == request.StudentId);
        if (!linked)
            return BadRequest(new { error = "Học viên này chưa liên kết với bạn." });

        if (string.IsNullOrWhiteSpace(request.Title))
            return BadRequest(new { error = "Vui lòng nhập tiêu đề bài tập." });

        var assignment = new Assignment
        {
            Id = Guid.NewGuid(),
            TeacherId = CurrentUserId,
            StudentId = request.StudentId,
            Title = request.Title,
            Instructions = request.Instructions,
            Skill = string.IsNullOrWhiteSpace(request.Skill) ? "General" : request.Skill,
            DueDate = request.DueDate,
            CreatedAt = DateTime.UtcNow,
        };

        _context.Assignments.Add(assignment);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = assignment.Id }, assignment);
    }

    // Học viên xem bài tập của mình (?studentId bỏ trống) / giáo viên xem bài đã giao cho 1 học viên (?studentId=...)
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Assignment>>> GetAll([FromQuery] Guid? studentId)
    {
        var targetStudentId = await ResolveTargetUserIdAsync(_context, studentId);
        if (targetStudentId == null) return Forbid();

        var assignments = await _context.Assignments
            .Where(a => a.StudentId == targetStudentId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();

        return Ok(assignments);
    }

    // Giáo viên: danh sách bài học viên đã nộp nhưng chưa chấm, gộp từ mọi học viên
    [HttpGet("to-grade")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<ActionResult> GetToGrade()
    {
        var items = await _context.Assignments
            .Where(a => a.TeacherId == CurrentUserId && a.SubmittedAt != null && a.GradedAt == null)
            .OrderBy(a => a.SubmittedAt)
            .Select(a => new
            {
                a.Id,
                a.Title,
                a.Skill,
                a.SubmittedAt,
                a.DueDate,
                StudentId = a.StudentId,
                StudentName = a.Student!.Name,
            })
            .ToListAsync();

        return Ok(items);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Assignment>> GetById(Guid id)
    {
        var assignment = await _context.Assignments.FirstOrDefaultAsync(a => a.Id == id);
        if (assignment == null) return NotFound();

        var isOwner = assignment.StudentId == CurrentUserId || assignment.TeacherId == CurrentUserId;
        if (!isOwner && !User.IsInRole("Admin")) return Forbid();

        return Ok(assignment);
    }

    // Học viên nộp bài (có thể nộp lại nếu giáo viên chưa chấm)
    [HttpPost("{id}/submit")]
    public async Task<ActionResult<Assignment>> Submit(Guid id, SubmitAssignmentRequest request)
    {
        var assignment = await _context.Assignments
            .FirstOrDefaultAsync(a => a.Id == id && a.StudentId == CurrentUserId);
        if (assignment == null) return NotFound();

        if (assignment.GradedAt != null)
            return BadRequest(new { error = "Bài đã được chấm điểm, không thể nộp lại." });

        if (string.IsNullOrWhiteSpace(request.AnswerText))
            return BadRequest(new { error = "Vui lòng nhập nội dung bài làm." });

        assignment.AnswerText = request.AnswerText;
        assignment.SubmittedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(assignment);
    }

    // Giáo viên chấm điểm + nhận xét
    [HttpPost("{id}/grade")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<ActionResult<Assignment>> Grade(Guid id, GradeAssignmentRequest request)
    {
        var assignment = await _context.Assignments
            .FirstOrDefaultAsync(a => a.Id == id && a.TeacherId == CurrentUserId);
        if (assignment == null) return NotFound();

        if (assignment.SubmittedAt == null)
            return BadRequest(new { error = "Học viên chưa nộp bài này." });

        assignment.Score = request.Score;
        assignment.Feedback = request.Feedback;
        assignment.GradedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(assignment);
    }

    // Giáo viên xóa bài tập đã giao (vd. giao nhầm)
    [HttpDelete("{id}")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var assignment = await _context.Assignments
            .FirstOrDefaultAsync(a => a.Id == id && a.TeacherId == CurrentUserId);
        if (assignment == null) return NotFound();

        _context.Assignments.Remove(assignment);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
