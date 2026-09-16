using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IeltsHelper.Api.Data;
using IeltsHelper.Api.Models;
using IeltsHelper.Api.Services;

namespace IeltsHelper.Api.Controllers;

[Route("api/[controller]")]
public class LessonLogsController : BaseApiController
{
    private readonly AppDbContext _context;
    private readonly LessonLogWordExportService _wordExportService;

    public LessonLogsController(AppDbContext context, LessonLogWordExportService wordExportService)
    {
        _context = context;
        _wordExportService = wordExportService;
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
            SelfRating = input.SelfRating,
            NewVocabulary = input.NewVocabulary,
            GrammarNotes = input.GrammarNotes,
            OtherNotes = input.OtherNotes
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
        log.NewVocabulary = input.NewVocabulary;
        log.GrammarNotes = input.GrammarNotes;
        log.OtherNotes = input.OtherNotes;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("export-word")]
    public async Task<IActionResult> ExportWord([FromQuery] Guid? studentId)
    {
        var targetUserId = await ResolveTargetUserIdAsync(_context, studentId);
        if (targetUserId == null) return Forbid();

        var logs = await _context.LessonLogs
            .Where(l => l.UserId == targetUserId)
            .OrderByDescending(l => l.LessonDate)
            .ToListAsync();

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == targetUserId);
        var bytes = _wordExportService.ExportLessonLogs(logs, user?.Name);

        var fileName = $"NhatKyBuoiHoc_{DateTime.Now:yyyyMMdd}.docx";
        return File(bytes,
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            fileName);
    }

    [HttpGet("{id}/export-word")]
    public async Task<IActionResult> ExportSingleWord(Guid id)
    {
        var log = await _context.LessonLogs
            .FirstOrDefaultAsync(l => l.Id == id && l.UserId == CurrentUserId);
        if (log == null) return NotFound();

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == log.UserId);
        var bytes = _wordExportService.ExportLessonLogs(new List<LessonLog> { log }, user?.Name);

        var fileName = $"BuoiHoc_{log.LessonDate:yyyyMMdd}.docx";
        return File(bytes,
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            fileName);
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