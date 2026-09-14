using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IeltsHelper.Api.Data;
using IeltsHelper.Api.Models;

namespace IeltsHelper.Api.Controllers;

[Route("api/[controller]")]
public class ErrorLogsController : BaseApiController
{
    private readonly AppDbContext _context;

    public ErrorLogsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ErrorLog>>> GetAll([FromQuery] Guid? studentId)
    {
        var targetUserId = await ResolveTargetUserIdAsync(_context, studentId);
        if (targetUserId == null) return Forbid();

        var errors = await _context.ErrorLogs
            .Where(e => e.UserId == targetUserId)
            .ToListAsync();
        return Ok(errors);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ErrorLog>> GetById(Guid id)
    {
        var error = await _context.ErrorLogs
            .FirstOrDefaultAsync(e => e.Id == id && e.UserId == CurrentUserId);
        if (error == null) return NotFound();
        return Ok(error);
    }

    [HttpPost]
    public async Task<ActionResult<ErrorLog>> Create(ErrorLog input)
    {
        var error = new ErrorLog
        {
            Id = Guid.NewGuid(),
            UserId = CurrentUserId,
            LessonLogId = input.LessonLogId,
            ErrorType = input.ErrorType,
            Description = input.Description
        };

        _context.ErrorLogs.Add(error);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = error.Id }, error);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, ErrorLog input)
    {
        var error = await _context.ErrorLogs
            .FirstOrDefaultAsync(e => e.Id == id && e.UserId == CurrentUserId);
        if (error == null) return NotFound();

        error.ErrorType = input.ErrorType;
        error.Description = input.Description;
        error.LessonLogId = input.LessonLogId;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var error = await _context.ErrorLogs
            .FirstOrDefaultAsync(e => e.Id == id && e.UserId == CurrentUserId);
        if (error == null) return NotFound();

        _context.ErrorLogs.Remove(error);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("stats")]
    public async Task<ActionResult> GetStats()
    {
        var stats = await _context.ErrorLogs
            .Where(e => e.UserId == CurrentUserId)
            .GroupBy(e => e.ErrorType)
            .Select(g => new { ErrorType = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .ToListAsync();

        return Ok(stats);
    }
}