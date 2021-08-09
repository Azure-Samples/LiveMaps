using System;
using System.Collections.Generic;
using System.Reflection.Metadata;
using System.Threading.Tasks;
using Azure.Storage.Blobs;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.Extensions.Logging;
using ssir.api.Models;
using ssir.api.Models.Atlas;
using ssir.api.Services;

namespace ssir.api
{
    public static class RoomStateSim
    {
        [FunctionName("RoomStateSim")]
        public static async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Function, "get", Route = "statesim")] HttpRequest req,
            [Blob("shared", Connection = "AzureWebJobsStorage")] BlobContainerClient container,
            ILogger log)
        {
            var atlasConfigFile = Environment.GetEnvironmentVariable("AtlasConfigFile") ?? "atlasConfig.json";
            var blobDataService = new BlobDataService();
            var atlasConfig = await blobDataService.ReadBlobData<BuildingConfig[]>(container, atlasConfigFile);

            foreach (var buildingConfig in atlasConfig)
            {
                var buidingFileBase = buildingConfig.BuildingId.ToLower().Replace("/", "_");
                var buildingStateFileName = $"{buidingFileBase}_state.json";
                var buildingStateRef = container.GetBlobClient(buildingStateFileName);
                bool buildInitialState = !await buildingStateRef.ExistsAsync();
                var buildingStateSet = new Dictionary<string, UnitStateSet>();

                if (buildInitialState)
                {
                    Random rnd = new Random();
                    List<Feature> features;                    

                    var atlasFeaturesFileName = $"{buidingFileBase}_featuremap.json".ToLower();
                    var featureMapRef = container.GetBlobClient(atlasFeaturesFileName);
                    bool useAtlas = !await featureMapRef.ExistsAsync();
                    if (useAtlas)
                    {
                        features = await MapsService.FetchFeaturesFromAtlas(buildingConfig.DatasetId, buildingConfig.SubscriptionKey);
                        await featureMapRef.UploadAsync(BinaryData.FromObjectAsJson(features), overwrite: true);
                    }
                    else
                    {
                        features = await blobDataService.ReadBlobData<List<Feature>>(container, atlasFeaturesFileName);
                    }
                    foreach(var feature in features)
                    {
                        var name = $"{buildingConfig.BuildingId}/{feature.Properties.LevelId}/{feature.Properties.Name}";
                        if (!buildingStateSet.ContainsKey(name))
                        {
                            buildingStateSet.Add(name, new UnitStateSet { unitName = feature.Id, states = GetDefaultStates(rnd, buildingConfig.StateSets) });
                        }
                    }
                    await buildingStateRef.UploadAsync(BinaryData.FromObjectAsJson(buildingStateSet), overwrite:true);
                }
                else
                {
                    buildingStateSet = await blobDataService.ReadBlobData<Dictionary<string, UnitStateSet>>(container, buildingStateFileName);
                }

                foreach (var stateSetCfg in buildingConfig.StateSets)
                {

                    if (stateSetCfg != null)
                    {
                        var mapsService = new MapsService(buildingConfig.SubscriptionKey, buildingConfig.DatasetId, stateSetCfg.StateSetId.ToString());
                        foreach (var buildingState in buildingStateSet)
                        {
                            if(buildingState.Value.states.ContainsKey(stateSetCfg.StateSetName))
                                await mapsService.UpdateTagState(
                                    stateSetCfg.StateSetName,
                                    buildingState.Value.unitName,
                                    buildingState.Value.states[stateSetCfg.StateSetName]);
                        }                       
                       
                    }                   
                    
                }
               
            }

            return new OkObjectResult("Ok");
        }
        
        public static Dictionary<string, string> GetDefaultStates(Random rnd, StateSet[] stateSets)
        {
            
            var states = new Dictionary<string, string>();
            foreach(var state in stateSets)
            {
                int val = rnd.Next(0, 10);
                if (state.StateSetName == "temperature")
                    val = rnd.Next(65, 85);
                if (state.StateSetName == "occupancy")
                    val = rnd.Next(0, 20);
                states.Add(state.StateSetName, val.ToString());
            }

            return states;
        } 
    }

    public class UnitStateSet
    {        
        public string unitName { get; set; }        
        public Dictionary<string, string> states = new Dictionary<string, string>();
    }
}
