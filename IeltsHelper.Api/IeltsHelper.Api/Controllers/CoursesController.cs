using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using IeltsHelper.Api.Models;
using IeltsHelper.Api.Repositories;

namespace IeltsHelper.Api.Controllers;

public class CreateCourseRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string TargetBand { get; set; } = string.Empty;
    public decimal Price { get; set; }
}

public class AddLessonRequest
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? VideoUrl { get; set; }
}

public class ExerciseQuestion
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Prompt { get; set; } = string.Empty;
    public List<string> Options { get; set; } = new();
    public List<int> CorrectIndexes { get; set; } = new();
}

public class SubmitExerciseRequest
{
    // key = id câu hỏi, value = các đáp án đã chọn (vị trí bắt đầu từ 0)
    public Dictionary<string, List<int>> Answers { get; set; } = new();
}

[Route("api/[controller]")]
public class CoursesController : BaseApiController
{
    private readonly ICourseRepository _courseRepository;

    public CoursesController(ICourseRepository courseRepository)
    {
        _courseRepository = courseRepository;
    }

    private static List<ExerciseQuestion> ParseExercises(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return new List<ExerciseQuestion>();
        try
        {
            return JsonSerializer.Deserialize<List<ExerciseQuestion>>(json) ?? new List<ExerciseQuestion>();
        }
        catch
        {
            return new List<ExerciseQuestion>();
        }
    }

    [HttpGet]
    public async Task<ActionResult> GetAll()
    {
        var courses = await _courseRepository.GetAllAsync();
        return Ok(courses);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult> GetById(Guid id)
    {
        var course = await _courseRepository.GetByIdWithLessonsAsync(id);
        if (course == null) return NotFound();

        var isEnrolled = await _courseRepository.IsEnrolledAsync(id, CurrentUserId);
        var isOwner = course.TeacherId == CurrentUserId;
        var canSeeContent = isEnrolled || isOwner;

        return Ok(new
        {
            course.Id,
            course.Title,
            course.Description,
            course.TargetBand,
            course.Price,
            TeacherName = course.Teacher!.Name,
            IsEnrolled = canSeeContent,
            Lessons = course.Lessons
                .OrderBy(l => l.OrderIndex)
                .Select(l => new
                {
                    l.Id,
                    l.Title,
                    l.OrderIndex,
                    Content = canSeeContent ? l.Content : null,
                    VideoUrl = canSeeContent ? l.VideoUrl : null,
                    // Trả câu hỏi nhưng KHÔNG trả đáp án đúng
                    Exercises = (canSeeContent ? ParseExercises(l.ExercisesJson) : new List<ExerciseQuestion>())
                        .Select(q => new
                        {
                            q.Id,
                            q.Prompt,
                            q.Options,
                            Multiple = q.CorrectIndexes.Count > 1
                        })
                        .ToList()
                })
        });
    }

    [HttpPost]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<ActionResult<Course>> Create(CreateCourseRequest input)
    {
        var course = new Course
        {
            Id = Guid.NewGuid(),
            TeacherId = CurrentUserId,
            Title = input.Title,
            Description = input.Description,
            TargetBand = input.TargetBand,
            Price = input.Price,
            CreatedAt = DateTime.UtcNow
        };

        await _courseRepository.AddAsync(course);
        return CreatedAtAction(nameof(GetById), new { id = course.Id }, course);
    }

    [HttpPost("{id}/lessons")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<ActionResult> AddLesson(Guid id, AddLessonRequest input)
    {
        var course = await _courseRepository.GetByIdAsync(id);
        if (course == null) return NotFound();
        if (course.TeacherId != CurrentUserId && !User.IsInRole("Admin"))
            return Forbid();

        var lesson = await _courseRepository.AddLessonAsync(id, input.Title, input.Content, input.VideoUrl);
        return Ok(lesson);
    }

    // Giáo viên đặt (ghi đè) toàn bộ bài tập của một bài học
    [HttpPut("{id}/lessons/{lessonId}/exercises")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<ActionResult> SetExercises(Guid id, Guid lessonId, List<ExerciseQuestion> input)
    {
        var lesson = await _courseRepository.GetLessonWithCourseAsync(id, lessonId);
        if (lesson == null) return NotFound();
        if (lesson.Course!.TeacherId != CurrentUserId && !User.IsInRole("Admin"))
            return Forbid();

        foreach (var q in input)
        {
            if (string.IsNullOrWhiteSpace(q.Id)) q.Id = Guid.NewGuid().ToString();
        }

        await _courseRepository.UpdateExercisesAsync(lessonId, JsonSerializer.Serialize(input));
        return Ok(new { count = input.Count });
    }

    // Giáo viên xem bài tập hiện có (kèm đáp án đúng) để chỉnh sửa
    [HttpGet("{id}/lessons/{lessonId}/exercises")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<ActionResult> GetExercisesForTeacher(Guid id, Guid lessonId)
    {
        var lesson = await _courseRepository.GetLessonWithCourseAsync(id, lessonId);
        if (lesson == null) return NotFound();
        if (lesson.Course!.TeacherId != CurrentUserId && !User.IsInRole("Admin"))
            return Forbid();

        return Ok(ParseExercises(lesson.ExercisesJson));
    }

    // Học viên nộp bài tập, server chấm điểm
    [HttpPost("{id}/lessons/{lessonId}/submit")]
    public async Task<ActionResult> SubmitExercise(Guid id, Guid lessonId, SubmitExerciseRequest input)
    {
        var lesson = await _courseRepository.GetLessonWithCourseAsync(id, lessonId);
        if (lesson == null) return NotFound();

        var allowed = lesson.Course!.TeacherId == CurrentUserId
            || await _courseRepository.IsEnrolledAsync(id, CurrentUserId);
        if (!allowed) return Forbid();

        var questions = ParseExercises(lesson.ExercisesJson);
        var results = questions.Select(q =>
        {
            input.Answers.TryGetValue(q.Id, out var picked);
            var isCorrect = picked != null
                && picked.Distinct().OrderBy(x => x).SequenceEqual(q.CorrectIndexes.OrderBy(x => x));
            return new { QuestionId = q.Id, IsCorrect = isCorrect, q.CorrectIndexes };
        }).ToList();

        return Ok(new
        {
            Correct = results.Count(r => r.IsCorrect),
            Total = results.Count,
            Results = results
        });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var course = await _courseRepository.GetByIdAsync(id);
        if (course == null) return NotFound();
        if (course.TeacherId != CurrentUserId && !User.IsInRole("Admin"))
            return Forbid();

        await _courseRepository.DeleteAsync(id);
        return NoContent();
    }
}