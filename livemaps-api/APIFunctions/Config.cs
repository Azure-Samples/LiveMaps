using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using System.ComponentModel;
using System.Text;
using ssir.api.Services;
using System.Collections.Generic;
using ssir.api.Models;
using Microsoft.WindowsAzure.Storage.Blob;
using System.Linq.Expressions;
using System.Linq;
using System.Net.Http;
using ssir.api.Models.Atlas;
using System.Net;

namespace ssir.api
{
    public static class Config
    {
        [FunctionName("Config")]
        public static async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Function, "get", Route = "config/{region}/{campus}/{building}")] HttpRequest req,
            [Blob("shared", Connection = "AzureWebJobsStorage")] CloudBlobContainer container,
            string region,
            string campus,
            string building,             
            ILogger log)
        {
            bool prerequisites = true;
            var errors = new StringBuilder();

            var blobDataService = new BlobDataService();
            
            var atlasConfigFile = Environment.GetEnvironmentVariable("AtlasConfigFile") ?? "atlasConfig.json";                     

            if (string.IsNullOrEmpty(building))
            {
                prerequisites = false;
                errors.Append("Required query {building} was not defined");
            }
            
            var result = "";
            if (prerequisites)
            {
                try
                {
                    var config = await blobDataService.ReadBlobData<BuildingConfig[]>(container, atlasConfigFile);
                    var buildingCfg = config.FirstOrDefault(cfg => cfg.BuildingId.ToLower() == $"{region}/{campus}/{building}".ToLower());
                    if (buildingCfg != null)
                        result = JsonConvert.SerializeObject(buildingCfg);                  

                }
                catch (Exception ex)
                {
                    log.LogError(ex.Message);
                }                
            }
            else
            {
                log.LogError(errors.ToString());
                return new NotFoundResult();
            }

            return new OkObjectResult(result);
        }

        private static async Task<List<Feature>> FetchFeaturesFromAtlas(string atlasDataSetId, string atlasSubscriptionKey)
        {
            List<Feature> features = new List<Feature>();
            var limit = 50;
            string url = $"https://atlas.microsoft.com/wfs/datasets/{atlasDataSetId}/collections/unit/items?api-version=1.0&limit={limit}&subscription-key={atlasSubscriptionKey}";
            for (int i = 0; ; i++)
            {
                using (var client = new HttpClient())
                {
                    HttpRequestMessage requestMessage = new HttpRequestMessage(HttpMethod.Get, url);
                    var response = await client.SendAsync(requestMessage);

                    if (response.StatusCode != HttpStatusCode.OK)
                        break;

                    var result = await response.Content.ReadAsStringAsync();

                    var featureCollection = JsonConvert.DeserializeObject<FeatureCollection>(result);
                    features.AddRange(featureCollection.Features);

                    if (featureCollection.NumberReturned < limit)
                        break;
                    var nextLink = featureCollection.links.FirstOrDefault(f => f.rel == "next");
                    if (nextLink == null)
                        break;
                    else
                        url = nextLink.href + $"&subscription-key={atlasSubscriptionKey}";
                }
            }

            return features;
        }
    }
}
