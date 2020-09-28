using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using System.Net.Http;
using ssir.api.Models.Atlas;

namespace ssir.api.APIFunctions
{
    public static class AtlasUnits
    {
        [FunctionName("AtlasUnits")]
        public static async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Function, "get", "post", Route = null)] HttpRequest req,
            ILogger log)
        {
            var atlasSubscriptionKey = Environment.GetEnvironmentVariable("atlasSubscriptionKey");
            var atlasDataSetId = Environment.GetEnvironmentVariable("atlasDataSetId");

            using (var client = new HttpClient())
            {
                var baseUri = new System.Text.StringBuilder($"https://atlas.microsoft.com/wfs/datasets/{atlasDataSetId}/collections/unit/items?api-version=1.0&subscription-key={atlasSubscriptionKey}&limit=2");
                HttpRequestMessage requestMessage = new HttpRequestMessage(HttpMethod.Get, baseUri.ToString());
                var response = await client.SendAsync(requestMessage);
                var result = await response.Content.ReadAsStringAsync();

                var featureCollection = JsonConvert.DeserializeObject<FeatureCollection>(result);
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
