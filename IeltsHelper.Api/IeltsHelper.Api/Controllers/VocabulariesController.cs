using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IeltsHelper.Api.Data;
using IeltsHelper.Api.Models;

namespace IeltsHelper.Api.Controllers;

[Route("api/[controller]")]
public class VocabulariesController : BaseApiController
{
    private readonly AppDbContext _context;

    public VocabulariesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Vocabulary>>> GetAll([FromQuery] Guid? studentId)
    {
        var targetUserId = await ResolveTargetUserIdAsync(_context, studentId);
        if (targetUserId == null) return Forbid();

        var words = await _context.Vocabularies
            .Where(v => v.UserId == targetUserId)
            .OrderBy(v => v.Word)
            .ToListAsync();
        return Ok(words);
    }

    [HttpGet("due")]
    public async Task<ActionResult<IEnumerable<Vocabulary>>> GetDue()
    {
        var today = DateTime.Today;
        var dueWords = await _context.Vocabularies
            .Where(v => v.UserId == CurrentUserId &&
                        (v.NextReviewDate == null || v.NextReviewDate <= today))
            .ToListAsync();
        return Ok(dueWords);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Vocabulary>> GetById(Guid id)
    {
        var vocab = await _context.Vocabularies
            .FirstOrDefaultAsync(v => v.Id == id && v.UserId == CurrentUserId);
        if (vocab == null) return NotFound();
        return Ok(vocab);
    }

    [HttpPost]
    public async Task<ActionResult<Vocabulary>> Create(Vocabulary input)
    {
        var vocab = new Vocabulary
        {
            Id = Guid.NewGuid(),
            UserId = CurrentUserId,
            LessonLogId = input.LessonLogId,
            Word = input.Word,
            Meaning = input.Meaning,
            SrsLevel = 0,
            IntervalDays = 0,
            NextReviewDate = DateTime.Today
        };

        _context.Vocabularies.Add(vocab);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = vocab.Id }, vocab);
    }

    [HttpPost("{id}/review")]
    public async Task<ActionResult<Vocabulary>> Review(Guid id, [FromBody] ReviewRequest request)
    {
        var vocab = await _context.Vocabularies
            .FirstOrDefaultAsync(v => v.Id == id && v.UserId == CurrentUserId);
        if (vocab == null) return NotFound();

        if (request.Remembered)
        {
            vocab.IntervalDays = vocab.SrsLevel switch
            {
                0 => 1,
                1 => 6,
                _ => vocab.IntervalDays * 2
            };
            vocab.SrsLevel += 1;
        }
        else
        {
            vocab.SrsLevel = 0;
            vocab.IntervalDays = 1;
        }

        vocab.NextReviewDate = DateTime.Today.AddDays(vocab.IntervalDays);

        await _context.SaveChangesAsync();
        return Ok(vocab);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var vocab = await _context.Vocabularies
            .FirstOrDefaultAsync(v => v.Id == id && v.UserId == CurrentUserId);
        if (vocab == null) return NotFound();

        _context.Vocabularies.Remove(vocab);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}

public class ReviewRequest
{
    public bool Remembered { get; set; }
}