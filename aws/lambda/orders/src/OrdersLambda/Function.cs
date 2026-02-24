using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using System.Globalization;
using System.Text.Json;

[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace OrdersLambda;

public class Function
{
    private readonly AmazonDynamoDBClient _dynamoDbClient = new();

    public async Task<APIGatewayProxyResponse> FunctionHandler(APIGatewayProxyRequest request, ILambdaContext context)
    {
        var tableName = Environment.GetEnvironmentVariable("ORDERS_TABLE_NAME");
        if (string.IsNullOrWhiteSpace(tableName))
        {
            return BuildResponse(500, new { message = "ORDERS_TABLE_NAME is not configured" });
        }

        if (string.IsNullOrWhiteSpace(request.Body))
        {
            return BuildResponse(400, new { message = "Request body is required" });
        }

        var payload = JsonSerializer.Deserialize<CreateOrderRequest>(
            request.Body,
            new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
            }
        );
        if (payload is null)
        {
            return BuildResponse(400, new { message = "Invalid JSON body" });
        }

        if (payload.Total <= 0 || payload.Items is null || payload.Items.Count == 0 || payload.Customer is null || payload.Delivery is null || payload.Payment is null)
        {
            return BuildResponse(400, new { message = "Order payload is incomplete" });
        }

        var orderId = Guid.NewGuid().ToString();
        var now = DateTimeOffset.UtcNow.ToString("O");
        var deliveryDate = payload.Delivery.Date ?? string.Empty;
        var deliveryTime = payload.Delivery.Time ?? string.Empty;
        var paymentMethod = payload.Payment.Method ?? string.Empty;

        var item = new Dictionary<string, AttributeValue>
        {
            ["id"] = new AttributeValue { S = orderId },
            ["createdAt"] = new AttributeValue { S = now },
            ["requestedAt"] = new AttributeValue { S = now },
            ["status"] = new AttributeValue { S = "created" },
            ["deliveryDate"] = new AttributeValue { S = deliveryDate },
            ["deliveryTime"] = new AttributeValue { S = deliveryTime },
            ["paymentMethod"] = new AttributeValue { S = paymentMethod },
            ["total"] = new AttributeValue { N = payload.Total.ToString(CultureInfo.InvariantCulture) },
            ["customer"] = new AttributeValue
            {
                M = new Dictionary<string, AttributeValue>
                {
                    ["name"] = new AttributeValue { S = payload.Customer.Name ?? string.Empty },
                    ["phone"] = new AttributeValue { S = payload.Customer.Phone ?? string.Empty },
                },
            },
            ["delivery"] = new AttributeValue
            {
                M = new Dictionary<string, AttributeValue>
                {
                    ["date"] = new AttributeValue { S = deliveryDate },
                    ["time"] = new AttributeValue { S = deliveryTime },
                    ["address"] = new AttributeValue { S = payload.Delivery.Address ?? string.Empty },
                    ["notes"] = new AttributeValue { S = payload.Delivery.Notes ?? string.Empty },
                },
            },
            ["payment"] = new AttributeValue
            {
                M = new Dictionary<string, AttributeValue>
                {
                    ["method"] = new AttributeValue { S = paymentMethod },
                    ["details"] = new AttributeValue
                    {
                        M = new Dictionary<string, AttributeValue>
                        {
                            ["cashChangeFor"] = new AttributeValue { S = payload.Payment.Details?.CashChangeFor ?? string.Empty },
                            ["transferReference"] = new AttributeValue { S = payload.Payment.Details?.TransferReference ?? string.Empty },
                            ["transferClabe"] = new AttributeValue { S = payload.Payment.Details?.TransferClabe ?? string.Empty },
                            ["cardHolder"] = new AttributeValue { S = payload.Payment.Details?.CardHolder ?? string.Empty },
                            ["cardLast4"] = new AttributeValue { S = payload.Payment.Details?.CardLast4 ?? string.Empty },
                        },
                    },
                },
            },
            ["items"] = new AttributeValue
            {
                L = payload.Items.Select(orderItem => new AttributeValue
                {
                    M = new Dictionary<string, AttributeValue>
                    {
                        ["productId"] = new AttributeValue { S = orderItem.ProductId ?? string.Empty },
                        ["name"] = new AttributeValue { S = orderItem.Name ?? string.Empty },
                        ["quantity"] = new AttributeValue { N = orderItem.Quantity.ToString(CultureInfo.InvariantCulture) },
                        ["price"] = new AttributeValue { N = orderItem.Price.ToString(CultureInfo.InvariantCulture) },
                    },
                }).ToList(),
            },
        };

        await _dynamoDbClient.PutItemAsync(new PutItemRequest
        {
            TableName = tableName,
            Item = item,
        });

        return BuildResponse(201, new
        {
            orderId,
            status = "created",
            createdAt = now,
            requestedAt = now,
            deliveryDate,
            deliveryTime,
            paymentMethod,
        });
    }

    private static APIGatewayProxyResponse BuildResponse(int statusCode, object body)
    {
        return new APIGatewayProxyResponse
        {
            StatusCode = statusCode,
            Headers = new Dictionary<string, string>
            {
                { "content-type", "application/json" },
                { "access-control-allow-origin", "*" },
                { "access-control-allow-headers", "content-type,authorization" },
                { "access-control-allow-methods", "POST,OPTIONS" },
            },
            Body = JsonSerializer.Serialize(body),
        };
    }
}

public class CreateOrderRequest
{
    public CustomerInfo? Customer { get; set; }
    public DeliveryInfo? Delivery { get; set; }
    public PaymentInfo? Payment { get; set; }
    public decimal Total { get; set; }
    public List<OrderItem>? Items { get; set; }
}

public class CustomerInfo
{
    public string? Name { get; set; }
    public string? Phone { get; set; }
}

public class DeliveryInfo
{
    public string? Date { get; set; }
    public string? Time { get; set; }
    public string? Address { get; set; }
    public string? Notes { get; set; }
}

public class PaymentInfo
{
    public string? Method { get; set; }
    public PaymentDetails? Details { get; set; }
}

public class PaymentDetails
{
    public string? CashChangeFor { get; set; }
    public string? TransferReference { get; set; }
    public string? TransferClabe { get; set; }
    public string? CardHolder { get; set; }
    public string? CardLast4 { get; set; }
}

public class OrderItem
{
    public string? ProductId { get; set; }
    public string? Name { get; set; }
    public int Quantity { get; set; }
    public decimal Price { get; set; }
}
