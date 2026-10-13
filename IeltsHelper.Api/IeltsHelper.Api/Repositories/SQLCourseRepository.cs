using Microsoft.EntityFrameworkCore;
using IeltsHelper.Api.Data;
using IeltsHelper.Api.Models;
using IeltsHelper.Api.Models.DTO;

namespace IeltsHelper.Api.Repositories;

public class SQLCourseRepository : ICourseRepository
{
    private readonly AppDbContext _context;

    public SQLCourseRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<CourseSummaryDTO>> GetAllAsync()
    {
        return await _context.Courses
            .AsNoTracking()
            .Select(c => new CourseSummaryDTO
            {
                Id = c.Id,
                Title = c.Title,
                Description = c.Description,
                TargetBand = c.TargetBand,
                Price = c.Price,
                TeacherName = c.Teacher!.Name,
                TeacherId = c.TeacherId,
                LessonCount = c.Lessons.Count
            })
            .ToListAsync();
    }

    public async Task<Course?> GetByIdAsync(Guid id)
    {
        return await _context.Courses
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<Course?> GetByIdWithLessonsAsync(Guid id)
    {
        return await _context.Courses
            .AsNoTracking()
            .Include(c => c.Lessons)
            .Include(c => c.Teacher)
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<bool> IsEnrolledAsync(Guid courseId, Guid studentId)
    {
        return await _context.Enrollments
            .AnyAsync(e => e.CourseId == courseId && e.StudentId == studentId);
    }

    public async Task<Course> AddAsync(Course course)
    {
        _context.Courses.Add(course);
        await _context.SaveChangesAsync();
        return course;
    }

    public async Task<CourseLesson> AddLessonAsync(Guid courseId, string title, string content, string? videoUrl)
    {
        var lessonCount = await _context.CourseLessons.CountAsync(l => l.CourseId == courseId);

        var lesson = new CourseLesson
        {
            Id = Guid.NewGuid(),
            CourseId = courseId,
            Title = title,
            Content = content,
            VideoUrl = videoUrl,
            OrderIndex = lessonCount + 1
        };

        _context.CourseLessons.Add(lesson);
        await _context.SaveChangesAsync();
        return lesson;
    }

    public async Task<CourseLesson?> GetLessonWithCourseAsync(Guid courseId, Guid lessonId)
    {
        return await _context.CourseLessons
            .AsNoTracking()
            .Include(l => l.Course)
            .FirstOrDefaultAsync(l => l.Id == lessonId && l.CourseId == courseId);
    }

    public async Task<bool> UpdateExercisesAsync(Guid lessonId, string exercisesJson)
    {
        var lesson = await _context.CourseLessons.FirstOrDefaultAsync(l => l.Id == lessonId);
        if (lesson == null) return false;

        lesson.ExercisesJson = exercisesJson;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var course = await _context.Courses.FirstOrDefaultAsync(c => c.Id == id);
        if (course == null) return false;

        _context.Courses.Remove(course);
        await _context.SaveChangesAsync();
        return true;
    }

    public Task<PagedResult<CourseSummaryDTO>> GetPagedAsync(
        string? filterOn, string? filterQuery,
        string? sortBy, bool isAscending, int pageNumber, int pageSize)
    {
        return GetPagedAsync(filterOn, filterQuery, null, sortBy, isAscending, pageNumber, pageSize);
    }

    public async Task<PagedResult<CourseSummaryDTO>> GetPagedAsync(
        string? filterOn, string? filterQuery, Guid? teacherId,
        string? sortBy, bool isAscending, int pageNumber, int pageSize)
    {
        var query = _context.Courses.AsNoTracking().AsQueryable();

        // TEACHER FILTER
        if (teacherId.HasValue)
            query = query.Where(c => c.TeacherId == teacherId.Value);

        // FILTER
        if (!string.IsNullOrWhiteSpace(filterOn) && !string.IsNullOrWhiteSpace(filterQuery))
        {
            var q = filterQuery.Trim();
            if (filterOn.Equals("title", StringComparison.OrdinalIgnoreCase))
                query = query.Where(c => c.Title.Contains(q));
            else if (filterOn.Equals("targetBand", StringComparison.OrdinalIgnoreCase))
                query = query.Where(c => c.TargetBand.Contains(q));
            else if (filterOn.Equals("teacher", StringComparison.OrdinalIgnoreCase))
                query = query.Where(c => c.Teacher!.Name.Contains(q));
        }

        // SORT
        query = (sortBy?.ToLowerInvariant()) switch
        {
            "title" => isAscending ? query.OrderBy(c => c.Title) : query.OrderByDescending(c => c.Title),
            "price" => isAscending ? query.OrderBy(c => c.Price) : query.OrderByDescending(c => c.Price),
            "createdat" => isAscending ? query.OrderBy(c => c.CreatedAt) : query.OrderByDescending(c => c.CreatedAt),
            _ => query.OrderByDescending(c => c.CreatedAt)
        };

        // PAGINATION
        var total = await query.CountAsync();
        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new CourseSummaryDTO
            {
                Id = c.Id,
                Title = c.Title,
                Description = c.Description,
                TargetBand = c.TargetBand,
                Price = c.Price,
                TeacherName = c.Teacher!.Name,
                TeacherId = c.TeacherId,
                LessonCount = c.Lessons.Count
            })
            .ToListAsync();

        return new PagedResult<CourseSummaryDTO>
        {
            Items = items,
            TotalCount = total,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }
}