using IeltsHelper.Api.Models;

namespace IeltsHelper.Api.Repositories;

public interface IVocabularyRepository
{
    Task<List<Vocabulary>> GetAllByUserAsync(Guid userId);
    Task<List<Vocabulary>> GetDueByUserAsync(Guid userId);
    Task<Vocabulary?> GetByIdAsync(Guid id, Guid userId);
    Task<Vocabulary> AddAsync(Vocabulary vocabulary);
    Task<Vocabulary?> ReviewAsync(Guid id, Guid userId, bool remembered);
    Task<bool> DeleteAsync(Guid id, Guid userId);
}