namespace IeltsHelper.Api.Models;

public class Question
{
    public Guid Id { get; set; }
    public Guid TestId { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public string? OptionsJson { get; set; } // vd: ["A. ...", "B. ...", "C. ...", "D. ..."]
    public string CorrectAnswer { get; set; } = string.Empty;

    public Test? Test { get; set; }
}