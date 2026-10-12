using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IeltsHelper.Api.Data;
using IeltsHelper.Api.Models;
using IeltsHelper.Api.Models.DTO;
using IeltsHelper.Api.Repositories;

namespace IeltsHelper.Api.Controllers;

[Route("api/[controller]")]
public class VocabulariesController : BaseApiController
{
    private readonly AppDbContext _context;
    private readonly IVocabularyRepository _vocabularyRepository;

    public VocabulariesController(AppDbContext context, IVocabularyRepository vocabularyRepository)
    {
        _context = context;
        _vocabularyRepository = vocabularyRepository;
    }

   
    [HttpGet]
    public async Task<ActionResult<PagedResult<Vocabulary>>> GetAll( [FromQuery] Guid? studentId,
        [FromQuery] string? filterOn,
        [FromQuery] string? filterQuery,
        [FromQuery] string? sortBy,
        [FromQuery] bool isAscending = true,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10)
    {
        var targetUserId = await ResolveTargetUserIdAsync(_context, studentId);
        if (targetUserId == null) return Forbid();

        pageNumber = Math.Max(pageNumber, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);   

        var result = await _vocabularyRepository.GetPagedByUserAsync(
            targetUserId.Value, filterOn, filterQuery, sortBy, isAscending, pageNumber, pageSize);

        return Ok(result);
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
    public async Task<ActionResult<Vocabulary>> Create(CreateVocabularyRequest input)
    {
        var vocab = new Vocabulary
        {
            Id = Guid.NewGuid(),
            UserId = CurrentUserId,
            LessonLogId = input.LessonLogId,
            Word = input.Word.Trim(),
            Meaning = input.Meaning.Trim(),
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