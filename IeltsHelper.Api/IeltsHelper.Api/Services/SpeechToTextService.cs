using System.Net.Http.Headers;
using System.Text.Json;

namespace IeltsHelper.Api.Services;

public class SpeechToTextService
{
    private readonly HttpClient _httpClient;

    public SpeechToTextService(IHttpClientFactory httpClientFactory)
    {
        _httpClient = httpClientFactory.CreateClient("OpenAI");
    }

    public async Task<string> TranscribeAsync(IFormFile audioFile)
    {
        using var content = new MultipartFormDataContent();
        using var fileStream = audioFile.OpenReadStream();
        using var fileContent = new StreamContent(fileStream);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue(audioFile.ContentType);

        content.Add(fileContent, "file", audioFile.FileName);
        content.Add(new StringContent("whisper-1"), "model");

        var response = await _httpClient.PostAsync("v1/audio/transcriptions", content);
        var responseBody = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            throw new Exception($"OpenAI API trả về lỗi {(int)response.StatusCode}: {responseBody}");
        }

        using var doc = JsonDocument.Parse(responseBody);
        return doc.RootElement.GetProperty("text").GetString() ?? string.Empty;
    }
}