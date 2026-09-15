using System.Net;
using System.Net.Mail;

namespace IeltsHelper.Api.Services;

public class EmailService
{
    private readonly IConfiguration _configuration;

    public EmailService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task SendEmailAsync(string toEmail, string subject, string htmlBody)
    {
        var host = _configuration["Email:Host"];
        var portText = _configuration["Email:Port"];
        var senderEmail = _configuration["Email:User"];
        var senderPassword = _configuration["Email:Password"];
        var fromName = _configuration["Email:FromName"] ?? "Whale English";

        if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(senderEmail) || string.IsNullOrWhiteSpace(senderPassword))
        {
            throw new InvalidOperationException(
                "Chưa cấu hình Email:Host / Email:User / Email:Password. " +
                "Xem hướng dẫn cấu hình bằng 'dotnet user-secrets'.");
        }

        var port = int.TryParse(portText, out var parsedPort) ? parsedPort : 587;

        using var client = new SmtpClient(host, port)
        {
            Credentials = new NetworkCredential(senderEmail, senderPassword),
            EnableSsl = true,
        };

        using var message = new MailMessage
        {
            From = new MailAddress(senderEmail, fromName),
            Subject = subject,
            Body = htmlBody,
            IsBodyHtml = true,
        };
        message.To.Add(toEmail);

        await client.SendMailAsync(message);
    }
}
