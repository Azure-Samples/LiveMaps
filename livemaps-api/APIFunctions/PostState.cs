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
using System.Reflection.Metadata;
using Newtonsoft.Json.Linq;

namespace ssir.api
{
    public static class PostState
    {
        [FunctionName("PostState")]
        public static async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Function, "post", Route = "state/{region}/{campus}/{building}/{floor}/{room}")] HttpRequest req,
            [Blob("shared", Connection = "AzureWebJobsStorage")] CloudBlobContainer container,
            string region,
            string campus,
            string building, 
            string floor,
            string room,
            ILogger log)
        {
            bool prerequisites = true;
            var errors = new StringBuilder();           
           
            var atlasConfigFile = Environment.GetEnvironmentVariable("AtlasConfigFile") ?? "atlasConfig.json";

            if (string.IsNullOrEmpty(room))
            {
                prerequisites = false;
                errors.Append("Required query parameter {room} was not defined");
            }
            
            var blobDataService = new BlobDataService();
            var atlasConfig = await blobDataService.ReadBlobData<BuildingConfig[]>(container, atlasConfigFile);
            var buildingConfig = atlasConfig.FirstOrDefault(b => b.BuildingId.ToLower() == $"{region}/{campus}/{building}".ToLower());

            if (buildingConfig == null)
            {
                prerequisites = false;
                errors.Append($"Atlas config for {building} was not found");
            }            

            string requestBody = await new StreamReader(req.Body).ReadToEndAsync();
            

            var atlasFeaturesFileName = $"{region}_{campus}_{building}_featuremap.json".ToLower();
            var featureMapref = container.GetBlockBlobReference(atlasFeaturesFileName);
           
            List<Feature> features;
            

            if (prerequisites)
            {                
                var rdi = new Dictionary<string, Dictionary<string, RoomDataItem>>();
                try
                {
                    features = await blobDataService.ReadBlobData<List<Feature>>(container, atlasFeaturesFileName);

                    var jo = JObject.Parse(requestBody);
                    string stateSet = null;
                    string value = null;
                    
                    if (jo != null)
                    {
                        var jp = jo.First as JProperty;
                        if(jp != null)
                        {
                            stateSet = jp.Name;
                            value = jp.Value.ToString();
                        }
                    }
                                        
                    var stateSetCfg = buildingConfig.StateSets.FirstOrDefault(ss => ss.StateSetName.ToLower() == stateSet.ToLower());

                    if(stateSetCfg != null)
                    {
                        var feature = features.FirstOrDefault(f => f.Properties.Name.ToLower().Replace("-","") == room.ToLower().Replace("-",""));
                        if (feature != null) {

                            var mapsService = new MapsService(buildingConfig.SubscriptionKey, buildingConfig.DatasetId, stateSetCfg.StateSetId.ToString());
                            await mapsService.UpdateTagState(stateSetCfg.StateSetName, feature.Id, value);
                        }
                    }                    
                    
                }
                catch (Exception ex)
                {
                    log.LogError(ex.Message);
                }

                return new OkObjectResult(JsonConvert.SerializeObject(rdi));
            }
            else
            {
                log.LogError(errors.ToString());
                return new NotFoundResult();
            }            
        }
    }
}
