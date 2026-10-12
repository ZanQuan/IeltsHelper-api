using Microsoft.AspNetCore.Mvc;
using IeltsHelper.Api.Data;
using IeltsHelper.Api.Models;
using IeltsHelper.Api.Models.DTO;
using IeltsHelper.Api.Repositories;

namespace IeltsHelper.Api.Controllers;

[Route("api/[controller]")]
public class VocabulariesController : BaseApiController
{
    // Chỉ dùng cho ResolveTargetUserIdAsync (kiểm tra quan hệ giáo viên - học viên)
    private readonly AppDbContext _context;
    private readonly IVocabularyRepository _vocabularyRepository;

    public VocabulariesController(AppDbContext context, IVocabularyRepository vocabularyRepository)
    {
        _context = context;
        _vocabularyRepository = vocabularyRepository;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Vocabulary>>> GetAll([FromQuery] Guid? studentId)
    {
        var targetUserId = await ResolveTargetUserIdAsync(_context, studentId);
        if (targetUserId == null) return Forbid();

        var words = await _vocabularyRepository.GetAllByUserAsync(targetUserId.Value);
        return Ok(words);
    }

    [HttpGet("due")]
    public async Task<ActionResult<IEnumerable<Vocabulary>>> GetDue()
    {
        var dueWords = await _vocabularyRepository.GetDueByUserAsync(CurrentUserId);
        return Ok(dueWords);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Vocabulary>> GetById(Guid id)
    {
        var vocab = await _vocabularyRepository.GetByIdAsync(id, CurrentUserId);
        if (vocab == null) return NotFound();
        return Ok(vocab);
    }

    [HttpPost]
    public async Task<ActionResult<Vocabulary>> Create(CreateVocabularyRequest request)
    {
        var vocab = new Vocabulary
        {
            Id = Guid.NewGuid(),
            UserId = CurrentUserId,
            LessonLogId = request.LessonLogId,
            Word = request.Word,
            Meaning = request.Meaning,
            SrsLevel = 0,
            IntervalDays = 0,
            NextReviewDate = DateTime.Today
        };

        await _vocabularyRepository.AddAsync(vocab);
        return CreatedAtAction(nameof(GetById), new { id = vocab.Id }, vocab);
    }

    [HttpPost("{id}/review")]
    public async Task<ActionResult<Vocabulary>> Review(Guid id, [FromBody] ReviewRequest request)
    {
        var vocab = await _vocabularyRepository.ReviewAsync(id, CurrentUserId, request.Remembered);
        if (vocab == null) return NotFound();
        return Ok(vocab);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var deleted = await _vocabularyRepository.DeleteAsync(id, CurrentUserId);
        if (!deleted) return NotFound();
        return NoContent();
    }
}

public class ReviewRequest
{
    public bool Remembered { get; set; }
}