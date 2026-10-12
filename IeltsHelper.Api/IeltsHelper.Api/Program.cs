using IeltsHelper.Api.Data;
using IeltsHelper.Api.Filters;
using IeltsHelper.Api.Models;
using IeltsHelper.Api.Repositories;
using IeltsHelper.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Serilog;
using Serilog.Events;
using System.Text;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

var _logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .WriteTo.Console()
    .WriteTo.File("Logs/IeltsHelper_log.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Logging.ClearProviders();
builder.Logging.AddSerilog(_logger);

// Add services to the container.

builder.Services.AddControllers(options =>
{
    options.Filters.Add<ValidateModelAttribute>();
})
    .ConfigureApiBehaviorOptions(options =>
    {
        options.SuppressModelStateInvalidFilter = true;
    })
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactDev", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("ai", httpContext =>
    {
        // Tính theo user đã đăng nhập, nếu không có thì theo IP
        var key = httpContext.User.Identity?.IsAuthenticated == true
            ? httpContext.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value
            : httpContext.Connection.RemoteIpAddress?.ToString() ?? "anon";

        return RateLimitPartition.GetFixedWindowLimiter(key, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 5,                    
            Window = TimeSpan.FromMinutes(1),   
            QueueLimit = 0
        });
    });
});
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddHttpClient("Anthropic", client =>
{
    client.BaseAddress = new Uri("https://api.anthropic.com/");
    client.DefaultRequestHeaders.Add("anthropic-version", "2023-06-01");
    client.DefaultRequestHeaders.Add("x-api-key", builder.Configuration["Anthropic:ApiKey"]);
});
builder.Services.AddHttpClient("OpenAI", client =>
{
    client.BaseAddress = new Uri("https://api.openai.com/");
    client.DefaultRequestHeaders.Add("Authorization", $"Bearer {builder.Configuration["OpenAI:ApiKey"]}");
});
builder.Services.AddScoped<SpeechToTextService>();
builder.Services.AddScoped<AiGradingService>();
builder.Services.AddScoped<VnPayService>();
builder.Services.AddScoped<EmailService>();
builder.Services.AddScoped<LessonLogWordExportService>();
builder.Services.AddScoped<MomoService>();
builder.Services.AddScoped<IVocabularyRepository, SQLVocabularyRepository>();
builder.Services.AddScoped<ICourseRepository, SQLCourseRepository>();
builder.Services.AddScoped<IErrorLogRepository, SQLErrorLogRepository>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IImageRepository, LocalImageRepository>();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Whale English API",
        Version = "v1"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Dán JWT token vào đây (không cần gõ chữ Bearer)."
    });

    options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("Bearer", document)] = []
    });
});

var app = builder.Build();
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var adminEmail = app.Configuration["Admin:Email"];
    var adminPassword = app.Configuration["Admin:Password"];

    if (!string.IsNullOrEmpty(adminEmail) && !await db.Users.AnyAsync(u => u.Role == "Admin"))
    {
        if (string.IsNullOrWhiteSpace(adminPassword) || adminPassword.Length < 8)
            throw new InvalidOperationException(
                "Admin:Password chưa được cấu hình hoặc quá ngắn (tối thiểu 8 ký tự). " +
                "Đặt bằng user-secrets hoặc biến môi trường Admin__Password.");

        var hasher = new PasswordHasher<User>();
        var admin = new User
        {
            Id = Guid.NewGuid(),
            Name = "Quản trị viên",
            Email = adminEmail,
            Role = "Admin"
        };
        admin.PasswordHash = hasher.HashPassword(admin, adminPassword);
        db.Users.Add(admin);
        await db.SaveChangesAsync();
        Console.WriteLine($"[Seed] Đã tạo tài khoản Admin: {adminEmail}");
    }
}
// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Whale English API v1");
        c.DocumentTitle = "Whale English API";
    });
}
// Tạo thư mục Images và cho phép truy cập ảnh qua /Images/ten-file.jpg
var imagesPath = Path.Combine(builder.Environment.ContentRootPath, "Images");
Directory.CreateDirectory(imagesPath);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(imagesPath),
    RequestPath = "/Images"
});

//app.UseHttpsRedirection();
app.UseCors("AllowReactDev");
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();
app.MapControllers();

app.Run();