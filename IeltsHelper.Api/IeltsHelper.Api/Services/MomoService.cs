using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace IeltsHelper.Api.Services;

public class MomoService
{
    private readonly IConfiguration _cfg;
    private readonly IHttpClientFactory _http;
    public MomoService(IConfiguration cfg, IHttpClientFactory http) { _cfg = cfg; _http = http; }

    public async Task<string> CreatePaymentUrlAsync(decimal amount, string orderInfo, string orderId)
    {
        var partnerCode = _cfg["Momo:PartnerCode"]!;
        var accessKey = _cfg["Momo:AccessKey"]!;
        var secretKey = _cfg["Momo:SecretKey"]!;
        var endpoint = _cfg["Momo:Endpoint"] ?? "https://test-payment.momo.vn/v2/gateway/api/create";
        var redirectUrl = _cfg["Momo:RedirectUrl"]!;
        var ipnUrl = _cfg["Momo:IpnUrl"]!;
        var requestId = Guid.NewGuid().ToString("N");
        var amountStr = ((long)amount).ToString();
        const string extraData = "";
        const string requestType = "captureWallet";

        var raw = $"accessKey={accessKey}&amount={amountStr}&extraData={extraData}&ipnUrl={ipnUrl}" +
                  $"&orderId={orderId}&orderInfo={orderInfo}&partnerCode={partnerCode}" +
                  $"&redirectUrl={redirectUrl}&requestId={requestId}&requestType={requestType}";

        var body = new
        {
            partnerCode,
            accessKey,
            requestId,
            amount = amountStr,
            orderId,
            orderInfo,
            redirectUrl,
            ipnUrl,
            extraData,
            requestType,
            lang = "vi",
            signature = Hmac(secretKey, raw)
        };

        var client = _http.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(30); // MoMo khuyến nghị tối thiểu 30s
        var res = await client.PostAsJsonAsync(endpoint, body);
        using var doc = JsonDocument.Parse(await res.Content.ReadAsStringAsync());
        var root = doc.RootElement;

        if (!root.TryGetProperty("resultCode", out var rc) || rc.GetInt32() != 0)
            throw new Exception("MoMo từ chối tạo giao dịch: " + root.GetRawText());
        return root.GetProperty("payUrl").GetString()!;
    }

    // Kiểm tra chữ ký của IPN do MoMo gọi về
    public bool ValidateIpn(IDictionary<string, string> d)
    {
        var accessKey = _cfg["Momo:AccessKey"]!;
        var secretKey = _cfg["Momo:SecretKey"]!;
        string G(string k) => d.TryGetValue(k, out var v) ? v : "";

        var raw = $"accessKey={accessKey}&amount={G("amount")}&extraData={G("extraData")}&message={G("message")}" +
                  $"&orderId={G("orderId")}&orderInfo={G("orderInfo")}&orderType={G("orderType")}" +
                  $"&partnerCode={G("partnerCode")}&payType={G("payType")}&requestId={G("requestId")}" +
                  $"&responseTime={G("responseTime")}&resultCode={G("resultCode")}&transId={G("transId")}";

        return string.Equals(Hmac(secretKey, raw), G("signature"), StringComparison.OrdinalIgnoreCase);
    }

    private static string Hmac(string key, string data)
    {
        using var h = new HMACSHA256(Encoding.UTF8.GetBytes(key));
        return Convert.ToHexString(h.ComputeHash(Encoding.UTF8.GetBytes(data))).ToLowerInvariant();
    }
}