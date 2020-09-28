using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Azure.EventHubs;
using Microsoft.Azure.WebJobs;
using Microsoft.Extensions.Logging;
using Microsoft.WindowsAzure.Storage.Blob;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using ssir.api.Models;
using ssir.api.Services;

namespace AzureMapsStatusPublisher
{
    public static class FeatureStatePublisher
    {       

        [FunctionName("UpdateFeatureState")]
        public static async Task Run([EventHubTrigger("updatestate", Connection = "EventHubCS")] EventData[] events,
                                      [Blob("refdata", Connection = "AzureWebJobsStorage")] CloudBlobContainer container,
                                      ILogger log)
        {
            var atlasConfigFile = Environment.GetEnvironmentVariable("AtlasConfigFile") ?? "atlasConfig.json";
            var exceptions = new List<Exception>();
            bool prerequisites = true;
            bool updateRecentData = false;
                      
            var recentDataFile = Environment.GetEnvironmentVariable("RecentDataFile");
            var blobDataService = new BlobDataService();
            var atlasConfig = await blobDataService.ReadBlobData<BuildingConfig[]>(container, atlasConfigFile);

            var mapsServices = new Dictionary<string, MapsService>();
            foreach(var buildingConfig in atlasConfig)
            {
                foreach(var stateSet in buildingConfig.StateSets)
                {
                    string statesetid = stateSet.StateSetId.ToString();
                    if (!mapsServices.ContainsKey(statesetid))
                    {
                        mapsServices.Add(statesetid, new MapsService(buildingConfig.SubscriptionKey, buildingConfig.DatasetId, statesetid));
                    }
                }
            }
           

            if (prerequisites)
            {
                await container.CreateIfNotExistsAsync();
                var bacmapRef = container.GetBlockBlobReference(recentDataFile);

                IEnumerable<dynamic> recentdata;
                using (var ms = new MemoryStream())
                {
                    await bacmapRef.DownloadToStreamAsync(ms);
                    ms.Position = 0;
                    using (StreamReader reader = new StreamReader(ms, Encoding.UTF8))
                    {
                        var bacmapstr = reader.ReadToEnd();
                        recentdata = JsonConvert.DeserializeObject<IEnumerable<dynamic>>(bacmapstr);
                    }
                }

                foreach (EventData eventData in events)
                {
                    try
                    {
                        string messageBody = Encoding.UTF8.GetString(eventData.Body.Array, eventData.Body.Offset, eventData.Body.Count);
                        var dataItems = JsonConvert.DeserializeObject<IEnumerable<TagObject>>(messageBody);

                        if (dataItems != null)
                        {
                            foreach (var dataItem in dataItems)
                            {
                                if (dataItem != null)
                                {                                    
                                    foreach (var i in recentdata.Where(tag => tag.DeviceId == dataItem.DeviceId))
                                    {
                                        //var cv = i.CurrentValue as JValue;
                                        double curVal = double.MinValue;
                                        var cv = i.CurrentValue;
                                        if (cv != null)
                                            Double.TryParse(((JValue)cv).Value.ToString(), out curVal);

                                        if (dataItem.Value != curVal)
                                        {
                                            i.CurrentValue = dataItem.Value;
                                            updateRecentData = true;
                                            var res = mapsServices[dataItem.DeviceId].UpdateTagState(dataItem.TagName, dataItem.MapFeatureId, dataItem.Value.ToString());
                                        }
                                    }
                                }
                            }
                        }

                        // Replace these two lines with your processing logic.
                        log.LogInformation($"C# Event Hub trigger function processed a message: {messageBody}");
                        await Task.Yield();
                    }
                    catch (Exception e)
                    {
                        // We need to keep processing the rest of the batch - capture this exception and continue.
                        // Also, consider capturing details of the message that failed processing so it can be processed again later.
                        exceptions.Add(e);
                    }
                }
                if (updateRecentData)
                {
                    var rd = JsonConvert.SerializeObject(recentdata);
                    await bacmapRef.UploadTextAsync(rd);
                }
            }

            // Once processing of the batch is complete, if any messages in the batch failed processing throw an exception so that there is a record of the failure.

            if (exceptions.Count > 1)
                throw new AggregateException(exceptions);

            if (exceptions.Count == 1)
                throw exceptions.Single();
        }
    }
}
