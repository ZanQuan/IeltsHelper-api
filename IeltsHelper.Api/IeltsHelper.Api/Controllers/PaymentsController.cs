using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IeltsHelper.Api.Data;
using IeltsHelper.Api.Models;
using IeltsHelper.Api.Services;

namespace IeltsHelper.Api.Controllers;

public class CreatePaymentRequest
{
    public Guid CourseId { get; set; }
    public string Provider { get; set; } = "VnPay"; // VnPay | Momo
}

[Route("api/[controller]")]
public class PaymentsController : BaseApiController
{
    private readonly AppDbContext _context;
    private readonly VnPayService _vnPayService;
    private readonly MomoService _momoService;
    private readonly ILogger<PaymentsController> _logger;

    public PaymentsController(
        AppDbContext context,
        VnPayService vnPayService,
        MomoService momoService,
        ILogger<PaymentsController> logger)
    {
        _context = context;
        _vnPayService = vnPayService;
        _momoService = momoService;
        _logger = logger;
    }

    // Tạo giao dịch 
    [HttpPost("create-payment-url")]
    public async Task<ActionResult> CreatePaymentUrl(CreatePaymentRequest request)
    {
        if (request.Provider is not ("VnPay" or "Momo"))
            return BadRequest(new { error = "Phương thức thanh toán không hợp lệ." });

        var course = await _context.Courses.FindAsync(request.CourseId);
        if (course == null) return NotFound();
        if (User.IsInRole("Teacher") && course.TeacherId != CurrentUserId) return NotFound();

        if (course.Price <= 0)
            return BadRequest(new { error = "Khóa học miễn phí, hãy ghi danh trực tiếp." });

        var alreadyEnrolled = await _context.Enrollments
            .AnyAsync(e => e.CourseId == request.CourseId && e.StudentId == CurrentUserId);
        if (alreadyEnrolled) return BadRequest(new { error = "Bạn đã sở hữu khóa học này rồi." });

        var orderId = Guid.NewGuid();
        var order = new Order
        {
            Id = orderId,
            StudentId = CurrentUserId,
            CourseId = course.Id,
            Amount = course.Price,
            Status = "Pending",
            Provider = request.Provider,
            TxnRef = orderId.ToString("N"),   // duy nhất, 32 ký tự
            CreatedAt = DateTime.UtcNow
        };

        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        var orderInfo = $"Thanh toan khoa hoc {course.Title}";
        string paymentUrl;
        try
        {
            if (request.Provider == "Momo")
            {
                paymentUrl = await _momoService.CreatePaymentUrlAsync(order.Amount, orderInfo, order.TxnRef);
            }
            else
            {
                var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
                paymentUrl = _vnPayService.CreatePaymentUrl(order.Amount, orderInfo, order.TxnRef, ipAddress);
            }
        }
        catch (Exception ex)
        {
            // Ghi chi tiết vào log phía server, không trả ra client
            _logger.LogError(ex, "Tạo giao dịch {Provider} thất bại cho đơn {OrderId}", request.Provider, order.Id);
            order.Status = "Failed";
            await _context.SaveChangesAsync();
            return StatusCode(502, new { error = "Không tạo được giao dịch, vui lòng thử lại sau." });
        }

        return Ok(new { paymentUrl, orderId = order.Id, txnRef = order.TxnRef });
    }

    // Trang kết quả hỏi trạng thái đơn của chính người dùng
    [HttpGet("status/{txnRef}")]
    public async Task<ActionResult> Status(string txnRef)
    {
        var order = await _context.Orders
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.TxnRef == txnRef && o.StudentId == CurrentUserId);
        if (order == null) return NotFound();
        return Ok(new { status = order.Status, orderId = order.Id });
    }

    // VNPay 

    // IPN: VNPay gọi server-to-server. Phải trả đúng định dạng {RspCode, Message}
    [HttpGet("vnpay-ipn")]
    [AllowAnonymous]
    public async Task<IActionResult> VnPayIpn()
    {
        var queryParams = Request.Query.ToDictionary(q => q.Key, q => q.Value.ToString());
        var (code, message) = await ProcessVnPayAsync(queryParams);
        return Ok(new { RspCode = code, Message = message });
    }

    // Return: trình duyệt người dùng quay về, frontend gọi endpoint này để lấy kết quả
    [HttpGet("vnpay-return")]
    [AllowAnonymous]
    public async Task<ActionResult> VnPayReturn()
    {
        var queryParams = Request.Query.ToDictionary(q => q.Key, q => q.Value.ToString());
        var (code, _) = await ProcessVnPayAsync(queryParams);

        if (code is "97" or "01" or "04")
            return BadRequest(new { error = "Giao dịch không hợp lệ." });

        var txnRef = queryParams.GetValueOrDefault("vnp_TxnRef");
        var order = await _context.Orders
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.TxnRef == txnRef);
        if (order == null) return NotFound();

        return Ok(new { status = order.Status, orderId = order.Id });
    }

    // Dùng chung cho IPN và Return: kiểm tra chữ ký, số tiền, chống xử lý lặp
    private async Task<(string Code, string Message)> ProcessVnPayAsync(Dictionary<string, string> q)
    {
        if (!_vnPayService.ValidateSignature(q)) return ("97", "Invalid signature");

        var txnRef = q.GetValueOrDefault("vnp_TxnRef");
        var order = await _context.Orders
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.TxnRef == txnRef);
        if (order == null) return ("01", "Order not found");

        if (!long.TryParse(q.GetValueOrDefault("vnp_Amount"), out var amount)
            || amount != (long)(order.Amount * 100))
            return ("04", "Invalid amount");

        if (order.Status != "Pending") return ("02", "Order already confirmed");

        var success = q.GetValueOrDefault("vnp_ResponseCode") == "00"
                      && q.GetValueOrDefault("vnp_TransactionStatus") == "00";

        var done = await CompleteOrderAsync(order, success, q.GetValueOrDefault("vnp_TransactionNo"));
        return done ? ("00", "Confirm Success") : ("02", "Order already confirmed");
    }

    // MoMo 

    // IPN: MoMo gọi POST JSON. Trả HTTP 204 khi đã nhận
    [HttpPost("momo-ipn")]
    [AllowAnonymous]
    public async Task<IActionResult> MomoIpn([FromBody] JsonElement body)
    {
        var data = body.EnumerateObject().ToDictionary(
            p => p.Name,
            p => p.Value.ValueKind == JsonValueKind.String
                ? p.Value.GetString() ?? ""
                : p.Value.GetRawText());

        if (!_momoService.ValidateIpn(data)) return BadRequest();

        var orderRef = data.GetValueOrDefault("orderId");
        var order = await _context.Orders
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.TxnRef == orderRef);
        if (order == null) return NotFound();

        if (!long.TryParse(data.GetValueOrDefault("amount"), out var amount)
            || amount != (long)order.Amount)
            return BadRequest();

        if (order.Status == "Pending")
        {
            await CompleteOrderAsync(
                order,
                data.GetValueOrDefault("resultCode") == "0",
                data.GetValueOrDefault("transId"));
        }

        return NoContent();
    }

    private async Task<bool> CompleteOrderAsync(Order order, bool success, string? providerTransId)
    {
        var newStatus = success ? "Paid" : "Failed";
        DateTime? paidAt = success ? DateTime.UtcNow : null;

        var affected = await _context.Orders
            .Where(o => o.Id == order.Id && o.Status == "Pending")
            .ExecuteUpdateAsync(s => s
                .SetProperty(o => o.Status, newStatus)
                .SetProperty(o => o.PaidAt, paidAt)
                .SetProperty(o => o.ProviderTransId, providerTransId));

        if (affected == 0) return false; // luồng khác đã xử lý trước

        if (success)
        {
            var enrolled = await _context.Enrollments
                .AnyAsync(e => e.CourseId == order.CourseId && e.StudentId == order.StudentId);
            if (!enrolled)
            {
                _context.Enrollments.Add(new Enrollment
                {
                    Id = Guid.NewGuid(),
                    CourseId = order.CourseId,
                    StudentId = order.StudentId,
                    EnrolledAt = DateTime.UtcNow,
                    CompletedLessonIdsJson = "[]"
                });
                try
                {
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateException)
                {
                    // Index duy nhất (CourseId, StudentId) đã chặn bản ghi trùng
                    _context.ChangeTracker.Clear();
                }
            }

            var teacherId = await _context.Courses
                .Where(c => c.Id == order.CourseId)
                .Select(c => c.TeacherId)
                .FirstAsync();

            var alreadyLinked = await _context.TeacherStudentLinks
                .AnyAsync(l => l.TeacherId == teacherId && l.StudentId == order.StudentId);

            if (!alreadyLinked)
            {
                _context.TeacherStudentLinks.Add(new TeacherStudentLink
                {
                    Id = Guid.NewGuid(),
                    TeacherId = teacherId,
                    StudentId = order.StudentId,
                    CreatedAt = DateTime.UtcNow
                });
                try
                {
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateException)
                {
                    // Đã có liên kết (chạy song song)
                    _context.ChangeTracker.Clear();
                }
            }
        }

        return true;
    }
}