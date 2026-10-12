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

<<<<<<< HEAD
        var words = await _vocabularyRepository.GetAllByUserAsync(targetUserId.Value);
        return Ok(words);
=======
        pageNumber = Math.Max(pageNumber, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);   

        var result = await _vocabularyRepository.GetPagedByUserAsync(
            targetUserId.Value, filterOn, filterQuery, sortBy, isAscending, pageNumber, pageSize);

        return Ok(result);
>>>>>>> 47f402e5ab6858e619ec0148e95ecc9d50db06d8
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
<<<<<<< HEAD
    public async Task<ActionResult<Vocabulary>> Create(CreateVocabularyRequest request)
=======
    public async Task<ActionResult<Vocabulary>> Create(CreateVocabularyRequest input)
>>>>>>> 47f402e5ab6858e619ec0148e95ecc9d50db06d8
    {
        var vocab = new Vocabulary
        {
            Id = Guid.NewGuid(),
            UserId = CurrentUserId,
<<<<<<< HEAD
            LessonLogId = request.LessonLogId,
            Word = request.Word,
            Meaning = request.Meaning,
=======
            LessonLogId = input.LessonLogId,
            Word = input.Word.Trim(),
            Meaning = input.Meaning.Trim(),
>>>>>>> 47f402e5ab6858e619ec0148e95ecc9d50db06d8
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