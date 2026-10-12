using IeltsHelper.Api.Data;
using IeltsHelper.Api.Models;
using IeltsHelper.Api.Models.DTO;
using Microsoft.EntityFrameworkCore;

namespace IeltsHelper.Api.Repositories;

public class SQLVocabularyRepository : IVocabularyRepository
{
    private readonly AppDbContext _context;

    public SQLVocabularyRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<Vocabulary>> GetAllByUserAsync(Guid userId)
    {
        return await _context.Vocabularies
            .AsNoTracking()
            .Where(v => v.UserId == userId)
            .OrderBy(v => v.Word)
            .ToListAsync();
    }

    public async Task<List<Vocabulary>> GetDueByUserAsync(Guid userId)
    {
        var today = DateTime.Today;
        return await _context.Vocabularies
            .AsNoTracking()
            .Where(v => v.UserId == userId &&
                        (v.NextReviewDate == null || v.NextReviewDate <= today))
            .ToListAsync();
    }

    public async Task<Vocabulary?> GetByIdAsync(Guid id, Guid userId)
    {
        return await _context.Vocabularies
            .AsNoTracking()
            .FirstOrDefaultAsync(v => v.Id == id && v.UserId == userId);
    }

    public async Task<Vocabulary> AddAsync(Vocabulary vocabulary)
    {
        _context.Vocabularies.Add(vocabulary);
        await _context.SaveChangesAsync();
        return vocabulary;
    }

    public async Task<Vocabulary?> ReviewAsync(Guid id, Guid userId, bool remembered)
    {
        var vocab = await _context.Vocabularies
            .FirstOrDefaultAsync(v => v.Id == id && v.UserId == userId);
        if (vocab == null) return null;

        if (remembered)
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
        return vocab;
    }

    public async Task<bool> DeleteAsync(Guid id, Guid userId)
    {
        var vocab = await _context.Vocabularies
            .FirstOrDefaultAsync(v => v.Id == id && v.UserId == userId);
        if (vocab == null) return false;

        _context.Vocabularies.Remove(vocab);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<PagedResult<Vocabulary>> GetPagedByUserAsync(
    Guid userId, string? filterOn, string? filterQuery,
    string? sortBy, bool isAscending, int pageNumber, int pageSize)
    {
        var query = _context.Vocabularies
            .AsNoTracking()
            .Where(v => v.UserId == userId);

        // 1) FILTER
        if (!string.IsNullOrWhiteSpace(filterOn) && !string.IsNullOrWhiteSpace(filterQuery))
        {
            var q = filterQuery.Trim();
            if (filterOn.Equals("word", StringComparison.OrdinalIgnoreCase))
                query = query.Where(v => v.Word.Contains(q));
            else if (filterOn.Equals("meaning", StringComparison.OrdinalIgnoreCase))
                query = query.Where(v => v.Meaning.Contains(q));
        }

        // 2) SORT
        if (!string.IsNullOrWhiteSpace(sortBy))
        {
            if (sortBy.Equals("word", StringComparison.OrdinalIgnoreCase))
                query = isAscending ? query.OrderBy(v => v.Word) : query.OrderByDescending(v => v.Word);
            else if (sortBy.Equals("srsLevel", StringComparison.OrdinalIgnoreCase))
                query = isAscending ? query.OrderBy(v => v.SrsLevel) : query.OrderByDescending(v => v.SrsLevel);
            else if (sortBy.Equals("nextReviewDate", StringComparison.OrdinalIgnoreCase))
                query = isAscending ? query.OrderBy(v => v.NextReviewDate) : query.OrderByDescending(v => v.NextReviewDate);
            else
                query = query.OrderBy(v => v.Word);
        }
        else
        {
            query = query.OrderBy(v => v.Word);   
        }

        // 3) PAGINATION
        var total = await query.CountAsync();
        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<Vocabulary>
        {
            Items = items,
            TotalCount = total,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }
}