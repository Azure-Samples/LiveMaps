using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.Extensions.Logging;
using Ssir.Api.Models.Atlas;

namespace Ssir.Api.APIFunctions
{
    public static class AtlasUnits
    {
        [FunctionName("AtlasUnits")]
        public static async Task<IActionResult> Run(
            //This HTTP trigger sends a client HTTP request through the atlasSubscriptionKey and atlasDataSetId parameters to get featureIds.
            [HttpTrigger(AuthorizationLevel.Function, "get", "post", Route = null)] HttpRequest req,
            ILogger log)
        {
            //Get the atlasSubscriptionKey value from environment variable.
            var atlasSubscriptionKey = Environment.GetEnvironmentVariable("atlasSubscriptionKey");

            //Get the atlasDataSetId value from environment variable.
            var atlasDataSetId = Environment.GetEnvironmentVariable("atlasDataSetId");

            using (var client = new HttpClient())
            {
                var baseUri = new UriBuilder($"https://atlas.microsoft.com/wfs/datasets/{atlasDataSetId}/collections/unit/items?api-version=1.0&subscription-key={atlasSubscriptionKey}&limit=2");
                HttpRequestMessage requestMessage = new HttpRequestMessage(HttpMethod.Get, baseUri.ToString());
                //Send an HTTP request as an asynchronous operation.
                var response = await client.SendAsync(requestMessage);
                //Serialize the HTTP content to a string as an asynchronous operation.
                var result = await response.Content.ReadAsStringAsync();
                //Parse the result into FeatureCollection class
                var featureCollection = JsonSerializer.Deserialize<FeatureCollection>(result);
                if(featureCollection != null && featureCollection.Features != null)
                {
                    foreach(var feature in featureCollection.Features)
                    {
                        var a = feature.Id;
                    }
                }
            }


            return new OkObjectResult("Ok");
        }
    }
}
