using System.Net.Http.Json;
using System.Text.Json;

namespace IeltsHelper.Api.Services;

public class GradingResult
{
    public double Band { get; set; }
    public string Feedback { get; set; } = string.Empty;
}

public class AiGradingService
{
    private readonly HttpClient _httpClient;

    public AiGradingService(IHttpClientFactory httpClientFactory)
    {
        _httpClient = httpClientFactory.CreateClient("Anthropic");
    }

    public async Task<GradingResult> GradeEssayAsync(string taskType, string prompt, string essayText)
    {
        var requestBody = new
        {
            model = "claude-sonnet-5",
            max_tokens = 1024,
            system = "Bạn là giám khảo chấm thi IELTS Writing. Chấm bài luận sau theo 4 tiêu chí chính thức: Task Achievement/Response, Coherence and Cohesion, Lexical Resource, Grammatical Range and Accuracy. CHỈ trả lời bằng JSON hợp lệ, không thêm markdown hay chữ nào khác, đúng format: {\"band\": <số từ 0-9, có thể lẻ 0.5>, \"feedback\": \"<nhận xét chi tiết bằng tiếng Việt, 150-250 từ, nêu điểm mạnh và góp ý cụ thể cần cải thiện>\"}",
            messages = new[]
            {
                new { role = "user", content = $"Dạng bài: {taskType}\nĐề bài: {prompt}\n\nBài làm:\n{essayText}" }
            }
        };

        var response = await _httpClient.PostAsJsonAsync("v1/messages", requestBody);
        var responseBody = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            throw new Exception($"Anthropic API trả về lỗi {(int)response.StatusCode}: {responseBody}");
        }

        using var responseDoc = JsonDocument.Parse(responseBody);
        var text = responseDoc!.RootElement
            .GetProperty("content")[0]
            .GetProperty("text")
            .GetString() ?? "{}";

        return JsonSerializer.Deserialize<GradingResult>(text, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        }) ?? new GradingResult { Band = 0, Feedback = "Không thể chấm bài, thử lại sau." };
    }
    public async Task<GradingResult> GradeSpeakingAsync(string partType, string prompt, string transcript)
    {
        var requestBody = new
        {
            model = "claude-sonnet-5",
            max_tokens = 1024,
            system = "Bạn là giám khảo chấm thi IELTS Speaking. Bạn nhận được bản chuyển văn bản (transcript) từ audio câu trả lời của thí sinh. Chấm theo 4 tiêu chí: Fluency and Coherence, Lexical Resource, Grammatical Range and Accuracy, và Pronunciation (chỉ ước lượng gián tiếp qua cách diễn đạt vì không có audio thật, nêu rõ giới hạn này trong feedback). CHỈ trả lời bằng JSON hợp lệ, không thêm chữ nào khác, đúng format: {\"band\": <số từ 0-9, có thể lẻ 0.5>, \"feedback\": \"<nhận xét chi tiết bằng tiếng Việt, 150-250 từ>\"}",
            messages = new[]
            {
            new { role = "user", content = $"Phần thi: {partType}\nCâu hỏi: {prompt}\n\nTranscript câu trả lời:\n{transcript}" }
        }
        };

        var response = await _httpClient.PostAsJsonAsync("v1/messages", requestBody);
        var responseBody = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            throw new Exception($"Anthropic API trả về lỗi {(int)response.StatusCode}: {responseBody}");
        }

        using var responseDoc = JsonDocument.Parse(responseBody);
        var text = responseDoc.RootElement.GetProperty("content")[0].GetProperty("text").GetString() ?? "{}";

        return JsonSerializer.Deserialize<GradingResult>(text, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        }) ?? new GradingResult { Band = 0, Feedback = "Không thể chấm bài, thử lại sau." };
    }
}