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
            .Where(a => a.UserId == targetUserId)
            .OrderByDescending(a => a.StartedAt)
            .ToListAsync();
        return Ok(attempts);
    }

    [HttpPost("start")]
    public async Task<ActionResult> StartAttempt(StartAttemptRequest request)
    {
        var test = await _context.Tests.Include(t => t.Questions).FirstOrDefaultAsync(t => t.Id == request.TestId);
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
            .FirstOrDefaultAsync(a => a.Id == id && a.UserId == CurrentUserId);
        if (attempt == null) return NotFound();

        var questions = await _context.Questions.Where(q => q.TestId == attempt.TestId).ToListAsync();

        int score = 0;
        foreach (var q in questions)
        {
            if (answers.TryGetValue(q.Id, out var userAnswer) &&
                string.Equals(userAnswer.Trim(), q.CorrectAnswer.Trim(), StringComparison.OrdinalIgnoreCase))
            {
                score++;
            }
        }

        attempt.AnswersJson = JsonSerializer.Serialize(answers);
        attempt.Score = score;
        attempt.SubmittedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        var elapsedMinutes = (attempt.SubmittedAt.Value - attempt.StartedAt).TotalMinutes;

        return Ok(new
        {
            score,
            total = attempt.TotalQuestions,
            elapsedMinutes = Math.Round(elapsedMinutes, 1)
        });
    }
}