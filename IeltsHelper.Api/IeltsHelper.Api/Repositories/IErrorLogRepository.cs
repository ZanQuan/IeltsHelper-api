using IeltsHelper.Api.Models;
using IeltsHelper.Api.Models.DTO;

namespace IeltsHelper.Api.Repositories;

public interface IErrorLogRepository
{
    Task<List<ErrorLog>> GetAllByUserAsync(Guid userId);
    Task<ErrorLog?> GetByIdAsync(Guid id, Guid userId);
    Task<ErrorLog> AddAsync(ErrorLog errorLog);
    Task<bool> UpdateAsync(Guid id, Guid userId, ErrorLogRequest request);
    Task<bool> DeleteAsync(Guid id, Guid userId);
    Task<List<ErrorTypeStatDTO>> GetStatsByUserAsync(Guid userId);
}