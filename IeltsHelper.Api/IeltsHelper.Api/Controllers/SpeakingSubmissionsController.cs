using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IeltsHelper.Api.Data;
using IeltsHelper.Api.Models;
using IeltsHelper.Api.Services;

namespace IeltsHelper.Api.Controllers;

public class SpeakingSubmitRequest
{
    public string PartType { get; set; } = string.Empty;
    public string Prompt { get; set; } = string.Empty;
    public IFormFile AudioFile { get; set; } = null!;
}

[Route("api/[controller]")]
public class SpeakingSubmissionsController : BaseApiController
{
    private readonly AppDbContext _context;
    private readonly SpeechToTextService _speechToTextService;
    private readonly AiGradingService _gradingService;

    public SpeakingSubmissionsController(
        AppDbContext context,
        SpeechToTextService speechToTextService,
        AiGradingService gradingService)
    {
        _context = context;
        _speechToTextService = speechToTextService;
        _gradingService = gradingService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SpeakingSubmission>>> GetAll([FromQuery] Guid? studentId)
    {
        var targetUserId = await ResolveTargetUserIdAsync(_context, studentId);
        if (targetUserId == null) return Forbid();

        var submissions = await _context.SpeakingSubmissions
            .Where(s => s.UserId == targetUserId)
            .OrderByDescending(s => s.SubmittedAt)
            .ToListAsync();
        return Ok(submissions);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SpeakingSubmission>> GetById(Guid id)
    {
        var submission = await _context.SpeakingSubmissions
            .FirstOrDefaultAsync(s => s.Id == id && s.UserId == CurrentUserId);
        if (submission == null) return NotFound();
        return Ok(submission);
    }

    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<SpeakingSubmission>> Submit([FromForm] SpeakingSubmitRequest request)
    {
        string transcript;
        GradingResult result;
        try
        {
            transcript = await _speechToTextService.TranscribeAsync(request.AudioFile);
            result = await _gradingService.GradeSpeakingAsync(request.PartType, request.Prompt, transcript);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Xử lý ghi âm hoặc chấm điểm thất bại.", detail = ex.Message });
        }

        var submission = new SpeakingSubmission
        {
            Id = Guid.NewGuid(),
            UserId = CurrentUserId,
            PartType = request.PartType,
            Prompt = request.Prompt,
            Transcript = transcript,
            EstimatedBand = (decimal)result.Band,
            Feedback = result.Feedback,
            SubmittedAt = DateTime.UtcNow,
            GradedAt = DateTime.UtcNow
        };

        _context.SpeakingSubmissions.Add(submission);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = submission.Id }, submission);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var submission = await _context.SpeakingSubmissions
            .FirstOrDefaultAsync(s => s.Id == id && s.UserId == CurrentUserId);
        if (submission == null) return NotFound();

        _context.SpeakingSubmissions.Remove(submission);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}