using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using IeltsHelper.Api.Data;

namespace IeltsHelper.Api.Controllers;

[ApiController]
[Authorize]
public abstract class BaseApiController : ControllerBase
{
    protected Guid CurrentUserId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    protected async Task<Guid?> ResolveTargetUserIdAsync(AppDbContext context, Guid? studentId)
    {
        if (studentId == null) return CurrentUserId;

        if (User.IsInRole("Admin")) return studentId;

        if (!User.IsInRole("Teacher")) return null;

        var linked = await context.TeacherStudentLinks
            .AnyAsync(l => l.TeacherId == CurrentUserId && l.StudentId == studentId.Value);

        return linked ? studentId : null;
    }
}