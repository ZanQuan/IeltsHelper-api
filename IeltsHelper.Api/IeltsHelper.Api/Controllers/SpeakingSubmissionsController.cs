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
    private readonly ILogger<WritingSubmissionsController> _logger;

    public SpeakingSubmissionsController(
        AppDbContext context,
        SpeechToTextService speechToTextService,
        AiGradingService gradingService,
        ILogger<WritingSubmissionsController> logger)
    {
        _context = context;
        _speechToTextService = speechToTextService;
        _gradingService = gradingService;
        _logger = logger;
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
        if (request.AudioFile == null || request.AudioFile.Length == 0)
            return BadRequest(new { error = "Thiếu file ghi âm." });
        if (request.AudioFile.Length > 10 * 1024 * 1024)
            return BadRequest(new { error = "File ghi âm tối đa 10MB." });
        if (request.Prompt?.Length > 2_000)
            return BadRequest(new { error = "Đề bài tối đa 2.000 ký tự." });
        string transcript;
        GradingResult result;
        try
        {
            transcript = await _speechToTextService.TranscribeAsync(request.AudioFile);
            result = await _gradingService.GradeSpeakingAsync(request.PartType, request.Prompt, transcript);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Xử lý Speaking thất bại cho user {UserId}", CurrentUserId);
            return StatusCode(500, new { error = "Xử lý ghi âm hoặc chấm điểm thất bại, vui lòng thử lại sau." });
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