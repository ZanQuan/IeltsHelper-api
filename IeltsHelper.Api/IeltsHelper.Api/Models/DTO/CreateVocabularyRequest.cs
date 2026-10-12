namespace IeltsHelper.Api.Models.DTO;

public class CreateVocabularyRequest
{
    public Guid? LessonLogId { get; set; }
    public string Word { get; set; } = string.Empty;
    public string Meaning { get; set; } = string.Empty;
}