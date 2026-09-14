using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IeltsHelper.Api.Data;
using IeltsHelper.Api.Models;
using IeltsHelper.Api.Services;

namespace IeltsHelper.Api.Controllers;

[Route("api/[controller]")]
public class WritingSubmissionsController : BaseApiController
{
    private readonly AppDbContext _context;
    private readonly AiGradingService _gradingService;

    public WritingSubmissionsController(AppDbContext context, AiGradingService gradingService)
    {
        _context = context;
        _gradingService = gradingService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<WritingSubmission>>> GetAll([FromQuery] Guid? studentId)
    {
        var targetUserId = await ResolveTargetUserIdAsync(_context, studentId);
        if (targetUserId == null) return Forbid();

        var submissions = await _context.WritingSubmissions
            .Where(w => w.UserId == targetUserId)
            .OrderByDescending(w => w.SubmittedAt)
            .ToListAsync();
        return Ok(submissions);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<WritingSubmission>> GetById(Guid id)
    {
        var submission = await _context.WritingSubmissions
            .FirstOrDefaultAsync(w => w.Id == id && w.UserId == CurrentUserId);
        if (submission == null) return NotFound();
        return Ok(submission);
    }

    [HttpPost]
    public async Task<ActionResult<WritingSubmission>> Submit(WritingSubmission input)
    {
        GradingResult result;
        try
        {
            result = await _gradingService.GradeEssayAsync(input.TaskType, input.Prompt, input.EssayText);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Chấm bài thất bại, kiểm tra lại API key hoặc thử lại sau.", detail = ex.Message });
        }

        var submission = new WritingSubmission
        {
            Id = Guid.NewGuid(),
            UserId = CurrentUserId,
            LessonLogId = input.LessonLogId,
            TaskType = input.TaskType,
            Prompt = input.Prompt,
            EssayText = input.EssayText,
            SubmittedAt = DateTime.UtcNow,
            EstimatedBand = (decimal)result.Band,
            Feedback = result.Feedback,
            GradedAt = DateTime.UtcNow
        };

        _context.WritingSubmissions.Add(submission);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = submission.Id }, submission);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var submission = await _context.WritingSubmissions
            .FirstOrDefaultAsync(w => w.Id == id && w.UserId == CurrentUserId);
        if (submission == null) return NotFound();

        _context.WritingSubmissions.Remove(submission);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}