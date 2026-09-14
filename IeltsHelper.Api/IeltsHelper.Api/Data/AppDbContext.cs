using Microsoft.EntityFrameworkCore;
using IeltsHelper.Api.Models;

namespace IeltsHelper.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<LessonLog> LessonLogs => Set<LessonLog>();
    public DbSet<Vocabulary> Vocabularies => Set<Vocabulary>();
    public DbSet<ErrorLog> ErrorLogs => Set<ErrorLog>();
    public DbSet<WritingSubmission> WritingSubmissions => Set<WritingSubmission>();
    public DbSet<SpeakingSubmission> SpeakingSubmissions => Set<SpeakingSubmission>();
    public DbSet<Test> Tests => Set<Test>();
    public DbSet<Question> Questions => Set<Question>();
    public DbSet<Attempt> Attempts => Set<Attempt>();
    public DbSet<TeacherStudentLink> TeacherStudentLinks => Set<TeacherStudentLink>();
    public DbSet<Course> Courses => Set<Course>();
    public DbSet<CourseLesson> CourseLessons => Set<CourseLesson>();
    public DbSet<Enrollment> Enrollments => Set<Enrollment>();
    public DbSet<Order> Orders => Set<Order>();
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<TeacherStudentLink>()
            .HasOne(l => l.Teacher)
            .WithMany()
            .HasForeignKey(l => l.TeacherId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<TeacherStudentLink>()
            .HasOne(l => l.Student)
            .WithMany()
            .HasForeignKey(l => l.StudentId)
            .OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<Course>()
            .HasOne(c => c.Teacher)
            .WithMany()
            .HasForeignKey(c => c.TeacherId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}