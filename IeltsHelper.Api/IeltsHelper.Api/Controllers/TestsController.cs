using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using IeltsHelper.Api.Data;
using IeltsHelper.Api.Models;
using Microsoft.AspNetCore.Authorization;

namespace IeltsHelper.Api.Controllers;

public class CreateQuestionRequest
{
    public string QuestionText { get; set; } = string.Empty;
    public List<string>? Options { get; set; }
    public string CorrectAnswer { get; set; } = string.Empty;
}

public class CreateTestRequest
{
    public string Skill { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string PassageOrTranscript { get; set; } = string.Empty;
    public int TimeLimitMinutes { get; set; }
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
    public async Task<ActionResult<Test>> GetById(Guid id)
    {
        var test = await _context.Tests.Include(t => t.Questions).FirstOrDefaultAsync(t => t.Id == id);
        if (test == null) return NotFound();
        return Ok(test);
    }

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