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
using Ssir.Api.Models;
using Ssir.Api.Models.Atlas;
using Ssir.Api.Services;

namespace Ssir.Api
{
    public static class RoomStateSim
    {
        /*
         Through RoomStateSim Function, you can get the room feature map from the blob, so as to obtain the status of the room
         */
        [FunctionName("RoomStateSim")]
        public static async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Function, "get", Route = "statesim")] HttpRequest req,
            [Blob("shared", Connection = "AzureWebJobsStorage")] BlobContainerClient container,
            ILogger log)
        {
            //Get the AtlasConfigFile value from environment variable.
            var atlasConfigFile = Environment.GetEnvironmentVariable("AtlasConfigFile") ?? "atlasConfig.json";
            var blobDataService = new BlobDataService();
            //Create a ReadBlobData operation and return the data of the BuildingConfig.
            var atlasConfig = await blobDataService.ReadBlobData<BuildingConfig[]>(container, atlasConfigFile);

            foreach (var buildingConfig in atlasConfig)
            {
                var buidingFileBase = buildingConfig.BuildingId.ToLower().Replace("/", "_");
                var buildingStateFileName = $"{buidingFileBase}_state.json";
                //Create a Blob client.
                var buildingStateRef = container.GetBlobClient(buildingStateFileName);
                //Check the blob is already exists.
                bool buildInitialState = !await buildingStateRef.ExistsAsync();
                var buildingStateSet = new Dictionary<string, UnitStateSet>();

                if (buildInitialState)
                {
                    Random rnd = new Random();
                    List<Feature> features;                    

                    var atlasFeaturesFileName = $"{buidingFileBase}_featuremap.json".ToLower();
                    //Create a Blob client.
                    var featureMapRef = container.GetBlobClient(atlasFeaturesFileName);
                    //Check the blob is already exists.
                    bool useAtlas = !await featureMapRef.ExistsAsync();
                    if (useAtlas)
                    {
                        //Get the list of Feature.
                        features = await MapsService.FetchFeaturesFromAtlas(buildingConfig.DatasetId, buildingConfig.SubscriptionKey);
                        //Create a Blob async upload operation.
                        await featureMapRef.UploadAsync(BinaryData.FromObjectAsJson(features), overwrite: true);
                    }
                    else
                    {
                        //Create a ReadBlobData operation and return the data of the Feature.
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
                    //Create a Blob async upload operation.
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
                            if (buildingState.Value.states.ContainsKey(stateSetCfg.StateSetName))
                            {
                                await mapsService.UpdateTagState(
                                        stateSetCfg.StateSetName,
                                        buildingState.Value.unitName,
                                        buildingState.Value.states[stateSetCfg.StateSetName]);
                            }
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
                {
                    val = rnd.Next(65, 85);
                }
                if (state.StateSetName == "occupancy")
                {
                    val = rnd.Next(0, 20);
                }
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
