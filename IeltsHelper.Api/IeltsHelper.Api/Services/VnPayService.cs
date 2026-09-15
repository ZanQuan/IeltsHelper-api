using System.Net;
using System.Security.Cryptography;
using System.Text;

namespace IeltsHelper.Api.Services;

public class VnPayService
{
    private readonly IConfiguration _configuration;

    public VnPayService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string CreatePaymentUrl(decimal amount, string orderInfo, string txnRef, string ipAddress)
    {
        var vnpUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
        var tmnCode = _configuration["VnPay:TmnCode"]!;
        var hashSecret = _configuration["VnPay:HashSecret"]!;
        var returnUrl = _configuration["VnPay:ReturnUrl"]!;

        var vnpParams = new SortedList<string, string>(StringComparer.Ordinal)
        {
            { "vnp_Version", "2.1.0" },
            { "vnp_Command", "pay" },
            { "vnp_TmnCode", tmnCode },
            { "vnp_Amount", ((long)(amount * 100)).ToString() },
            { "vnp_CurrCode", "VND" },
            { "vnp_TxnRef", txnRef },
            { "vnp_OrderInfo", orderInfo },
            { "vnp_OrderType", "other" },
            { "vnp_Locale", "vn" },
            { "vnp_ReturnUrl", returnUrl },
            { "vnp_IpAddr", ipAddress },
            { "vnp_CreateDate", DateTime.Now.ToString("yyyyMMddHHmmss") }
        };

        var query = new StringBuilder();
        foreach (var kv in vnpParams)
        {
            if (string.IsNullOrEmpty(kv.Value)) continue;
            query.Append(WebUtility.UrlEncode(kv.Key));
            query.Append('=');
            query.Append(WebUtility.UrlEncode(kv.Value));
            query.Append('&');
        }

        var queryString = query.ToString();
        var signData = queryString.Substring(0, queryString.Length - 1); 

        var secureHash = HmacSha512(hashSecret, signData);

        return $"{vnpUrl}?{queryString}vnp_SecureHash={secureHash}";
    }

    public bool ValidateSignature(IDictionary<string, string> queryParams)
    {
        var hashSecret = _configuration["VnPay:HashSecret"]!;

        if (!queryParams.TryGetValue("vnp_SecureHash", out var receivedHash))
            return false;

        var sorted = new SortedList<string, string>(StringComparer.Ordinal);
        foreach (var kv in queryParams)
        {
            if (kv.Key == "vnp_SecureHash" || kv.Key == "vnp_SecureHashType") continue;
            sorted[kv.Key] = kv.Value;
        }

        var query = new StringBuilder();
        foreach (var kv in sorted)
        {
            if (string.IsNullOrEmpty(kv.Value)) continue;
            query.Append(WebUtility.UrlEncode(kv.Key));
            query.Append('=');
            query.Append(WebUtility.UrlEncode(kv.Value));
            query.Append('&');
        }
        var signData = query.ToString().TrimEnd('&');

        var computedHash = HmacSha512(hashSecret, signData);
        return string.Equals(computedHash, receivedHash, StringComparison.OrdinalIgnoreCase);
    }

    private static string HmacSha512(string key, string data)
    {
        using var hmac = new HMACSHA512(Encoding.UTF8.GetBytes(key));
        var hashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
        var sb = new StringBuilder();
        foreach (var b in hashBytes) sb.Append(b.ToString("x2"));
        return sb.ToString();
    }
}