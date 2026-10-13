using IeltsHelper.Api.Models;
using IeltsHelper.Api.Models.DTO;

namespace IeltsHelper.Api.Repositories;

public interface ICourseRepository
{
    Task<List<CourseSummaryDTO>> GetAllAsync();
    Task<Course?> GetByIdAsync(Guid id);
    Task<Course?> GetByIdWithLessonsAsync(Guid id);
    Task<bool> IsEnrolledAsync(Guid courseId, Guid studentId);
    Task<Course> AddAsync(Course course);
    Task<CourseLesson> AddLessonAsync(Guid courseId, string title, string content, string? videoUrl);
    Task<CourseLesson?> GetLessonWithCourseAsync(Guid courseId, Guid lessonId);
    Task<bool> UpdateExercisesAsync(Guid lessonId, string exercisesJson);
    Task<bool> DeleteAsync(Guid id);
    Task<PagedResult<CourseSummaryDTO>> GetPagedAsync(
    string? filterOn, string? filterQuery,
    string? sortBy, bool isAscending, int pageNumber, int pageSize);
    Task<PagedResult<CourseSummaryDTO>> GetPagedAsync(
    string? filterOn, string? filterQuery, Guid? teacherId,
    string? sortBy, bool isAscending, int pageNumber, int pageSize);
}