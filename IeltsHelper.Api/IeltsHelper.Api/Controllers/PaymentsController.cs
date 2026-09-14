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
}

[Route("api/[controller]")]
public class PaymentsController : BaseApiController
{
    private readonly AppDbContext _context;
    private readonly VnPayService _vnPayService;

    public PaymentsController(AppDbContext context, VnPayService vnPayService)
    {
        _context = context;
        _vnPayService = vnPayService;
    }

    [HttpPost("create-payment-url")]
    public async Task<ActionResult> CreatePaymentUrl(CreatePaymentRequest request)
    {
        var course = await _context.Courses.FindAsync(request.CourseId);
        if (course == null) return NotFound();

        var alreadyEnrolled = await _context.Enrollments
            .AnyAsync(e => e.CourseId == request.CourseId && e.StudentId == CurrentUserId);
        if (alreadyEnrolled) return BadRequest(new { error = "Bạn đã sở hữu khóa học này rồi." });

        var order = new Order
        {
            Id = Guid.NewGuid(),
            StudentId = CurrentUserId,
            CourseId = course.Id,
            Amount = course.Price,
            Status = "Pending",
            TxnRef = DateTime.Now.Ticks.ToString(),
            CreatedAt = DateTime.UtcNow
        };

        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        var paymentUrl = _vnPayService.CreatePaymentUrl(
            order.Amount, $"Thanh toan khoa hoc {course.Title}", order.TxnRef, ipAddress);

        return Ok(new { paymentUrl, orderId = order.Id });
    }

    [HttpGet("vnpay-return")]
    [AllowAnonymous]
    public async Task<ActionResult> VnPayReturn()
    {
        var queryParams = Request.Query.ToDictionary(q => q.Key, q => q.Value.ToString());

        if (!_vnPayService.ValidateSignature(queryParams))
            return BadRequest(new { error = "Chữ ký không hợp lệ." });

        var txnRef = queryParams["vnp_TxnRef"];
        var responseCode = queryParams["vnp_ResponseCode"];

        var order = await _context.Orders.FirstOrDefaultAsync(o => o.TxnRef == txnRef);
        if (order == null) return NotFound();

        if (responseCode == "00")
        {
            order.Status = "Paid";
            order.PaidAt = DateTime.UtcNow;

            var alreadyEnrolled = await _context.Enrollments
                .AnyAsync(e => e.CourseId == order.CourseId && e.StudentId == order.StudentId);
            if (!alreadyEnrolled)
            {
                _context.Enrollments.Add(new Enrollment
                {
                    Id = Guid.NewGuid(),
                    CourseId = order.CourseId,
                    StudentId = order.StudentId,
                    EnrolledAt = DateTime.UtcNow,
                    CompletedLessonIdsJson = "[]"
                });
            }
        }
        else
        {
            order.Status = "Failed";
        }

        await _context.SaveChangesAsync();
        return Ok(new { status = order.Status, orderId = order.Id });
    }
}