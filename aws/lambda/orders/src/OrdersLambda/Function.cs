using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
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

        var payload = JsonSerializer.Deserialize<CreateOrderRequest>(request.Body);
        if (payload is null)
        {
            return BuildResponse(400, new { message = "Invalid JSON body" });
        }

        var orderId = Guid.NewGuid().ToString();
        var now = DateTimeOffset.UtcNow.ToString("O");

        var item = new Dictionary<string, AttributeValue>
        {
            ["id"] = new AttributeValue { S = orderId },
            ["createdAt"] = new AttributeValue { S = now },
            ["status"] = new AttributeValue { S = "created" },
            ["total"] = new AttributeValue { N = payload.Total.ToString() },
            ["customer"] = new AttributeValue { S = payload.Customer ?? string.Empty },
            ["items"] = new AttributeValue
            {
                S = JsonSerializer.Serialize(payload.Items ?? new List<OrderItem>()),
            },
        };

        await _dynamoDbClient.PutItemAsync(new PutItemRequest
        {
            TableName = tableName,
            Item = item,
        });

        return BuildResponse(201, new { orderId, status = "created" });
    }

    private static APIGatewayProxyResponse BuildResponse(int statusCode, object body)
    {
        return new APIGatewayProxyResponse
        {
            StatusCode = statusCode,
            Headers = new Dictionary<string, string> { { "content-type", "application/json" } },
            Body = JsonSerializer.Serialize(body),
        };
    }
}

public class CreateOrderRequest
{
    public string? Customer { get; set; }
    public decimal Total { get; set; }
    public List<OrderItem>? Items { get; set; }
}

public class OrderItem
{
    public string? ProductId { get; set; }
    public string? Name { get; set; }
    public int Quantity { get; set; }
    public decimal Price { get; set; }
}
