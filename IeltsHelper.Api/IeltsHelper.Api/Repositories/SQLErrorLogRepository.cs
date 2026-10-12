using Microsoft.EntityFrameworkCore;
using IeltsHelper.Api.Data;
using IeltsHelper.Api.Models;
using IeltsHelper.Api.Models.DTO;

namespace IeltsHelper.Api.Repositories;

public class SQLErrorLogRepository : IErrorLogRepository
{
    private readonly AppDbContext _context;

    public SQLErrorLogRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<ErrorLog>> GetAllByUserAsync(Guid userId)
    {
        return await _context.ErrorLogs
            .AsNoTracking()
            .Where(e => e.UserId == userId)
            .ToListAsync();
    }

    public async Task<ErrorLog?> GetByIdAsync(Guid id, Guid userId)
    {
        return await _context.ErrorLogs
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == id && e.UserId == userId);
    }

    public async Task<ErrorLog> AddAsync(ErrorLog errorLog)
    {
        _context.ErrorLogs.Add(errorLog);
        await _context.SaveChangesAsync();
        return errorLog;
    }

    public async Task<bool> UpdateAsync(Guid id, Guid userId, ErrorLogRequest request)
    {
        var error = await _context.ErrorLogs
            .FirstOrDefaultAsync(e => e.Id == id && e.UserId == userId);
        if (error == null) return false;

        error.ErrorType = request.ErrorType;
        error.Description = request.Description;
        error.LessonLogId = request.LessonLogId;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(Guid id, Guid userId)
    {
        var error = await _context.ErrorLogs
            .FirstOrDefaultAsync(e => e.Id == id && e.UserId == userId);
        if (error == null) return false;

        _context.ErrorLogs.Remove(error);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<ErrorTypeStatDTO>> GetStatsByUserAsync(Guid userId)
    {
        return await _context.ErrorLogs
            .AsNoTracking()
            .Where(e => e.UserId == userId)
            .GroupBy(e => e.ErrorType)
            .Select(g => new ErrorTypeStatDTO { ErrorType = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .ToListAsync();
    }
}