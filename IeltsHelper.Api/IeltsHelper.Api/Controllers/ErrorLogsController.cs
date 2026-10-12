using Microsoft.AspNetCore.Mvc;
using IeltsHelper.Api.Data;
using IeltsHelper.Api.Models;
using IeltsHelper.Api.Models.DTO;
using IeltsHelper.Api.Repositories;

namespace IeltsHelper.Api.Controllers;

[Route("api/[controller]")]
public class ErrorLogsController : BaseApiController
{
    // Chỉ dùng cho ResolveTargetUserIdAsync (kiểm tra quan hệ giáo viên - học viên)
    private readonly AppDbContext _context;
    private readonly IErrorLogRepository _errorLogRepository;

    public ErrorLogsController(AppDbContext context, IErrorLogRepository errorLogRepository)
    {
        _context = context;
        _errorLogRepository = errorLogRepository;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ErrorLog>>> GetAll([FromQuery] Guid? studentId)
    {
        var targetUserId = await ResolveTargetUserIdAsync(_context, studentId);
        if (targetUserId == null) return Forbid();

        var errors = await _errorLogRepository.GetAllByUserAsync(targetUserId.Value);
        return Ok(errors);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ErrorLog>> GetById(Guid id)
    {
        var error = await _errorLogRepository.GetByIdAsync(id, CurrentUserId);
        if (error == null) return NotFound();
        return Ok(error);
    }

    [HttpPost]
    public async Task<ActionResult<ErrorLog>> Create(ErrorLogRequest input)
    {
        var error = new ErrorLog
        {
            Id = Guid.NewGuid(),
            UserId = CurrentUserId,
            LessonLogId = input.LessonLogId,
            ErrorType = input.ErrorType,
            Description = input.Description
        };

        await _errorLogRepository.AddAsync(error);
        return CreatedAtAction(nameof(GetById), new { id = error.Id }, error);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, ErrorLogRequest input)
    {
        var updated = await _errorLogRepository.UpdateAsync(id, CurrentUserId, input);
        if (!updated) return NotFound();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var deleted = await _errorLogRepository.DeleteAsync(id, CurrentUserId);
        if (!deleted) return NotFound();
        return NoContent();
    }

    [HttpGet("stats")]
    public async Task<ActionResult> GetStats()
    {
        var stats = await _errorLogRepository.GetStatsByUserAsync(CurrentUserId);
        return Ok(stats);
    }
}