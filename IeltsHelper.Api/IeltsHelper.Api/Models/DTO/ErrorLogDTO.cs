namespace IeltsHelper.Api.Models.DTO;

public class ErrorLogRequest
{
    public Guid? LessonLogId { get; set; }
    public string ErrorType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

public class ErrorTypeStatDTO
{
    public string ErrorType { get; set; } = string.Empty;
    public int Count { get; set; }
}