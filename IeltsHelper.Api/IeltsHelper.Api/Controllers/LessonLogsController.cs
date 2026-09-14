using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IeltsHelper.Api.Data;
using IeltsHelper.Api.Models;

namespace IeltsHelper.Api.Controllers;

[Route("api/[controller]")]
public class LessonLogsController : BaseApiController
{
    private readonly AppDbContext _context;

    public LessonLogsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<LessonLog>>> GetAll([FromQuery] Guid? studentId)
    {
        var targetUserId = await ResolveTargetUserIdAsync(_context, studentId);
        if (targetUserId == null) return Forbid();

        var logs = await _context.LessonLogs
            .Where(l => l.UserId == targetUserId)
            .OrderByDescending(l => l.LessonDate)
            .ToListAsync();
        return Ok(logs);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<LessonLog>> GetById(Guid id)
    {
        var log = await _context.LessonLogs
            .FirstOrDefaultAsync(l => l.Id == id && l.UserId == CurrentUserId);
        if (log == null) return NotFound();
        return Ok(log);
    }

    [HttpPost]
    public async Task<ActionResult<LessonLog>> Create(LessonLog input)
    {
        var log = new LessonLog
        {
            Id = Guid.NewGuid(),
            UserId = CurrentUserId,
            LessonDate = input.LessonDate,
            SkillFocus = input.SkillFocus,
            Summary = input.Summary,
            Homework = input.Homework,
            SelfRating = input.SelfRating
        };

        _context.LessonLogs.Add(log);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = log.Id }, log);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, LessonLog input)
    {
        var log = await _context.LessonLogs
            .FirstOrDefaultAsync(l => l.Id == id && l.UserId == CurrentUserId);
        if (log == null) return NotFound();

        log.LessonDate = input.LessonDate;
        log.SkillFocus = input.SkillFocus;
        log.Summary = input.Summary;
        log.Homework = input.Homework;
        log.SelfRating = input.SelfRating;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var log = await _context.LessonLogs
            .FirstOrDefaultAsync(l => l.Id == id && l.UserId == CurrentUserId);
        if (log == null) return NotFound();

        _context.LessonLogs.Remove(log);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}