using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection.Metadata;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.Extensions.Logging;
using Ssir.Api.Models;
using Ssir.Api.Models.Atlas;
using Ssir.Api.Services;

namespace Ssir.Api
{
    public static class RoomData
    {
        /*
         RoomData API function returns array with units description taken from Azure maps API after dwg package is uploaded there.
         */
        [FunctionName("RoomData")]
        public static async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Function, "get", Route = "roomdata/{region}/{campus}/{building}")] HttpRequest req,
            [Blob("shared", Connection = "AzureWebJobsStorage")] BlobContainerClient container,
            string region,
            string campus,
            string building,
            ILogger log)
        {
            bool prerequisites = true;
            var errors = new StringBuilder();
            //Get the AtlasConfigFile from environment variable
            var atlasConfigFile = Environment.GetEnvironmentVariable("AtlasConfigFile") ?? "atlasConfig.json";
            
            bool rebuild = false;
            Boolean.TryParse(req.Query["rebuild"], out rebuild);            

            if (string.IsNullOrEmpty(building))
            {
                prerequisites = false;
                errors.Append("Required query {building} was not defined");
            }
            
            var blobDataService = new BlobDataService();
            //Create a ReadBlobData operation and return the data of the BuildingConfig.
            var atlasConfig = await blobDataService.ReadBlobData<BuildingConfig[]>(container, atlasConfigFile);
            var buildingConfig = atlasConfig.FirstOrDefault(b => b.BuildingId.ToLower() == $"{region}/{campus}/{building}".ToLower());

            if (buildingConfig == null)
            {
                prerequisites = false;
                errors.Append($"Atlas config for {building} was not found");
            }

            var atlasFeaturesFileName = $"{region}_{campus}_{building}_FeatureMap.json".ToLower();
            // Create a Blob client
            var featureMapref = container.GetBlobClient(atlasFeaturesFileName);
            //Check the blob is already exists.
            bool useAtlas = rebuild || !await featureMapref.ExistsAsync();
            List<Feature> features;
            

            if (prerequisites)
            {                
                var rdi = new Dictionary<string, Dictionary<string, RoomDataItem>>();
                try
                {
                    if (useAtlas)
                    {
                        //Get the list of Feature.
                        features = await MapsService.FetchFeaturesFromAtlas(buildingConfig.DatasetId, buildingConfig.SubscriptionKey);
                        //Create a Blob async upload operation.
                        await featureMapref.UploadAsync(BinaryData.FromObjectAsJson(features), overwrite: true);
                    }
                    else
                    {
                        //Create a ReadBlobData operation and return the data of the BuildingConfig.
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

                return new OkObjectResult(JsonSerializer.Serialize(rdi));
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

        private static async Task<IEnumerable<BuildingConfig>> FetchAtlasConfig(BlobClient configRef)
        {
            BlobDownloadResult result = await configRef.DownloadContentAsync();
            BuildingConfig[] config = result.Content.ToObjectFromJson<BuildingConfig[]>();

            return config;
        }        
    }
}
