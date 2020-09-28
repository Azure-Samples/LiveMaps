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
    public static class RoomStateSim
    {
        [FunctionName("RoomStateSim")]
        public static async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Function, "get", Route = "statesim")] HttpRequest req,
            [Blob("shared", Connection = "AzureWebJobsStorage")] CloudBlobContainer container,
            ILogger log)
        {
            var atlasConfigFile = Environment.GetEnvironmentVariable("AtlasConfigFile") ?? "atlasConfig.json";
            var blobDataService = new BlobDataService();
            var atlasConfig = await blobDataService.ReadBlobData<BuildingConfig[]>(container, atlasConfigFile);

            foreach (var buildingConfig in atlasConfig)
            {
                var buidingFileBase = buildingConfig.BuildingId.ToLower().Replace("/", "_");
                var buildingStateFileName = $"{buidingFileBase}_state.json";
                var buildingStateRef = container.GetBlockBlobReference(buildingStateFileName);
                bool buildInitialState = !await buildingStateRef.ExistsAsync();
                var buildingStateSet = new Dictionary<string, UnitStateSet>();

                if (buildInitialState)
                {
                    Random rnd = new Random();
                    List<Feature> features;                    

                    var atlasFeaturesFileName = $"{buidingFileBase}_featuremap.json".ToLower();
                    var featureMapRef = container.GetBlockBlobReference(atlasFeaturesFileName);
                    bool useAtlas = !await featureMapRef.ExistsAsync();
                    if (useAtlas)
                    {
                        features = await MapsService.FetchFeaturesFromAtlas(buildingConfig.DatasetId, buildingConfig.SubscriptionKey);
                        await featureMapRef.UploadTextAsync(JsonConvert.SerializeObject(features));
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
                    await buildingStateRef.UploadTextAsync(JsonConvert.SerializeObject(buildingStateSet));
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
