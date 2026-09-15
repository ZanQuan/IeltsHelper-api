using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Security.Cryptography;
using IeltsHelper.Api.Data;
using IeltsHelper.Api.Models;
using IeltsHelper.Api.Services;

namespace IeltsHelper.Api.Controllers;

public class RegisterRequest
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class ForgotPasswordRequest
{
    public string Email { get; set; } = string.Empty;
}

public class ResetPasswordRequest
{
    public string Email { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

public class GoogleLoginRequest
{
    // ID token (JWT credential) returned by Google Identity Services on the frontend
    public string Credential { get; set; } = string.Empty;
}

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly EmailService _emailService;
    private readonly PasswordHasher<User> _passwordHasher = new();

    public AuthController(AppDbContext context, IConfiguration configuration, EmailService emailService)
    {
        _context = context;
        _configuration = configuration;
        _emailService = emailService;
    }

    [HttpPost("register")]
    public async Task<ActionResult> Register(RegisterRequest request)
    {
        if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            return BadRequest(new { error = "Email đã được sử dụng." });

        var user = new User
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Email = request.Email,
            Role = "Student"
        };
        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Đăng ký thành công.", userId = user.Id });
    }

    [HttpPost("login")]
    public async Task<ActionResult> Login(LoginRequest request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user == null)
            return Unauthorized(new { error = "Email hoặc mật khẩu không đúng." });

        var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        if (result == PasswordVerificationResult.Failed)
            return Unauthorized(new { error = "Email hoặc mật khẩu không đúng." });

        var token = GenerateJwtToken(user);
        return Ok(new { token, userId = user.Id, name = user.Name, role = user.Role });
    }

    [HttpPost("google")]
    public async Task<ActionResult> GoogleLogin(GoogleLoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Credential))
            return BadRequest(new { error = "Thiếu thông tin đăng nhập Google." });

        Google.Apis.Auth.GoogleJsonWebSignature.Payload payload;
        try
        {
            var clientId = _configuration["Google:ClientId"];
            payload = await Google.Apis.Auth.GoogleJsonWebSignature.ValidateAsync(
                request.Credential,
                new Google.Apis.Auth.GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = new[] { clientId }
                });
        }
        catch (Exception)
        {
            return Unauthorized(new { error = "Xác thực Google không hợp lệ." });
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == payload.Email);

        if (user == null)
        {
            user = new User
            {
                Id = Guid.NewGuid(),
                Name = payload.Name ?? payload.Email,
                Email = payload.Email,
                Role = "Student",
                GoogleId = payload.Subject
            };
            // Tài khoản Google không dùng mật khẩu thường -> lưu một hash không thể đoán được
            user.PasswordHash = _passwordHasher.HashPassword(user, Guid.NewGuid().ToString("N"));
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
        }
        else if (user.GoogleId == null)
        {
            // Email đã tồn tại (đăng ký bằng mật khẩu trước đó) -> liên kết với tài khoản Google
            user.GoogleId = payload.Subject;
            await _context.SaveChangesAsync();
        }

        var token = GenerateJwtToken(user);
        return Ok(new { token, userId = user.Id, name = user.Name, role = user.Role });
    }

    [HttpPost("forgot-password")]
    public async Task<ActionResult> ForgotPassword(ForgotPasswordRequest request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user != null)
        {
            var rawToken = GenerateSecureToken();
            user.PasswordResetTokenHash = HashToken(rawToken);
            user.PasswordResetTokenExpiresAt = DateTime.UtcNow.AddMinutes(30);
            await _context.SaveChangesAsync();

            var frontendUrl = _configuration["Frontend:BaseUrl"] ?? "http://localhost:5173";
            var resetLink = $"{frontendUrl}/reset-password?email={Uri.EscapeDataString(user.Email)}&token={rawToken}";

            var html = $@"
                <p>Xin chào {user.Name},</p>
                <p>Bạn (hoặc ai đó) vừa yêu cầu đặt lại mật khẩu cho tài khoản Whale English.</p>
                <p><a href=""{resetLink}"">Bấm vào đây để đặt lại mật khẩu</a></p>
                <p>Liên kết có hiệu lực trong 30 phút. Nếu bạn không yêu cầu điều này, hãy bỏ qua email.</p>";

            try
            {
                await _emailService.SendEmailAsync(user.Email, "Đặt lại mật khẩu - Whale English", html);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ForgotPassword] Gửi email thất bại: {ex.Message}");
            }
        }

        return Ok(new { message = "Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu." });
    }

    [HttpPost("reset-password")]
    public async Task<ActionResult> ResetPassword(ResetPasswordRequest request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

        if (user == null || user.PasswordResetTokenHash == null || user.PasswordResetTokenExpiresAt == null)
            return BadRequest(new { error = "Liên kết không hợp lệ hoặc đã hết hạn." });

        if (user.PasswordResetTokenExpiresAt < DateTime.UtcNow)
            return BadRequest(new { error = "Liên kết đã hết hạn. Vui lòng yêu cầu lại." });

        if (HashToken(request.Token) != user.PasswordResetTokenHash)
            return BadRequest(new { error = "Liên kết không hợp lệ hoặc đã hết hạn." });

        if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 6)
            return BadRequest(new { error = "Mật khẩu mới phải có ít nhất 6 ký tự." });

        user.PasswordHash = _passwordHasher.HashPassword(user, request.NewPassword);
        user.PasswordResetTokenHash = null;
        user.PasswordResetTokenExpiresAt = null;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập ngay." });
    }

    private static string GenerateSecureToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToHexString(bytes); 
    }

    private static string HashToken(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(bytes);
    }

    private string GenerateJwtToken(User user)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Name),
            new Claim(ClaimTypes.Role, user.Role)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}