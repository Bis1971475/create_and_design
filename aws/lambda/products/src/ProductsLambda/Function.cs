using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using System.Text.Json;

[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace ProductsLambda;

public class Function
{
    private readonly AmazonDynamoDBClient _dynamoDbClient = new();

    public async Task<APIGatewayProxyResponse> FunctionHandler(APIGatewayProxyRequest request, ILambdaContext context)
    {
        var tableName = Environment.GetEnvironmentVariable("PRODUCTS_TABLE_NAME");
        if (string.IsNullOrWhiteSpace(tableName))
        {
            return BuildResponse(500, new { message = "PRODUCTS_TABLE_NAME is not configured" });
        }

        var scan = await _dynamoDbClient.ScanAsync(new ScanRequest
        {
            TableName = tableName,
        });

        var items = scan.Items.Select(item => item.ToDictionary(
            kvp => kvp.Key,
            kvp => ConvertAttributeValue(kvp.Value)
        ));

        return BuildResponse(200, items);
    }

    private static object? ConvertAttributeValue(AttributeValue value)
    {
        if (value.S is not null) return value.S;
        if (value.N is not null && decimal.TryParse(value.N, out var number)) return number;
        if (value.BOOL.HasValue) return value.BOOL.Value;
        if (value.L is not null && value.L.Count > 0) return value.L.Select(ConvertAttributeValue).ToList();
        if (value.M is not null && value.M.Count > 0) return value.M.ToDictionary(k => k.Key, k => ConvertAttributeValue(k.Value));
        return null;
    }

    private static APIGatewayProxyResponse BuildResponse(int statusCode, object body)
    {
        return new APIGatewayProxyResponse
        {
            StatusCode = statusCode,
            Headers = new Dictionary<string, string>
            {
                { "content-type", "application/json" },
                { "cache-control", "public, max-age=60, stale-while-revalidate=300" },
            },
            Body = JsonSerializer.Serialize(body),
        };
    }
}
