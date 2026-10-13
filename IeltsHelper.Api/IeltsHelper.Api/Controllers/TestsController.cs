using IeltsHelper.Api.Data;
using IeltsHelper.Api.Models;
using IeltsHelper.Api.Models.DTO;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Text.Json;

namespace IeltsHelper.Api.Controllers;

public class CreateQuestionRequest
{
    [Required(ErrorMessage = "Vui lòng nhập nội dung câu hỏi.")]
    [StringLength(1000)]
    public string QuestionText { get; set; } = string.Empty;

    [MinLength(2, ErrorMessage = "Mỗi câu cần ít nhất 2 đáp án.")]
    public List<string>? Options { get; set; }

    [Required(ErrorMessage = "Vui lòng chọn đáp án đúng.")]
    public string CorrectAnswer { get; set; } = string.Empty;
}

public class CreateTestRequest
{
    [AllowedValues("Listening", "Reading", ErrorMessage = "Kỹ năng không hợp lệ.")]
    public string Skill { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng nhập tên đề.")]
    [StringLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng nhập đoạn văn / transcript.")]
    public string PassageOrTranscript { get; set; } = string.Empty;

    [Range(1, 180, ErrorMessage = "Thời gian từ 1 đến 180 phút.")]
    public int TimeLimitMinutes { get; set; }

    [MinLength(1, ErrorMessage = "Đề thi cần ít nhất 1 câu hỏi.")]
    public List<CreateQuestionRequest> Questions { get; set; } = new();
}

[Route("api/[controller]")]
public class TestsController : BaseApiController
{
    private readonly AppDbContext _context;

    public TestsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Test>>> GetAll()
    {
        var tests = await _context.Tests.ToListAsync();
        return Ok(tests);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult> GetById(Guid id)
    {
        var test = await _context.Tests.AsNoTracking()
            .Include(t => t.Questions)
            .FirstOrDefaultAsync(t => t.Id == id);
        if (test == null) return NotFound();

        var canSeeAnswers = User.IsInRole("Teacher") || User.IsInRole("Admin");
        return canSeeAnswers
            ? Ok(ToDto(test, q => new QuestionWithAnswerDTO(q.Id, q.QuestionText, q.OptionsJson, q.CorrectAnswer)))
            : Ok(ToDto(test, q => new QuestionDTO(q.Id, q.QuestionText, q.OptionsJson)));
    }

    private static TestDTO<T> ToDto<T>(Test t, Func<Question, T> mapQuestion) =>
        new(t.Id, t.Skill, t.Title, t.PassageOrTranscript, t.TimeLimitMinutes,
            t.Questions.Select(mapQuestion).ToList());

    [HttpPost]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<ActionResult<Test>> Create(CreateTestRequest input)
    {
        var test = new Test
        {
            Id = Guid.NewGuid(),
            Skill = input.Skill,
            Title = input.Title,
            PassageOrTranscript = input.PassageOrTranscript,
            TimeLimitMinutes = input.TimeLimitMinutes,
            Questions = input.Questions.Select(q => new Question
            {
                Id = Guid.NewGuid(),
                QuestionText = q.QuestionText,
                OptionsJson = q.Options != null ? JsonSerializer.Serialize(q.Options) : null,
                CorrectAnswer = q.CorrectAnswer
            }).ToList()
        };

        _context.Tests.Add(test);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = test.Id }, test);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var test = await _context.Tests.FindAsync(id);
        if (test == null) return NotFound();

        _context.Tests.Remove(test);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}