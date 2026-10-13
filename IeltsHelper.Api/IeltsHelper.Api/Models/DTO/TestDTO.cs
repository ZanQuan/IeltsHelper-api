namespace IeltsHelper.Api.Models.DTO;

public record QuestionDTO(Guid Id, string QuestionText, string? OptionsJson);

public record QuestionWithAnswerDTO(Guid Id, string QuestionText, string? OptionsJson, string CorrectAnswer);

public record TestDTO<TQuestion>(
    Guid Id, string Skill, string Title, string PassageOrTranscript,
    int TimeLimitMinutes, IReadOnlyList<TQuestion> Questions);
