using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace IeltsHelper.Api.Filters;

public class ValidateModelAttribute : ActionFilterAttribute
{
    public override void OnActionExecuting(ActionExecutingContext context)
    {
        if (context.ModelState.IsValid) return;

        var errors = context.ModelState
            .Where(e => e.Value!.Errors.Count > 0)
            .ToDictionary(
                e => e.Key,
                e => e.Value!.Errors.Select(x => x.ErrorMessage).ToArray());

        // Giữ cùng dạng { error: "..." } như các controller hiện tại,
        // thêm "errors" để biết lỗi theo từng trường.
        var firstMessage = errors.Values.First().First();
        context.Result = new BadRequestObjectResult(new { error = firstMessage, errors });
    }
}