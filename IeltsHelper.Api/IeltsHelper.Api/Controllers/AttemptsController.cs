using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using IeltsHelper.Api.Data;
using IeltsHelper.Api.Models;

namespace IeltsHelper.Api.Controllers;

public class StartAttemptRequest
{
    public Guid TestId { get; set; }
}

[Route("api/[controller]")]
public class AttemptsController : BaseApiController
{
    // Dung sai cho độ trễ mạng khi client tự động nộp lúc đồng hồ về 0
    private static readonly TimeSpan SubmitGrace = TimeSpan.FromMinutes(1);

    private readonly AppDbContext _context;

    public AttemptsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Attempt>>> GetAll([FromQuery] Guid? studentId)
    {
        var targetUserId = await ResolveTargetUserIdAsync(_context, studentId);
        if (targetUserId == null) return Forbid();

        var attempts = await _context.Attempts
            .AsNoTracking()
            .Where(a => a.UserId == targetUserId)
            .OrderByDescending(a => a.StartedAt)
            .ToListAsync();
        return Ok(attempts);
    }

    [HttpPost("start")]
    public async Task<ActionResult> StartAttempt(StartAttemptRequest request)
    {
        var test = await _context.Tests
            .AsNoTracking()
            .Include(t => t.Questions)
            .FirstOrDefaultAsync(t => t.Id == request.TestId);
        if (test == null) return NotFound();

        var attempt = new Attempt
        {
            Id = Guid.NewGuid(),
            TestId = test.Id,
            UserId = CurrentUserId,
            StartedAt = DateTime.UtcNow,
            TotalQuestions = test.Questions.Count
        };
        _context.Attempts.Add(attempt);
        await _context.SaveChangesAsync();

        // Không trả CorrectAnswer cho học viên
        var questionsForClient = test.Questions.Select(q => new
        {
            q.Id,
            q.QuestionText,
            q.OptionsJson
        });

        return Ok(new
        {
            attemptId = attempt.Id,
            testTitle = test.Title,
            passageOrTranscript = test.PassageOrTranscript,
            timeLimitMinutes = test.TimeLimitMinutes,
            questions = questionsForClient
        });
    }

    [HttpPost("{id}/submit")]
    public async Task<ActionResult> SubmitAttempt(Guid id, Dictionary<Guid, string> answers)
    {
        var attempt = await _context.Attempts
            .Include(a => a.Test).ThenInclude(t => t!.Questions)
            .FirstOrDefaultAsync(a => a.Id == id && a.UserId == CurrentUserId);
        if (attempt == null) return NotFound();

        if (attempt.SubmittedAt != null)
            return BadRequest(new { error = "Bài thi này đã được nộp." });

        var now = DateTime.UtcNow;
        var deadline = attempt.StartedAt.AddMinutes(attempt.Test!.TimeLimitMinutes) + SubmitGrace;
        if (now > deadline)
            return BadRequest(new { error = "Đã hết thời gian làm bài." });

        var score = attempt.Test.Questions.Count(q =>
            answers.TryGetValue(q.Id, out var userAnswer) &&
            string.Equals(userAnswer.Trim(), q.CorrectAnswer.Trim(), StringComparison.OrdinalIgnoreCase));

        attempt.AnswersJson = JsonSerializer.Serialize(answers);
        attempt.Score = score;
        attempt.SubmittedAt = now;
        await _context.SaveChangesAsync();

        var elapsedMinutes = (now - attempt.StartedAt).TotalMinutes;

        return Ok(new
        {
            score,
            total = attempt.TotalQuestions,
            elapsedMinutes = Math.Round(elapsedMinutes, 1)
        });
    }
}