namespace IeltsHelper.Api.Models;

public class Order
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public Guid CourseId { get; set; }
    public decimal Amount { get; set; }
    public string Status { get; set; } = "Pending"; // Pending, Paid, Failed
    public string TxnRef { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? PaidAt { get; set; }

    public User? Student { get; set; }
    public Course? Course { get; set; }
}