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

namespace ssir.api
{
    public static class RoomData
    {
        [FunctionName("RoomData")]
        public static async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Function, "get", Route = "roomdata/{region}/{campus}/{building}")] HttpRequest req,
            [Blob("shared", Connection = "AzureWebJobsStorage")] CloudBlobContainer container,
            string region,
            string campus,
            string building,            
            ILogger log)
        {
            bool prerequisites = true;
            var errors = new StringBuilder();           
           
            var atlasConfigFile = Environment.GetEnvironmentVariable("AtlasConfigFile") ?? "atlasConfig.json";
            
            bool rebuild = false;
            Boolean.TryParse(req.Query["rebuild"], out rebuild);            

            if (string.IsNullOrEmpty(building))
            {
                prerequisites = false;
                errors.Append("Required query {building} was not defined");
            }
            
            var blobDataService = new BlobDataService();
            var atlasConfig = await blobDataService.ReadBlobData<BuildingConfig[]>(container, atlasConfigFile);
            var buildingConfig = atlasConfig.FirstOrDefault(b => b.BuildingId.ToLower() == $"{region}/{campus}/{building}".ToLower());

            if (buildingConfig == null)
            {
                prerequisites = false;
                errors.Append($"Atlas config for {building} was not found");
            }

            var atlasFeaturesFileName = $"{region}_{campus}_{building}_FeatureMap.json".ToLower();
            var featureMapref = container.GetBlockBlobReference(atlasFeaturesFileName);
            bool useAtlas = rebuild || !await featureMapref.ExistsAsync();
            List<Feature> features;
            

            if (prerequisites)
            {                
                var rdi = new Dictionary<string, Dictionary<string, RoomDataItem>>();
                try
                {
                    if (useAtlas)
                    {
                        features = await MapsService.FetchFeaturesFromAtlas(buildingConfig.DatasetId, buildingConfig.SubscriptionKey);
                        await featureMapref.UploadTextAsync(JsonConvert.SerializeObject(features));
                    }
                    else
                    {
                        features = await blobDataService.ReadBlobData<List<Feature>>(container, atlasFeaturesFileName);                       
                    }
                    
                    foreach(var feature in features)
                    {
                        var levelId = $"{region}/{campus}/{building}/{GetLevelName(feature.Properties.LevelId)}".ToLower();
                        if (!rdi.ContainsKey(levelId))
                        {
                            rdi.Add(levelId, new Dictionary<string, RoomDataItem>());
                        }
                        if(!rdi[levelId].ContainsKey(feature.Properties.Name))
                        {
                            rdi[levelId].Add(feature.Properties.Name.Replace("-",""),
                                new RoomDataItem()
                                {
                                    name = feature.Properties.Name,
                                    type = GetFeatureType(feature.Properties.CategoryId),
                                    unitId = feature.Id,
                                    polygon = feature.Geometry.Coordinates[0]
                                });
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

        private static string GetFeatureType(string featureType)
        {
            switch(featureType)
            {
                case "CTG7":
                    return "Conference";
                case "CTG9":
                    return "Restroom";
                case "CTG13":
                    return "Mechanical";
                case "CTG5":
                    return "zone";
                case "CTG2":
                    return "Room";
                case "CTG6":
                    return "Facility";
                case "CTG16":
                    return "Kitchenette";
                case "CTG12":
                    return "Cafeteria";
                case "CTG10":
                    return "Hallway";
                case "CTG15":
                    return "Lounge";
                case "CTG18":
                    return "Office";
                case "CTG8":
                    return "Lobby";

                default:
                    return "Other";
            }
        }

        private static object GetLevelName(string levelId)
        {
            switch (levelId)
            {
                case "LVL20":
                    return "L01";
                case "LVL21":
                    return "L02";
                case "LVL22":
                    return "L03";
                case "LVL14":
                    return "L01";
                case "LVL15":
                    return "L02";
                case "LVL16":
                    return "L03";
                default:
                    return levelId;
            }
        }

        private static async Task<IEnumerable<BuildingConfig>> FetchAtlasConfig(CloudBlockBlob configRef)
        {
            BuildingConfig[] cfg;
            using (var ms = new MemoryStream())
            {
                await configRef.DownloadToStreamAsync(ms);
                ms.Position = 0;
                using (StreamReader reader = new StreamReader(ms, Encoding.UTF8))
                {
                    var featuresStr = reader.ReadToEnd();
                    cfg = JsonConvert.DeserializeObject<BuildingConfig[]>(featuresStr);
                }
            }

            return cfg;
        }        
    }
}
