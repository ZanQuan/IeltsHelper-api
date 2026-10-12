using Microsoft.EntityFrameworkCore;
using IeltsHelper.Api.Data;
using IeltsHelper.Api.Models;

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
}